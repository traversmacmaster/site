// Optional WebGL2 backend for real-time video work. Frames and leases use the
// shared processing-webgl contract, so hosts can still compose engines/masks.
import {FREQUENCY_DESCRIPTOR,frequencyParameters,createFrequencyWeaver} from './index.mjs';

const blurShader=`uniform sampler2D image;uniform vec2 axis;uniform float radius;
void main(){ivec2 p=ivec2(gl_FragCoord.xy),size=textureSize(image,0);vec4 sum=vec4(0);int r=int(radius);
for(int k=-32;k<=32;k++){if(abs(k)>r)continue;sum+=texelFetch(image,clamp(p+ivec2(axis*float(k)),ivec2(0),size-1),0);}result=sum/(radius*2.+1.);}`;
const combineShader=`uniform sampler2D image,lowBand,midBand;uniform vec3 gain;
void main(){ivec2 p=ivec2(gl_FragCoord.xy);vec4 source=texelFetch(image,p,0),lo=texelFetch(lowBand,p,0),mid=texelFetch(midBand,p,0);result=vec4(clamp(lo.rgb*gain.x+(mid.rgb-lo.rgb)*gain.y+(source.rgb-mid.rgb)*gain.z,vec3(0),vec3(source.a)),source.a);}`;
const sampleFn=`vec4 sampleAt(sampler2D image,vec2 point){ivec2 size=textureSize(image,0);vec2 q=clamp(point,vec2(0),vec2(size-1));ivec2 a=ivec2(floor(q)),b=min(a+1,size-1);vec2 f=fract(q);return mix(mix(texelFetch(image,a,0),texelFetch(image,ivec2(b.x,a.y),0),f.x),mix(texelFetch(image,ivec2(a.x,b.y),0),texelFetch(image,b,0),f.x),f.y);}`;
const moireShader=`uniform sampler2D image;uniform float frequency,rotation,phase,speed,displacement,horizontal,vertical,time;
${sampleFn}
void main(){ivec2 p=ivec2(gl_FragCoord.xy),size=textureSize(image,0);float x=float(p.x),y=float(p.y),cx=float(size.x-1)*.5,cy=float(size.y-1)*.5,angle=rotation*0.017453292519943295,ca=cos(angle),sa=sin(angle),k=6.283185307179586*frequency/float(min(size.x,size.y)),ph=phase+time*speed,dx=x-cx,dy=y-cy,u=(dx*ca+dy*sa)*k+ph,v=(-dx*sa+dy*ca)*k-ph*.73,interference=sin(u)*sin(v),sx=x+interference*displacement*horizontal,sy=y+interference*displacement*vertical;vec4 value=sampleAt(image,vec2(sx,sy));value.a=texelFetch(image,p,0).a;result=value;}`;
const contourShader=`uniform sampler2D image;uniform float threshold,lineDensity,lineThickness,weaveAmount,edgeDisplacement,rotation,speed,time;
${sampleFn}
float lumAt(int x,int y){ivec2 size=textureSize(image,0);ivec2 q=clamp(ivec2(x,y),ivec2(0),size-1);vec4 c=texelFetch(image,q,0);return c.a>0.?dot(c.rgb,vec3(.2126,.7152,.0722))/c.a:0.;}
void main(){ivec2 pixel=ivec2(gl_FragCoord.xy);ivec2 size=textureSize(image,0);int x=pixel.x;int y=pixel.y;
float gx=-lumAt(x-1,y-1)+lumAt(x+1,y-1)-2.*lumAt(x-1,y)+2.*lumAt(x+1,y)-lumAt(x-1,y+1)+lumAt(x+1,y+1);
float gy=-lumAt(x-1,y-1)-2.*lumAt(x,y-1)-lumAt(x+1,y-1)+lumAt(x-1,y+1)+2.*lumAt(x,y+1)+lumAt(x+1,y+1);
float edge=clamp(length(vec2(gx,gy)),0.,1.);float period=max(2.,float(min(size.x,size.y))/lineDensity);float thickness=period*lineThickness;float phase=time*speed*period/6.283185307179586;
float angle=rotation*.017453292519943295;float ca=cos(angle);float sa=sin(angle);float dx=float(x)-float(size.x-1)*.5;float dy=float(y)-float(size.y-1)*.5;
float along=dx*ca+dy*sa;float across=-dx*sa+dy*ca;float waveA=mod(along+phase+period*.5,period);float waveB=mod(across-phase*.71+period*.5,period);
bool lineA=abs(waveA-period*.5)<thickness*.5;bool lineB=abs(waveB-period*.5)<thickness*.5;float weave=lineA!=lineB?1.:0.;float ink=clamp((edge-threshold)*5.,0.,1.)*weaveAmount*weave;
float sx=float(x)+(abs(gx)>abs(gy)?0.:sign(gx)*edgeDisplacement*edge);float sy=float(y)+(abs(gx)>abs(gy)?sign(gy)*edgeDisplacement*edge:0.);
vec4 base=texelFetch(image,pixel,0);vec4 warped=sampleAt(image,vec2(sx,sy));result=vec4(clamp(mix(base.rgb,warped.rgb,ink),vec3(0),vec3(base.a)),base.a);}`;
const interferenceShader=`uniform sampler2D image;uniform float frequency,rotation,phase,speed,displacement,horizontal,vertical,originX,originY,time,kind;
${sampleFn}
void main(){ivec2 p=ivec2(gl_FragCoord.xy),size=textureSize(image,0);float x=float(p.x),y=float(p.y),shortSide=float(min(size.x,size.y)),angle=rotation*.017453292519943295,ca=cos(angle),sa=sin(angle),k=6.283185307179586*frequency/shortSide,ph=phase+time*speed,cx=originX*float(size.x-1),cy=originY*float(size.y-1),dx=x-cx,dy=y-cy,cell=shortSide/frequency,sx=x,sy=y,scale=1.;
if(kind<.5||kind>1.5&&kind<2.5){float radius=length(vec2(dx,dy)),falloff=kind>1.5?exp(-radius/(shortSide*.7)):1.,wave=sin(radius*k+ph)*falloff,amp=displacement*(kind>1.5?4.:2.5);vec2 shift=radius>0.0001?vec2(dx,dy)*(wave*amp/radius):vec2(0);sx=x+shift.x*horizontal;sy=y+shift.y*vertical;if(kind>1.5)scale=.32+.68*falloff;}
else if(kind<1.5){float u=dx*ca+dy*sa,v=-dx*sa+dy*ca,a=sin(u*k+ph),b=sin(v*k-ph*.73),crossing=a*b,amp=displacement*2.5;sx=x+ca*cos(u*k+ph)*crossing*amp*horizontal-sa*cos(v*k-ph*.73)*crossing*amp*vertical;sy=y+sa*cos(u*k+ph)*crossing*amp*horizontal+ca*cos(v*k-ph*.73)*crossing*amp*vertical;scale=min(abs(a),abs(b))<.28?.12:1.;}
else if(kind>3.5&&kind<4.5){float scan=sin((dy*ca+dx*sa)*k+ph),band=sin((dy*ca+dx*sa)*k*.22+ph*.6),offset=scan>0.?1.:-1.;sx=x+offset*displacement*2.*horizontal;sy=y+floor((band+1.)*4.)*vertical;scale=abs(scan)<.24?.18:1.;}
else if(kind>4.5&&kind<5.5){float a=sin(dx*k+ph),b=sin(dy*k*.73-ph*.61),c=sin((dx+dy)*k*.43+ph*.37),wave=a+b+c;sx=x+cos(dy*k*.73-ph*.61)*wave*displacement*horizontal;sy=y-cos(dx*k+ph)*wave*displacement*vertical;scale=.25+.75*(.5+.5*cos(a-b+c));}
else{float u=dx*ca+dy*sa+sin(ph)*cell*.5,v=-dx*sa+dy*ca+cos(ph)*cell*.5;vec2 f=fract(vec2(u,v)/cell)-.5;float radius=length(f)*1.41421356;vec4 src=texelFetch(image,p,0);float lum=src.a>0.?dot(src.rgb,vec3(.2126,.7152,.0722))/src.a:0.,ink=radius<clamp(lum*.76,0.,.5)?1.:0.;scale=ink>.5?.08:1.;float drift=sin((u+v)*k*.5+ph);sx=x+drift*displacement*1.5*horizontal;sy=y+drift*displacement*1.5*vertical;}
vec4 base=texelFetch(image,p,0),warped=sampleAt(image,vec2(sx,sy));float split=kind>1.5&&kind<2.5?displacement*.08:kind>3.5&&kind<4.5?displacement*.65:0.;vec4 red=sampleAt(image,vec2(sx-split,sy+split)),blue=sampleAt(image,vec2(sx+split,sy-split));result=vec4(clamp(vec3(red.r,warped.g,blue.b)*scale,vec3(0),vec3(base.a)),base.a);}`;

export function createFrequencyWeaverGpu(){
  let env,device,cpuAllocator,cpuEngine,programs={},disposed=false,busy=false;
  return{
    descriptor:FREQUENCY_DESCRIPTOR,
    async initialize(environment){
      if(env||disposed)throw Error('Frequency Weaver GPU cannot initialize twice');
      device=environment?.services?.['webgl-device'];
      if(environment?.backend!=='webgl2'||device?.version!==1||device.deviceId!==environment.deviceId||device.allocator!==environment.allocator)throw Error('Frequency Weaver requires the shared WebGL2 device');
      cpuAllocator=environment.services?.['cpu-allocator'];if(cpuAllocator?.frame){cpuEngine=createFrequencyWeaver();await cpuEngine.initialize({backend:'cpu',allocator:cpuAllocator,services:{}});}
      programs={blur:device.kernel(blurShader),combine:device.kernel(combineShader),moire:device.kernel(moireShader),contour:device.kernel(contourShader),interference:device.kernel(interferenceShader)};env=environment;
    },
    async process(evaluation){
      if(!env||disposed||busy)throw Error('Frequency Weaver GPU unavailable or busy');
      const{input,timeSeconds=input?.timestampSeconds,signal=new AbortController().signal}=evaluation,p=frequencyParameters(evaluation.parameters);
      device.assertFrame(input);if(!Number.isFinite(timeSeconds)||!Number.isSafeInteger(evaluation.seed)||evaluation.seed<0)throw Error('Invalid Frequency Weaver clock or seed');
      signal.throwIfAborted();busy=true;const scratch=[];let output;
      const alloc=()=>{const lease=device.allocator.emptyFrame(input);scratch.push(lease);return lease.value;};
      try{
        if(['moire-singularity','spectral-exorcism'].includes(p.mode)){if(!cpuEngine)throw Error('This Frequency Weaver mode requires the optional CPU reference allocator');const cpuInput=cpuAllocator.emptyFrame(input);try{cpuInput.value.storage.data.set(device.read(input));const cpuOutput=await cpuEngine.process({...evaluation,input:cpuInput.value});try{output=device.uploadFrame(cpuOutput.value);signal.throwIfAborted();return output;}finally{cpuOutput.release();}}finally{cpuInput.release();}}
        output=device.allocator.emptyFrame(input);
        if(p.mode==='spectral-separation'){
          const low=alloc(),mid=alloc(),tmp=alloc(),radiusLow=Math.max(1,Math.round(p.lowRadius)),radiusMid=Math.max(1,Math.round(p.midRadius));
          const blur=(source,target,radius)=>{device.draw(programs.blur,tmp,{image:source},{axis:[1,0],radius});device.draw(programs.blur,target,{image:tmp},{axis:[0,1],radius});};
          blur(input,low,radiusLow);blur(input,mid,radiusMid);
          device.draw(programs.combine,output.value,{image:input,lowBand:low,midBand:mid},{gain:[p.lowGain,p.midGain,p.highGain]});
        }else if(p.mode==='moire-displacement')device.draw(programs.moire,output.value,{image:input},{frequency:p.frequency,rotation:p.rotation,phase:p.phase,speed:p.speed,displacement:p.displacement,horizontal:p.horizontal,vertical:p.vertical,time:timeSeconds});
        else if(['ripple-interference','crosshatch-scanlines','radial-lens-waves','halftone-phase-drift','chromatic-slit-scan','lissajous-interference'].includes(p.mode))device.draw(programs.interference,output.value,{image:input},{frequency:p.frequency,rotation:p.rotation,phase:p.phase,speed:p.speed,displacement:p.displacement,horizontal:p.horizontal,vertical:p.vertical,originX:p.originX,originY:p.originY,time:timeSeconds,kind:['ripple-interference','crosshatch-scanlines','radial-lens-waves','halftone-phase-drift','chromatic-slit-scan','lissajous-interference'].indexOf(p.mode)});
        else device.draw(programs.contour,output.value,{image:input},{threshold:p.threshold,lineDensity:p.lineDensity,lineThickness:p.lineThickness,weaveAmount:p.weaveAmount,edgeDisplacement:p.edgeDisplacement,rotation:p.rotation,speed:p.speed,time:timeSeconds});
        signal.throwIfAborted();return output;
      }catch(error){output?.release();throw error;}finally{scratch.forEach(lease=>lease.release());busy=false;}
    },
    reset(){if(busy)throw Error('Frequency Weaver GPU is busy');cpuEngine?.reset();},
    command(name,payload){if(!env||disposed||name!=='reset'||payload!==null)throw Error('Unknown Frequency Weaver GPU command');this.reset();},
    serializeParameters(value){return{engine:'frequency-weaver',version:1,parameters:frequencyParameters(value)};},
    restoreParameters(preset){if(preset?.engine!=='frequency-weaver'||preset.version!==1)throw Error('Unsupported Frequency Weaver preset');return frequencyParameters(preset.parameters);},
    dispose(){if(busy)throw Error('Frequency Weaver GPU is busy');cpuEngine?.dispose();disposed=true;env=undefined;device=undefined;cpuAllocator=undefined;cpuEngine=undefined;programs={};},
  };
}
