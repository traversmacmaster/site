// WebGL2 backend for realtime liquefaction and infection. Gravity sorting
// keeps the portable CPU reference implementation behind the same contract.
import {CHROMATIC_DESCRIPTOR,chromaticParameters,createChromaticPhysics} from './index.mjs';

const blurShader=`uniform sampler2D image;void main(){ivec2 p=ivec2(gl_FragCoord.xy),s=textureSize(image,0);result=(texelFetch(image,clamp(p+ivec2(-1,0),ivec2(0),s-1),0)+texelFetch(image,clamp(p+ivec2(1,0),ivec2(0),s-1),0)+texelFetch(image,clamp(p+ivec2(0,-1),ivec2(0),s-1),0)+texelFetch(image,clamp(p+ivec2(0,1),ivec2(0),s-1),0))*.25;}`;
const flowShader=`uniform sampler2D image,prior;uniform float phase,flow,turbulence,viscosity,mixAmount,time;
vec4 sampleAt(sampler2D im,vec2 q){ivec2 s=textureSize(im,0);q=clamp(q,vec2(0),vec2(s-1));ivec2 a=ivec2(floor(q)),b=min(a+1,s-1);vec2 f=fract(q);return mix(mix(texelFetch(im,a,0),texelFetch(im,ivec2(b.x,a.y),0),f.x),mix(texelFetch(im,ivec2(a.x,b.y),0),texelFetch(im,b,0),f.x),f.y);}
void main(){ivec2 p=ivec2(gl_FragCoord.xy),s=textureSize(image,0);float x=float(p.x),y=float(p.y),angle=time*.7+phase,dx=sin(y*.07+angle)*flow+sin((x+y)*.13+angle*1.7)*turbulence,dy=cos(x*.06-angle)*flow*.5+sin((x-y)*.09+angle)*turbulence;vec4 src=texelFetch(image,p,0),blurred=texelFetch(prior,p,0),warped=sampleAt(prior,vec2(x+dx,y+dy));vec4 value=src+(warped-src)*(1.-viscosity)+(blurred-src)*mixAmount;result=vec4(clamp(value.rgb,vec3(0),vec3(src.a)),clamp(value.a,0.,1.));}`;
const seedColor=`uniform sampler2D image;uniform vec2 origin;void main(){ivec2 s=textureSize(image,0),p=ivec2(round(origin*vec2(s-1)));result=texelFetch(image,p,0);}`;
const startInfection=`uniform sampler2D image,seed;uniform float tolerance;void main(){ivec2 p=ivec2(gl_FragCoord.xy);vec3 c=texelFetch(image,p,0).rgb,s=texelFetch(seed,ivec2(0),0).rgb;result=vec4(distance(c,s)<=tolerance?.15:0.);}`;
const growInfection=`uniform sampler2D image,coverage,seed;uniform float tolerance,spread;void main(){ivec2 p=ivec2(gl_FragCoord.xy),z=textureSize(coverage,0);float near=0.;if(p.x>0)near=max(near,texelFetch(coverage,p+ivec2(-1,0),0).r);if(p.x+1<z.x)near=max(near,texelFetch(coverage,p+ivec2(1,0),0).r);if(p.y>0)near=max(near,texelFetch(coverage,p+ivec2(0,-1),0).r);if(p.y+1<z.y)near=max(near,texelFetch(coverage,p+ivec2(0,1),0).r);vec3 c=texelFetch(image,p,0).rgb,s=texelFetch(seed,ivec2(0),0).rgb;float d=distance(c,s),barrier=clamp(1.-d/max(tolerance,.000001),0.,1.),old=texelFetch(coverage,p,0).r;result=vec4(max(old,near*spread*barrier));}`;
const finishInfection=`uniform sampler2D image,coverage,seed;uniform float spread,decay;void main(){ivec2 p=ivec2(gl_FragCoord.xy);vec4 src=texelFetch(image,p,0);vec3 s=texelFetch(seed,ivec2(0),0).rgb;float amount=clamp(texelFetch(coverage,p,0).r*(1.-decay)*spread,0.,1.);result=vec4(clamp(src.rgb+(s-src.rgb)*amount,vec3(0),vec3(src.a)),src.a);}`;
function rowsFromReadback(data){return data;}

export function createChromaticPhysicsGpu(){
  let env,device,cpuAllocator,cpuEngine,programs={},disposed=false,busy=false;
  return{
    descriptor:CHROMATIC_DESCRIPTOR,
    async initialize(environment){
      if(env||disposed)throw Error('Chromatic Physics GPU cannot initialize twice');device=environment?.services?.['webgl-device'];cpuAllocator=environment?.services?.['cpu-allocator'];
      if(environment?.backend!=='webgl2'||device?.version!==1||device.deviceId!==environment.deviceId||device.allocator!==environment.allocator||!cpuAllocator?.frame)throw Error('Chromatic Physics requires the shared WebGL2 and CPU allocators');
      const cpu=createChromaticPhysics();await cpu.initialize({backend:'cpu',allocator:cpuAllocator,services:{}});cpuEngine=cpu;
      programs={blur:device.kernel(blurShader),flow:device.kernel(flowShader),seed:device.kernel(seedColor),start:device.kernel(startInfection),grow:device.kernel(growInfection),finish:device.kernel(finishInfection)};env=environment;
    },
    async process(evaluation){
      if(!env||disposed||busy)throw Error('Chromatic Physics GPU unavailable or busy');const{input,timeSeconds=input?.timestampSeconds,signal=new AbortController().signal,seed=0}=evaluation,p=chromaticParameters(evaluation.parameters);device.assertFrame(input);if(!Number.isFinite(timeSeconds)||!Number.isSafeInteger(seed)||seed<0)throw Error('Invalid Chromatic Physics evaluation');signal.throwIfAborted();busy=true;let output;const leases=[];
      const makeFrame=()=>{const x=device.allocator.emptyFrame(input);leases.push(x);return x.value;};const makeMask=id=>{const x=device.allocator.mask({id,width:input.width,height:input.height,format:'coverage-f32',origin:input.origin,epoch:input.epoch,sequence:input.sequence});leases.push(x);return x.value;};
      try{
        if(['gravity-sorting','pigment-supernova','gravity-color-split','chromatic-tectonics','pigment-vortexes'].includes(p.mode)){
          const cpuInput=cpuAllocator.emptyFrame(input);try{cpuInput.value.storage.data.set(rowsFromReadback(device.read(input),input.width,input.height));const cpuOutput=await cpuEngine.process({...evaluation,input:cpuInput.value});try{output=device.uploadFrame(cpuOutput.value);}finally{cpuOutput.release();}}finally{cpuInput.release();}
        }else if(p.mode==='chromatic-liquefaction'){
          const mix=p.diffusion*(1-p.viscosity);let prior=input;if(mix){prior=makeFrame();device.draw(programs.blur,prior,{image:input});}output=device.allocator.emptyFrame(input);device.draw(programs.flow,output.value,{image:input,prior},{phase:p.phase,flow:p.flow,turbulence:p.turbulence,viscosity:p.viscosity,mixAmount:mix,time:timeSeconds});
        }else{
          const seedFrame=makeFrame();device.draw(programs.seed,seedFrame,{image:input},{origin:[p.originX,p.originY]});const a=makeMask('infection-a'),b=makeMask('infection-b');device.draw(programs.start,a,{image:input,seed:seedFrame},{tolerance:p.tolerance});let read=a,write=b;for(let step=0;step<p.iterations;step++){signal.throwIfAborted();device.draw(programs.grow,write,{image:input,coverage:read,seed:seedFrame},{tolerance:p.tolerance,spread:p.spread});[read,write]=[write,read];}output=device.allocator.emptyFrame(input);device.draw(programs.finish,output.value,{image:input,coverage:read,seed:seedFrame},{spread:p.spread,decay:p.decay});
        }
        signal.throwIfAborted();return output;
      }catch(error){output?.release();throw error;}finally{leases.forEach(lease=>lease.release());busy=false;}
    },
    reset(){if(busy)throw Error('Chromatic Physics GPU is busy');cpuEngine?.reset();},
    command(name,payload){if(!env||disposed||name!=='reset'||payload!==null)throw Error('Unknown Chromatic Physics GPU command');this.reset();},
    serializeParameters(value){return{engine:'chromatic-physics',version:1,parameters:chromaticParameters(value)};},
    restoreParameters(preset){if(preset?.engine!=='chromatic-physics'||preset.version!==1)throw Error('Unsupported Chromatic Physics preset');return chromaticParameters(preset.parameters);},
    dispose(){if(busy)throw Error('Chromatic Physics GPU is busy');cpuEngine?.dispose();disposed=true;env=undefined;device=undefined;cpuEngine=undefined;programs={};},
  };
}
