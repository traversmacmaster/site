// Independent spatial-frequency engine. No host, UI, media decoder or engine imports.
const modes=['spectral-separation','moire-displacement','contour-loom','ripple-interference','crosshatch-scanlines','radial-lens-waves','halftone-phase-drift','chromatic-slit-scan','lissajous-interference','moire-singularity','spectral-exorcism'];
const defaults=Object.freeze({mode:'spectral-separation',lowGain:1,midGain:1,highGain:1,lowRadius:8,midRadius:2,
  frequency:8,rotation:0,phase:0,speed:.4,displacement:12,horizontal:1,vertical:1,originX:.5,originY:.5,
  threshold:.16,lineDensity:18,lineThickness:.22,weaveAmount:.7,edgeDisplacement:4});
const schema={
  mode:{type:'enum',default:'spectral-separation',options:modes,modulation:'none'},
  lowGain:{type:'number',default:1,min:0,max:4,modulation:'continuous'},
  midGain:{type:'number',default:1,min:0,max:4,modulation:'continuous'},
  highGain:{type:'number',default:1,min:0,max:4,modulation:'continuous'},
  lowRadius:{type:'number',default:8,min:1,max:32,unit:'pixels',modulation:'continuous'},
  midRadius:{type:'number',default:2,min:1,max:16,unit:'pixels',modulation:'continuous'},
  frequency:{type:'number',default:8,min:1,max:64,unit:'cycles per short edge',modulation:'continuous'},
  rotation:{type:'number',default:0,min:-180,max:180,unit:'degrees',modulation:'continuous'},
  phase:{type:'number',default:0,min:-Math.PI*4,max:Math.PI*4,unit:'radians',modulation:'continuous'},
  speed:{type:'number',default:.4,min:-8,max:8,unit:'radians per second',modulation:'continuous'},
  displacement:{type:'number',default:12,min:0,max:256,unit:'pixels',modulation:'continuous'},
  horizontal:{type:'number',default:1,min:-2,max:2,modulation:'continuous'},
  vertical:{type:'number',default:1,min:-2,max:2,modulation:'continuous'},
  originX:{type:'number',default:.5,min:0,max:1,modulation:'continuous'},
  originY:{type:'number',default:.5,min:0,max:1,modulation:'continuous'},
  threshold:{type:'number',default:.16,min:0,max:1,modulation:'continuous'},
  lineDensity:{type:'number',default:18,min:1,max:128,unit:'lines per short edge',modulation:'continuous'},
  lineThickness:{type:'number',default:.22,min:.02,max:.9,modulation:'continuous'},
  weaveAmount:{type:'number',default:.7,min:0,max:1,modulation:'continuous'},
  edgeDisplacement:{type:'number',default:4,min:0,max:64,unit:'pixels',modulation:'continuous'},
};
export const FREQUENCY_MODES=Object.freeze([...modes]);
export const FREQUENCY_DESCRIPTOR=Object.freeze({id:'frequency-weaver',contractVersion:1,parameterVersion:1,
  modes:FREQUENCY_MODES,backends:Object.freeze(['cpu','webgl2']),requiredServices:Object.freeze({}),
  parameters:Object.freeze(Object.fromEntries(Object.entries(schema).map(([k,v])=>[k,Object.freeze({...v,options:v.options&&Object.freeze([...v.options])})])))});

export function frequencyParameters(value={}){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!Object.hasOwn(defaults,k)))throw Error('Unknown Frequency Weaver parameter');
  const p={...defaults,...value};
  if(!modes.includes(p.mode))throw Error('Invalid Frequency Weaver mode');
  for(const [key,rule]of Object.entries(schema))if(rule.type==='number'&&(!Number.isFinite(p[key])||p[key]<rule.min||p[key]>rule.max))throw Error(`Invalid Frequency Weaver parameter: ${key}`);
  return p;
}

const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function assertFrame(frame){
  if(!frame||!Number.isSafeInteger(frame.width)||frame.width<1||!Number.isSafeInteger(frame.height)||frame.height<1||
    !Number.isSafeInteger(frame.width*frame.height*16)||frame.format!=='linear-srgb-premultiplied-rgba'||frame.origin!=='top-left'||
    typeof frame.sourceId!=='string'||!frame.sourceId||!Number.isSafeInteger(frame.epoch)||frame.epoch<0||!Number.isSafeInteger(frame.sequence)||frame.sequence<0||
    !Number.isFinite(frame.timestampSeconds)||frame.storage?.kind!=='cpu'||!(frame.storage.data instanceof Float32Array)||frame.storage.data.length!==frame.width*frame.height*4)throw Error('Invalid Frequency Weaver frame');
  const data=frame.storage.data;for(let i=0;i<data.length;i+=4){const a=data[i+3];if(!Number.isFinite(a)||a<0||a>1)throw Error('Invalid Frequency Weaver alpha');for(let c=0;c<3;c++)if(!Number.isFinite(data[i+c])||data[i+c]<0||data[i+c]>a)throw Error('Invalid premultiplied Frequency Weaver color');}
}
const pixel=(d,w,h,x,y,c)=>{x=clamp(x,0,w-1);y=clamp(y,0,h-1);return d[(y*w+x)*4+c];};
function bilinear(d,w,h,x,y,c){x=clamp(x,0,w-1);y=clamp(y,0,h-1);const x0=x|0,y0=y|0,x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1),fx=x-x0,fy=y-y0;return (pixel(d,w,h,x0,y0,c)*(1-fx)+pixel(d,w,h,x1,y0,c)*fx)*(1-fy)+(pixel(d,w,h,x0,y1,c)*(1-fx)+pixel(d,w,h,x1,y1,c)*fx)*fy;}
const yieldFrame=()=>new Promise(resolve=>setTimeout(resolve,0));
async function blur(src,dst,tmp,w,h,r,signal){
  const diameter=r*2+1;
  for(let y=0;y<h;y++){if((y&15)===0){signal.throwIfAborted();if(y){await yieldFrame();signal.throwIfAborted();}}for(let x=0;x<w;x++)for(let c=0;c<4;c++){let sum=0;for(let k=-r;k<=r;k++)sum+=pixel(src,w,h,x+k,y,c);tmp[(y*w+x)*4+c]=sum/diameter;}}
  for(let y=0;y<h;y++){if((y&15)===0){signal.throwIfAborted();if(y){await yieldFrame();signal.throwIfAborted();}}for(let x=0;x<w;x++)for(let c=0;c<4;c++){let sum=0;for(let k=-r;k<=r;k++)sum+=pixel(tmp,w,h,x,y+k,c);dst[(y*w+x)*4+c]=sum/diameter;}}
}
async function spectral(input,out,low,tmp,w,h,p,signal){
  await blur(input,low,tmp,w,h,Math.max(1,Math.round(p.lowRadius)),signal);await blur(input,out,tmp,w,h,Math.max(1,Math.round(p.midRadius)),signal);
  for(let y=0;y<h;y++){if((y&15)===0){signal.throwIfAborted();if(y){await yieldFrame();signal.throwIfAborted();}}for(let x=0;x<w;x++){const i=(y*w+x)*4,a=input[i+3];for(let c=0;c<3;c++)out[i+c]=clamp(low[i+c]*p.lowGain+(out[i+c]-low[i+c])*p.midGain+(input[i+c]-out[i+c])*p.highGain,0,a);out[i+3]=a;}}
}
async function moire(input,out,w,h,p,time,signal){
  const angle=p.rotation*Math.PI/180,ca=Math.cos(angle),sa=Math.sin(angle),k=Math.PI*2*p.frequency/Math.min(w,h),phase=p.phase+time*p.speed,cx=(w-1)/2,cy=(h-1)/2;
  for(let y=0;y<h;y++){if((y&15)===0){signal.throwIfAborted();if(y){await yieldFrame();signal.throwIfAborted();}}for(let x=0;x<w;x++){
    const dx=x-cx,dy=y-cy,u=(dx*ca+dy*sa)*k+phase,v=(-dx*sa+dy*ca)*k-phase*.73;
    const interference=Math.sin(u)*Math.sin(v),sx=x+interference*p.displacement*p.horizontal,sy=y+interference*p.displacement*p.vertical,i=(y*w+x)*4;
    for(let c=0;c<3;c++)out[i+c]=bilinear(input,w,h,sx,sy,c);out[i+3]=input[i+3];
  }}
}
async function interference(input,out,w,h,p,time,kind,signal){
  const angle=p.rotation*Math.PI/180,ca=Math.cos(angle),sa=Math.sin(angle),short=Math.min(w,h),k=Math.PI*2*p.frequency/short,phase=p.phase+time*p.speed,cx=p.originX*(w-1),cy=p.originY*(h-1),cell=short/p.frequency;
  for(let y=0;y<h;y++){if((y&15)===0){signal.throwIfAborted();if(y){await yieldFrame();signal.throwIfAborted();}}for(let x=0;x<w;x++){
    const dx=x-cx,dy=y-cy,i=(y*w+x)*4;let sx=x,sy=y,scale=1;
    if(kind==='ripple-interference'||kind==='radial-lens-waves'){const r=Math.hypot(dx,dy),falloff=kind==='radial-lens-waves'?Math.exp(-r/(short*.7)):1,wave=Math.sin(r*k+phase)*falloff,amplitude=p.displacement*(kind==='radial-lens-waves'?4:2.5),direction=r>1e-5?wave*amplitude/r:0;sx=x+dx*direction*p.horizontal;sy=y+dy*direction*p.vertical;if(kind==='radial-lens-waves')scale=.32+.68*falloff;}
    else if(kind==='crosshatch-scanlines'){const u=dx*ca+dy*sa,v=-dx*sa+dy*ca,a=Math.sin(u*k+phase),b=Math.sin(v*k-phase*.73),cross=a*b,amp=p.displacement*2.5;sx=x+ca*Math.cos(u*k+phase)*cross*amp*p.horizontal-sa*Math.cos(v*k-phase*.73)*cross*amp*p.vertical;sy=y+sa*Math.cos(u*k+phase)*cross*amp*p.horizontal+ca*Math.cos(v*k-phase*.73)*cross*amp*p.vertical;const stripe=Math.min(Math.abs(a),Math.abs(b));scale=stripe<.28?.12:1;}
    else if(kind==='halftone-phase-drift'){const u=dx*ca+dy*sa+Math.sin(phase)*cell*.5,v=-dx*sa+dy*ca+Math.cos(phase)*cell*.5,fx=((u%cell)+cell)%cell/cell-.5,fy=((v%cell)+cell)%cell/cell-.5,r=Math.hypot(fx,fy)*Math.SQRT2,lum=luminance(input,w,h,x,y),dot=clamp(lum*.76,0,.5),ink=r<dot?1:0;scale=ink?.08:1;const flow=Math.sin((u+v)*k*.5+phase);sx=x+flow*p.displacement*1.5*p.horizontal;sy=y+flow*p.displacement*1.5*p.vertical;}
    else if(kind==='chromatic-slit-scan'){const scan=Math.sin((dy*ca+dx*sa)*k+phase),band=Math.sin((dy*ca+dx*sa)*k*.22+phase*.6),offset=scan>0?1:-1;sx=x+offset*p.displacement*2*p.horizontal;sy=y+Math.floor((band+1)*4)*p.vertical;scale=Math.abs(scan)<.24?.18:1;}
    else {const a=Math.sin(dx*k+phase),b=Math.sin(dy*k*.73-phase*.61),c=Math.sin((dx+dy)*k*.43+phase*.37),wave=a+b+c;sx=x+Math.cos(dy*k*.73-phase*.61)*wave*p.displacement*p.horizontal;sy=y-Math.cos(dx*k+phase)*wave*p.displacement*p.vertical;scale=.25+.75*(.5+.5*Math.cos(a-b+c));}
    for(let c=0;c<3;c++){const split=kind==='radial-lens-waves'?(c-1)*p.displacement*.08:kind==='chromatic-slit-scan'?(c-1)*p.displacement*.65:0;out[i+c]=bilinear(input,w,h,sx+split,sy-split,c)*scale;}out[i+3]=input[i+3];
  }}
}
function luminance(d,w,h,x,y){x=clamp(x,0,w-1);y=clamp(y,0,h-1);const i=(y*w+x)*4,a=d[i+3];if(a<=1e-8)return 0;return (.2126*d[i]+.7152*d[i+1]+.0722*d[i+2])/a;}
async function contour(input,out,w,h,p,time,signal){
  const period=Math.max(2,Math.min(w,h)/p.lineDensity),thickness=period*p.lineThickness,phase=time*p.speed*period/(Math.PI*2),angle=p.rotation*Math.PI/180,ca=Math.cos(angle),sa=Math.sin(angle);
  for(let y=0;y<h;y++){if((y&15)===0){signal.throwIfAborted();if(y){await yieldFrame();signal.throwIfAborted();}}for(let x=0;x<w;x++){
    const gx=-luminance(input,w,h,x-1,y-1)+luminance(input,w,h,x+1,y-1)-2*luminance(input,w,h,x-1,y)+2*luminance(input,w,h,x+1,y)-luminance(input,w,h,x-1,y+1)+luminance(input,w,h,x+1,y+1);
    const gy=-luminance(input,w,h,x-1,y-1)-2*luminance(input,w,h,x,y-1)-luminance(input,w,h,x+1,y-1)+luminance(input,w,h,x-1,y+1)+2*luminance(input,w,h,x,y+1)+luminance(input,w,h,x+1,y+1);
    const edge=clamp(Math.hypot(gx,gy),0,1),dx=x-(w-1)/2,dy=y-(h-1)/2,along=dx*ca+dy*sa,across=-dx*sa+dy*ca;
    const lineA=Math.abs(((along+phase)%period+period)%period-period/2)<thickness/2;
    const lineB=Math.abs(((across-phase*.71)%period+period)%period-period/2)<thickness/2;
    const weave=(lineA!==lineB)?1:0,ink=clamp((edge-p.threshold)*5,0,1)*p.weaveAmount*weave,i=(y*w+x)*4;
    const sx=x+(Math.abs(gx)>Math.abs(gy)?0:Math.sign(gx)*p.edgeDisplacement*edge),sy=y+(Math.abs(gx)>Math.abs(gy)?Math.sign(gy)*p.edgeDisplacement*edge:0);
    for(let c=0;c<3;c++)out[i+c]=input[i+c]+(bilinear(input,w,h,sx,sy,c)-input[i+c])*ink;out[i+3]=input[i+3];
  }}
}
async function moireSingularity(input,out,w,h,p,time,signal){
 const cx=p.originX*(w-1),cy=p.originY*(h-1),limit=Math.max(1,Math.min(w,h)*.62),k=Math.PI*2*p.frequency/Math.min(w,h),phase=p.phase+time*p.speed;
 for(let y=0;y<h;y++){if((y&15)===0){signal.throwIfAborted();if(y){await yieldFrame();signal.throwIfAborted();}}for(let x=0;x<w;x++){const i=(y*w+x)*4,dx=x-cx,dy=y-cy,r=Math.hypot(dx,dy),fall=Math.pow(Math.max(0,1-r/limit),2),wave=Math.sin(r*k-phase+Math.atan2(dy,dx)*3),swirl=phase*.18*fall,co=Math.cos(swirl),si=Math.sin(swirl),invR=r>1e-5?1/r:0,sx=cx+(dx*co-dy*si)*(1-fall*.42)+dx*invR*wave*p.displacement*fall,sy=cy+(dx*si+dy*co)*(1-fall*.42)+dy*invR*wave*p.displacement*fall,split=p.displacement*.09*fall;out[i]=bilinear(input,w,h,sx-split,sy,0);out[i+1]=bilinear(input,w,h,sx,sy,1);out[i+2]=bilinear(input,w,h,sx+split,sy,2);out[i+3]=input[i+3];}}
}
async function spectralExorcism(input,out,w,h,p,time,signal){
 const phase=p.phase+time*p.speed,period=Math.max(2,Math.min(w,h)/p.lineDensity),dxMax=Math.max(1,p.displacement);
 for(let y=0;y<h;y++){if((y&15)===0){signal.throwIfAborted();if(y){await yieldFrame();signal.throwIfAborted();}}for(let x=0;x<w;x++){const i=(y*w+x)*4,gx=luminance(input,w,h,x+1,y)-luminance(input,w,h,x-1,y),gy=luminance(input,w,h,x,y+1)-luminance(input,w,h,x,y-1),edge=clamp(Math.hypot(gx,gy)*4,0,1),wave=Math.sin((x*Math.cos(p.rotation*Math.PI/180)+y*Math.sin(p.rotation*Math.PI/180))/period*6.2831853+phase),tear=wave*dxMax*(.2+edge),split=(1+edge)*Math.max(1,p.edgeDisplacement),band=Math.sin(y/Math.max(1,period*.42)+phase*.7),sx=x+tear,sy=y+band*p.displacement*.16;out[i]=bilinear(input,w,h,sx+split,sy,0);out[i+1]=bilinear(input,w,h,sx,sy,1);out[i+2]=bilinear(input,w,h,sx-split,sy,2);out[i+3]=input[i+3];}}
}
export function createFrequencyWeaver(){
  let environment,disposed=false,busy=false;
  return{
    descriptor:FREQUENCY_DESCRIPTOR,
    async initialize(env){if(environment||disposed)throw Error('Frequency Weaver cannot initialize twice');if(env?.backend!=='cpu'||!env.allocator?.frame)throw Error('Frequency Weaver requires the CPU reference backend');environment=env;},
    async process(evaluation){
      if(!environment||disposed||busy)throw Error('Frequency Weaver unavailable or busy');
      const {input,timeSeconds=input?.timestampSeconds,signal=new AbortController().signal}=evaluation,p=frequencyParameters(evaluation.parameters);
      if(!Number.isFinite(timeSeconds)||!Number.isSafeInteger(evaluation.seed)||evaluation.seed<0)throw Error('Invalid Frequency Weaver clock or seed');
      assertFrame(input);signal.throwIfAborted();busy=true;let output;const scratch=[];
      try{
        output=environment.allocator.frame(input);const src=input.storage.data,dst=output.value.storage.data;
        if(p.mode==='spectral-separation'){const{storage,...metadata}=input;scratch.push(environment.allocator.emptyFrame(metadata));scratch.push(environment.allocator.emptyFrame(metadata));await spectral(src,dst,scratch[0].value.storage.data,scratch[1].value.storage.data,input.width,input.height,p,signal);}
        else if(p.mode==='moire-displacement')await moire(src,dst,input.width,input.height,p,timeSeconds,signal);
        else if(p.mode==='moire-singularity')await moireSingularity(src,dst,input.width,input.height,p,timeSeconds,signal);
        else if(p.mode==='spectral-exorcism')await spectralExorcism(src,dst,input.width,input.height,p,timeSeconds,signal);
        else if(['ripple-interference','crosshatch-scanlines','radial-lens-waves','halftone-phase-drift','chromatic-slit-scan','lissajous-interference'].includes(p.mode))await interference(src,dst,input.width,input.height,p,timeSeconds,p.mode,signal);
        else await contour(src,dst,input.width,input.height,p,timeSeconds,signal);
        signal.throwIfAborted();for(let i=0;i<dst.length;i+=4){const a=Math.max(0,Math.min(1,dst[i+3]));dst[i+3]=a;for(let c=0;c<3;c++)dst[i+c]=Math.max(0,Math.min(a,dst[i+c]));}return output;
      }catch(error){output?.release();throw error;}finally{scratch.forEach(lease=>lease.release());busy=false;}
    },
    reset(){if(busy)throw Error('Frequency Weaver is busy');},
    command(name,payload){if(!environment||disposed||name!=='reset'||payload!==null)throw Error('Unknown Frequency Weaver command');this.reset();},
    serializeParameters(parameters){return{engine:'frequency-weaver',version:1,parameters:frequencyParameters(parameters)};},
    restoreParameters(preset){if(preset?.engine!=='frequency-weaver'||preset.version!==1)throw Error('Unsupported Frequency Weaver preset');return frequencyParameters(preset.parameters);},
    dispose(){if(busy)throw Error('Frequency Weaver is busy');disposed=true;environment=undefined;},
  };
}
