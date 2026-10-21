// WebGL2 implementation of the three bounded recursive transforms.
import {RECURSIVE_DESCRIPTOR,recursiveParameters,createRecursiveFeedback} from './index.mjs';

const sampler=`vec4 sampleAt(sampler2D image,vec2 point){ivec2 size=textureSize(image,0);vec2 q=clamp(point,vec2(0),vec2(size-1));ivec2 a=ivec2(floor(q)),b=min(a+1,size-1);vec2 f=fract(q);return mix(mix(texelFetch(image,a,0),texelFetch(image,ivec2(b.x,a.y),0),f.x),mix(texelFetch(image,ivec2(a.x,b.y),0),texelFetch(image,b,0),f.x),f.y);}`;
const feedback=`uniform sampler2D image,history;uniform float hasHistory,feedback,decay,scale,rotation,translateX,translateY,colorShift;
${sampler}
void main(){ivec2 p=ivec2(gl_FragCoord.xy),s=textureSize(image,0);vec4 src=texelFetch(image,p,0);if(hasHistory<.5){result=src;return;}float x=float(p.x),y=float(p.y),cx=float(s.x-1)*.5,cy=float(s.y-1)*.5,a=rotation*.017453292519943295,c=cos(a),sn=sin(a),dx=x-cx,dy=y-cy,sx=cx+(dx*c+dy*sn)/scale+translateX*float(s.x),sy=cy+(-dx*sn+dy*c)/scale+translateY*float(s.y);vec4 old=sampleAt(history,vec2(sx,sy));if(colorShift!=0.)old.rgb=clamp(old.rgb+colorShift*(old.gbr-old.rgb),vec3(0),vec3(1));result=mix(src,old,feedback*decay);}`;
const portals=`uniform sampler2D image;uniform float depth,portalScale,portalRotation,portalMix;
${sampler}
void main(){ivec2 p=ivec2(gl_FragCoord.xy),s=textureSize(image,0);float x=float(p.x),y=float(p.y),cx=float(s.x-1)*.5,cy=float(s.y-1)*.5,a=portalRotation*.017453292519943295,c=cos(a),sn=sin(a),px=x,py=y,weight=portalMix,sum=1.;vec4 acc=texelFetch(image,p,0);
for(int d=0;d<8;d++){if(float(d)>=depth)break;float dx=px-cx,dy=py-cy;px=cx+(dx*c+dy*sn)/portalScale;py=cy+(-dx*sn+dy*c)/portalScale;float amount=weight*pow(portalMix,float(d));acc+=sampleAt(image,vec2(px,py))*amount;sum+=amount;}result=clamp(acc/sum,vec4(0),vec4(1));}`;
const fractured=`uniform sampler2D image,history;uniform float hasHistory,delay,grid,fragmentMotion,fragmentRotation,fragmentScale,decay,seed;
${sampler}
uint hashBits(uint n){n=(n^61u)^(n>>16u);n*=9u;n^=n>>4u;n*=0x27d4eb2du;return(n^ (n>>15u));}float randomValue(uint n){return float(hashBits(n))/4294967296.;}
void main(){ivec2 p=ivec2(gl_FragCoord.xy),s=textureSize(image,0);float x=float(p.x),y=float(p.y),gx=min(grid-1.,floor(x*grid/float(s.x))),gy=min(grid-1.,floor(y*grid/float(s.y))),id=gy*grid+gx;uint base=uint(seed);float r=randomValue(base+uint(id)*1013u),r2=randomValue(base+uint(id)*7919u+7u),r3=randomValue(base+uint(id)*1543u+19u),sx=x,sy=y,a=0.,sc=1.;bool isActive=r<delay&&delay>0.;if(isActive){sx+=(r2*2.-1.)*fragmentMotion;sy+=(r3*2.-1.)*fragmentMotion;a=(r2*2.-1.)*fragmentRotation*.017453292519943295;sc=1.+(r3*2.-1.)*fragmentScale;}float c=cos(a),sn=sin(a),dx=sx-x,dy=sy-y,tx=x+(dx*c+dy*sn)/sc,ty=y+(-dx*sn+dy*c)/sc;vec4 src=texelFetch(image,p,0),prior=hasHistory>.5&&isActive?sampleAt(history,vec2(tx,ty)):sampleAt(image,vec2(tx,ty));result=mix(src,prior,(hasHistory>.5&&isActive)?decay:1.);}`;

export function createRecursiveFeedbackGpu({maxHistoryBytes=64*1048576}={}){
  if(!Number.isSafeInteger(maxHistoryBytes)||maxHistoryBytes<16)throw Error('Invalid Recursive Feedback GPU history bound');let env,device,cpuAllocator,cpuEngine,programs={},history,key,lastSequence=-1,lastTime=-Infinity,lastMode,disposed=false,busy=false;
  const clear=()=>{history?.release();history=undefined;key=undefined;lastSequence=-1;lastTime=-Infinity;lastMode=undefined;};
  return{
    descriptor:RECURSIVE_DESCRIPTOR,
    async initialize(environment){if(env||disposed)throw Error('Recursive Feedback GPU cannot initialize twice');device=environment?.services?.['webgl-device'];if(environment?.backend!=='webgl2'||device?.version!==1||device.deviceId!==environment.deviceId||device.allocator!==environment.allocator)throw Error('Recursive Feedback requires the shared WebGL2 device');cpuAllocator=environment.services?.['cpu-allocator'];if(cpuAllocator?.frame){cpuEngine=createRecursiveFeedback({maxHistoryBytes});await cpuEngine.initialize({backend:'cpu',allocator:cpuAllocator,services:{}});}programs={feedback:device.kernel(feedback),portals:device.kernel(portals),fractured:device.kernel(fractured)};env=environment;},
    async process(evaluation){
      if(!env||disposed||busy)throw Error('Recursive Feedback GPU unavailable or busy');const{input,timeSeconds=input?.timestampSeconds,discontinuity='none',signal=new AbortController().signal,seed}=evaluation,p=recursiveParameters(evaluation.parameters);device.assertFrame(input);if(!Number.isFinite(timeSeconds)||!Number.isSafeInteger(seed)||seed<0||!['none','seek','loop','source','resize'].includes(discontinuity))throw Error('Invalid Recursive Feedback GPU evaluation');signal.throwIfAborted();busy=true;let output,candidate;const nextKey=`${input.sourceId}/${input.epoch}/${input.width}/${input.height}/${p.mode}`;
      try{if(discontinuity!=='none'||key&&key!==nextKey||input.sequence<=lastSequence||input.timestampSeconds<lastTime)clear();if(input.width*input.height*16>maxHistoryBytes)throw Error('Recursive Feedback frame exceeds GPU history byte limit');if(['tesseract-recursion','recursive-black-ice','zoom-loop'].includes(p.mode)){if(!cpuEngine)throw Error('This Recursive Feedback mode requires the optional CPU reference allocator');const cpuInput=cpuAllocator.emptyFrame(input);try{cpuInput.value.storage.data.set(device.read(input));const cpuOutput=await cpuEngine.process({...evaluation,input:cpuInput.value});try{output=device.uploadFrame(cpuOutput.value);signal.throwIfAborted();return output;}finally{cpuOutput.release();}}finally{cpuInput.release();}}output=device.allocator.emptyFrame(input);
        if(p.mode==='feedback-architecture')device.draw(programs.feedback,output.value,{image:input,history:history?.value??input},{hasHistory:history?1:0,feedback:p.feedback,decay:p.decay,scale:p.scale,rotation:p.rotation,translateX:p.translateX,translateY:p.translateY,colorShift:p.colorShift});
        else if(p.mode==='recursive-portals'||p.mode==='kaleidoscope-tunnel')device.draw(programs.portals,output.value,{image:input},{depth:p.depth,portalScale:p.portalScale,portalRotation:p.portalRotation,portalMix:p.portalMix});
        else device.draw(programs.fractured,output.value,{image:input,history:history?.value??input},{hasHistory:history?1:0,delay:p.delay,grid:p.grid,fragmentMotion:p.fragmentMotion,fragmentRotation:p.fragmentRotation,fragmentScale:p.fragmentScale,decay:p.decay,seed:(seed^p.seed)>>>0});
        signal.throwIfAborted();candidate=device.allocator.copy(input);signal.throwIfAborted();history?.release();history=candidate;candidate=undefined;key=nextKey;lastSequence=input.sequence;lastTime=input.timestampSeconds;lastMode=p.mode;return output;
      }catch(error){output?.release();throw error;}finally{candidate?.release();busy=false;}
    },
    reset(){if(busy)throw Error('Recursive Feedback GPU is busy');clear();cpuEngine?.reset();},
    command(name,payload){if(!env||disposed||name!=='reset'||payload!==null)throw Error('Unknown Recursive Feedback GPU command');this.reset();},
    serializeParameters(value){return{engine:'recursive-feedback',version:1,parameters:recursiveParameters(value)};},
    restoreParameters(preset){if(preset?.engine!=='recursive-feedback'||preset.version!==1)throw Error('Unsupported Recursive Feedback preset');return recursiveParameters(preset.parameters);},
    dispose(){if(busy)throw Error('Recursive Feedback GPU is busy');clear();cpuEngine?.dispose();disposed=true;env=undefined;device=undefined;cpuAllocator=undefined;cpuEngine=undefined;programs={};},
  };
}
