// Independent processing engine. No UI, media decoder, host state or other engine imports.
const defaults=Object.freeze({mode:'time-fossils',holdSeconds:0,decaySeconds:0,delaySeconds:.25,ghostStrength:.5,stretchSeconds:.5,taffyStrength:1,direction:'left-to-right'});
const yieldFrame=()=>new Promise(resolve=>setTimeout(resolve,0));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function sample(data,w,h,x,y,ch){const xx=clamp(Math.round(x),0,w-1),yy=clamp(Math.round(y),0,h-1);return data[(yy*w+xx)*4+ch];}
function hash(n){n=(n^61)^(n>>>16);n=Math.imul(n,9);n^=n>>>4;n=Math.imul(n,0x27d4eb2d);return((n^n>>>15)>>>0)/4294967296;}
const mixShader=`uniform sampler2D current,fossil;uniform float strength;
void main(){ivec2 p=ivec2(gl_FragCoord.xy);vec4 c=texelFetch(current,p,0);result=strength==0.?c:mix(c,texelFetch(fossil,p,0),strength);}`;
export const TAFFY_BANDS=8;
const bandShader=`uniform sampler2D current,fossil;uniform float strength;uniform float bandIndex,bandCount,axis,reverseAxis;
void main(){ivec2 p=ivec2(gl_FragCoord.xy),size=textureSize(current,0);int coordinate=axis<.5?p.x:p.y,extent=axis<.5?size.x:size.y;
int band=int(floor(float(coordinate)*bandCount/float(extent)));if(reverseAxis>.5)band=int(bandCount)-1-band;
vec4 c=texelFetch(current,p,0);result=band==int(bandIndex)?mix(c,texelFetch(fossil,p,0),strength):c;}`;
const sculptShader=`uniform sampler2D current,fossil;uniform float time,strength,mode,hold;
uint hashBits(uint n){n=(n^61u)^(n>>16u);n*=9u;n^=n>>4u;n*=0x27d4eb2du;return(n^(n>>15u));}float rnd(uint n){return float(hashBits(n))/4294967296.;}
void main(){ivec2 p=ivec2(gl_FragCoord.xy),s=textureSize(current,0);vec4 c=texelFetch(current,p,0);if(mode<.5){float cell=24.,id=floor(float(p.x)/cell)+floor(float(p.y)/cell)*ceil(float(s.x)/cell),r=rnd(uint(id)),a=(r-.5)*.9,zoom=.78+r*.5,phase=time*2.+r*6.28;vec2 center=(floor(vec2(p)/cell)+.5)*cell,d=vec2(p)-center;vec2 q=center+vec2(cos(a)*d.x-sin(a)*d.y,sin(a)*d.x+cos(a)*d.y)/zoom+vec2(sin(phase),cos(phase))*12.;ivec2 z=clamp(ivec2(q),ivec2(0),s-1);vec4 v=texelFetch(current,z,0);result=vec4(v.r,texelFetch(current,clamp(z+ivec2(2,0),ivec2(0),s-1),0).g,texelFetch(current,clamp(z-ivec2(2,0),ivec2(0),s-1),0).b,c.a);return;}vec4 f=texelFetch(fossil,p,0);float d=length(vec2(p)-vec2(s)*.5),ring=abs(d-(time*float(min(s.x,s.y))*.22+8.)),glow=(1.-smoothstep(0.,10.,ring))*strength;result=clamp(mix(c,f,strength)+vec4(glow*(f.rgb+vec3(.3,.16,.03)),0.),vec4(0),vec4(c.a));}`;
export function temporalParameters(value={}){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!Object.hasOwn(defaults,k)))throw Error('Unknown temporal parameter');
  const p={...defaults,...value};
  if(!['time-fossils','ghosts','time-taffy','chrono-shatter','fossil-bloom','datamosh-fossilization','temporal-molting'].includes(p.mode)||!Number.isFinite(p.holdSeconds)||p.holdSeconds<0||p.holdSeconds>3600||!Number.isFinite(p.decaySeconds)||p.decaySeconds<0||p.decaySeconds>300||!Number.isFinite(p.delaySeconds)||p.delaySeconds<0||p.delaySeconds>2||!Number.isFinite(p.ghostStrength)||p.ghostStrength<0||p.ghostStrength>1||!Number.isFinite(p.stretchSeconds)||p.stretchSeconds<0||p.stretchSeconds>2||!Number.isFinite(p.taffyStrength)||p.taffyStrength<0||p.taffyStrength>1||!['left-to-right','right-to-left','top-to-bottom','bottom-to-top'].includes(p.direction))throw Error('Invalid temporal parameters');
  return p;
}
// Shared envelope for hosts compositing persisted fossil plates.
export function fossilStrength(ageSeconds,parameters={}){
  const p=temporalParameters(parameters);
  if(!Number.isFinite(ageSeconds))throw Error('Invalid fossil age');
  const age=Math.max(0,ageSeconds);
  return p.holdSeconds===0||age<=p.holdSeconds?1:p.decaySeconds===0?0:Math.max(0,1-(age-p.holdSeconds)/p.decaySeconds);
}
export const TEMPORAL_DESCRIPTOR=Object.freeze({id:'temporal-sculptor',contractVersion:1,parameterVersion:1,
  modes:Object.freeze(['time-fossils','ghosts','time-taffy','chrono-shatter','fossil-bloom','datamosh-fossilization','temporal-molting']),backends:Object.freeze(['cpu','webgl2']),requiredServices:Object.freeze({}),
  parameters:Object.freeze({mode:Object.freeze({type:'enum',default:'time-fossils',options:Object.freeze(['time-fossils','ghosts','time-taffy','chrono-shatter','fossil-bloom','datamosh-fossilization','temporal-molting']),modulation:'none'}),
    stretchSeconds:Object.freeze({type:'number',default:.5,min:0,max:2,unit:'seconds',modulation:'continuous'}),
    taffyStrength:Object.freeze({type:'number',default:1,min:0,max:1,modulation:'continuous'}),
    direction:Object.freeze({type:'enum',default:'left-to-right',options:Object.freeze(['left-to-right','right-to-left','top-to-bottom','bottom-to-top']),modulation:'step'}),
    delaySeconds:Object.freeze({type:'number',default:.25,min:0,max:2,unit:'seconds',modulation:'continuous'}),
    ghostStrength:Object.freeze({type:'number',default:.5,min:0,max:1,modulation:'continuous'}),
    holdSeconds:Object.freeze({type:'number',default:0,min:0,max:3600,unit:'seconds; 0 holds indefinitely',modulation:'continuous'}),
    decaySeconds:Object.freeze({type:'number',default:0,min:0,max:300,unit:'seconds',modulation:'continuous'})})});
export function createTemporalSculptor({maxSnapshotBytes=32*1048576,maxHistoryBytes=32*1048576,maxHistoryFrames=120}={}){
  if(!Number.isSafeInteger(maxSnapshotBytes)||maxSnapshotBytes<16)throw Error('Invalid fossil memory bound');
  if(!Number.isSafeInteger(maxHistoryBytes)||maxHistoryBytes<16||!Number.isSafeInteger(maxHistoryFrames)||maxHistoryFrames<1||maxHistoryFrames>240)throw Error('Invalid ghost history bounds');
  let history=[],historyBytes=0,samples;
  const clearHistory=()=>{for(const item of history)item.lease.release();history=[];historyBytes=0;};
  let environment,device,cpuAllocator,cpuFallback,kernel,bandKernel,sculptKernel,snapshot,capturedAt,pending,last,disposed=false,busy=false;
  const clear=()=>{snapshot?.release();snapshot=undefined;capturedAt=undefined;};
  function ready(){if(!environment||disposed)throw Error('Temporal engine is not initialized or disposed');}
  function validate(input){
    if(!input||!Number.isSafeInteger(input.width)||input.width<1||!Number.isSafeInteger(input.height)||input.height<1||!Number.isSafeInteger(input.width*input.height*16)||
      input.origin!=='top-left'||input.format!=='linear-srgb-premultiplied-rgba'||typeof input.sourceId!=='string'||!input.sourceId||
      !Number.isSafeInteger(input.epoch)||input.epoch<0||!Number.isSafeInteger(input.sequence)||input.sequence<0||!Number.isFinite(input.timestampSeconds))throw Error('Invalid temporal input');
    if(device){device.assertFrame(input);return;}
    const d=input.storage?.data;if(input.storage?.kind!=='cpu'||!(d instanceof Float32Array)||d.length!==input.width*input.height*4)throw Error('Temporal CPU input requires explicit conversion');
    for(let i=0;i<d.length;i+=4){const a=d[i+3];if(!Number.isFinite(a)||a<0||a>1)throw Error('Invalid temporal alpha');for(let c=0;c<3;c++)if(!Number.isFinite(d[i+c])||d[i+c]<0||d[i+c]>a)throw Error('Invalid temporal premultiplication');}
  }
  function copy(input){
    if(device)return device.allocator.copy(input);
    const lease=environment.allocator.frame(input);lease.value.storage.data.set(input.storage.data);return lease;
  }
  return {
    descriptor:TEMPORAL_DESCRIPTOR,
    async initialize(env){
      if(environment||disposed)throw Error('Temporal engine cannot initialize twice');
      if(!env?.allocator?.frame||!['cpu','webgl2'].includes(env.backend))throw Error('Unsupported temporal backend');
      if(env.backend==='webgl2'){
        const candidate=env.services?.['webgl-device'];
        if(candidate?.version!==1||candidate.deviceId!==env.deviceId||candidate.allocator!==env.allocator)throw Error('Time Fossils requires matching shared WebGL device v1');
        kernel=candidate.kernel(mixShader);bandKernel=candidate.kernel(bandShader);sculptKernel=candidate.kernel(sculptShader);device=candidate;cpuAllocator=env.services?.['cpu-allocator'];if(cpuAllocator?.frame){cpuFallback=createTemporalSculptor({maxSnapshotBytes,maxHistoryBytes,maxHistoryFrames});await cpuFallback.initialize({backend:'cpu',allocator:cpuAllocator,services:{}});}
      }
      samples=env.services?.['temporal-samples'];if(samples&&(samples.version!==1||typeof samples.sample!=='function'))throw Error('Incompatible temporal samples service');
      environment=env;
    },
    command(name,payload,timeSeconds){
      ready();if(busy||!['capture','release'].includes(name)||payload!==null||!Number.isFinite(timeSeconds))throw Error('Invalid or concurrent temporal command');
      // One bounded pending event: a newer capture/release replaces the previous event.
      pending={name,timeSeconds};
    },
    async process(evaluation){
      ready();if(busy)throw Error('Concurrent temporal processing');
      const {input,timeSeconds,signal,discontinuity='none'}=evaluation,p=temporalParameters(evaluation.parameters);
      if(!Number.isFinite(timeSeconds)||!['none','seek','loop','source','resize'].includes(discontinuity))throw Error('Invalid temporal evaluation clock');
      validate(input);signal.throwIfAborted();busy=true;let candidate,output;
      try{
        if(device&&['datamosh-fossilization','temporal-molting'].includes(p.mode)){if(!cpuFallback)throw Error('This Temporal Sculptor mode requires the optional CPU reference allocator');const cpuInput=cpuAllocator.emptyFrame(input);try{cpuInput.value.storage.data.set(device.read(input));const cpuOutput=await cpuFallback.process({...evaluation,input:cpuInput.value});try{output=device.uploadFrame(cpuOutput.value);signal.throwIfAborted();return output;}finally{cpuOutput.release();}}finally{cpuInput.release();}}
        const discontinuous=discontinuity!=='none'||last&&(['width','height','sourceId','epoch'].some(k=>last[k]!==input[k])||input.sequence<=last.sequence||input.timestampSeconds<last.timestampSeconds||timeSeconds<last.timeSeconds);
        if(discontinuous||last&&last.mode!==p.mode){clear();clearHistory();pending=undefined;}
        if(p.mode==='chrono-shatter'){
          output=environment.allocator.frame(input);const d=output.value.storage.data,src=input.storage.data,w=input.width,h=input.height,cell=24;
          if(device)device.draw(sculptKernel,output.value,{current:input,fossil:input},{time:timeSeconds,strength:0,mode:0,hold:0});
          else for(let y=0;y<h;y++){if((y&31)===0){signal.throwIfAborted();if(y)await yieldFrame();}for(let x=0;x<w;x++){const gx=Math.floor(x/cell),gy=Math.floor(y/cell),id=gy*Math.ceil(w/cell)+gx,r=hash(id),angle=(r-.5)*.9,zoom=.78+r*.5,phase=timeSeconds*2+r*6.28,cx=(gx+.5)*cell,cy=(gy+.5)*cell,dx=x-cx,dy=y-cy,sx=cx+(Math.cos(angle)*dx-Math.sin(angle)*dy)/zoom+Math.sin(phase)*12,sy=cy+(Math.sin(angle)*dx+Math.cos(angle)*dy)/zoom+Math.cos(phase)*12,i=(y*w+x)*4;d[i]=sample(src,w,h,sx,sy,0);d[i+1]=sample(src,w,h,sx+2,sy,1);d[i+2]=sample(src,w,h,sx-2,sy,2);d[i+3]=src[i+3];}}
          signal.throwIfAborted();last={width:input.width,height:input.height,sourceId:input.sourceId,epoch:input.epoch,sequence:input.sequence,timestampSeconds:input.timestampSeconds,timeSeconds,mode:p.mode};return output;
        }
        if(p.mode==='time-taffy'){
          let scratch;
          try{
            const bytes=input.width*input.height*16;if(!samples&&bytes>maxHistoryBytes)throw Error('Taffy frame exceeds history byte limit');
            if(!samples)candidate=copy(input);output=copy(input);
            const axis=p.direction.includes('left')?0:1,reverseAxis=['right-to-left','bottom-to-top'].includes(p.direction)?1:0;
            if(device&&p.stretchSeconds>0&&p.taffyStrength>0)scratch=environment.allocator.frame(input);
            for(let band=1;band<TAFFY_BANDS&&p.stretchSeconds>0&&p.taffyStrength>0;band++){if(band>1)await yieldFrame();
              let delayed;
              try{
                const target=timeSeconds-p.stretchSeconds*band/(TAFFY_BANDS-1);let selected;
                if(samples){delayed=await samples.sample(input,target,signal);signal.throwIfAborted();selected=delayed?.value;if(selected){validate(selected);if(['width','height','sourceId','epoch'].some(k=>selected[k]!==input[k]))throw Error('Incompatible temporal sample');}}
                else selected=history.findLast(item=>item.time<=target+1e-9)?.lease.value;
                if(!selected)continue;
                if(device){device.draw(bandKernel,scratch.value,{current:output.value,fossil:selected},{strength:p.taffyStrength,bandIndex:band,bandCount:TAFFY_BANDS,axis,reverseAxis});[output,scratch]=[scratch,output];}
                else{const d=output.value.storage.data,c=input.storage.data,f=selected.storage.data;for(let y=0;y<input.height;y++)for(let x=0;x<input.width;x++){let b=Math.floor((axis===0?x/input.width:y/input.height)*TAFFY_BANDS);if(reverseAxis)b=TAFFY_BANDS-1-b;if(b!==band)continue;const i=(y*input.width+x)*4;for(let ch=0;ch<4;ch++)d[i+ch]=c[i+ch]+p.taffyStrength*(f[i+ch]-c[i+ch]);}}
              }finally{delayed?.release();}
            }
            signal.throwIfAborted();
            if(candidate){while(history.length>=maxHistoryFrames||historyBytes+bytes>maxHistoryBytes){const retired=history.shift();historyBytes-=retired.lease.value.width*retired.lease.value.height*16;retired.lease.release();}history.push({time:timeSeconds,lease:candidate});historyBytes+=bytes;candidate=undefined;}
            pending=undefined;last={width:input.width,height:input.height,sourceId:input.sourceId,epoch:input.epoch,sequence:input.sequence,timestampSeconds:input.timestampSeconds,timeSeconds,mode:p.mode};return output;
          }finally{scratch?.release();}
        }
        if(p.mode==='ghosts'){
          let delayed;
          try{
            const bytes=input.width*input.height*16;
            if(!samples&&bytes>maxHistoryBytes)throw Error('Ghost frame exceeds history byte limit');
            let selected=p.delaySeconds===0?input:null;
            if(p.delaySeconds>0&&samples){delayed=await samples.sample(input,timeSeconds-p.delaySeconds,signal);signal.throwIfAborted();selected=delayed?.value??null;if(selected){validate(selected);if(['width','height','sourceId','epoch'].some(k=>selected[k]!==input[k]))throw Error('Incompatible temporal sample');}}
            else if(p.delaySeconds>0)selected=history.findLast(item=>item.time<=timeSeconds-p.delaySeconds+1e-9)?.lease.value??null;
            if(!samples)candidate=copy(input);
            output=environment.allocator.frame(input);const strength=selected?p.ghostStrength:0;
            if(device)device.draw(kernel,output.value,{current:input,fossil:selected??input},{strength});
            else{const d=output.value.storage.data,c=input.storage.data,f=selected?.storage.data;for(let i=0;i<d.length;i++){if(i>0&&(i&0x3ffff)===0){signal.throwIfAborted();await yieldFrame();}d[i]=strength===0?c[i]:c[i]+strength*(f[i]-c[i]);}}
            signal.throwIfAborted();
            if(candidate){while(history.length>=maxHistoryFrames||historyBytes+bytes>maxHistoryBytes){const retired=history.shift();historyBytes-=retired.lease.value.width*retired.lease.value.height*16;retired.lease.release();}history.push({time:timeSeconds,lease:candidate});historyBytes+=bytes;candidate=undefined;}
            pending=undefined;last={width:input.width,height:input.height,sourceId:input.sourceId,epoch:input.epoch,sequence:input.sequence,timestampSeconds:input.timestampSeconds,timeSeconds,mode:p.mode};
            return output;
          }finally{delayed?.release();}
        }
        if(p.mode==='datamosh-fossilization'||p.mode==='temporal-molting'){
          let delayed;
          try{
            const bytes=input.width*input.height*16;if(!samples&&bytes>maxHistoryBytes)throw Error('Temporal effect frame exceeds history byte limit');
            let selected=null,selectedTime=timeSeconds-p.delaySeconds;
            if(samples){delayed=await samples.sample(input,selectedTime,signal);signal.throwIfAborted();selected=delayed?.value??null;if(selected){validate(selected);if(['width','height','sourceId','epoch'].some(k=>selected[k]!==input[k]))throw Error('Incompatible temporal sample');}}
            else selected=history.findLast(item=>item.time<=selectedTime+1e-9)?.lease.value??null;
            if(!selected&&snapshot){selected=snapshot.value;selectedTime=capturedAt;}
            if(!samples)candidate=copy(input);output=environment.allocator.frame(input);const src=input.storage.data,dst=output.value.storage.data,w=input.width,h=input.height,old=selected?.storage.data,age=Math.max(0,timeSeconds-selectedTime),cell=Math.max(8,Math.round(12+p.stretchSeconds*24));
            for(let y=0;y<h;y++){if((y&31)===0){signal.throwIfAborted();if(y)await yieldFrame();}for(let x=0;x<w;x++){const i=(y*w+x)*4,gx=Math.floor(x/cell),gy=Math.floor(y/cell),id=gy*Math.ceil(w/cell)+gx,r=hash(id*1013+17),r2=hash(id*7919+31),phase=age*2+r*6.283,edge=(Math.sin((x+y)*.17+phase)>1-p.ghostStrength*.7),strength=p.ghostStrength*(old?1:.55);let sx=x,sy=y,blend=strength;if(p.mode==='datamosh-fossilization'){sx+=Math.sin(phase)*cell*.55+(old?(r-.5)*cell*1.8:0);sy+=Math.cos(phase*.73)*cell*.32+(old?(r2-.5)*cell*1.2:0);blend=old?(edge?strength:strength*.22):strength*.35;}else{const cx=(gx+.5)*cell,cy=(gy+.5)*cell,dx=x-cx,dy=y-cy,peel=Math.sin(phase+Math.hypot(dx,dy)*.08),angle=peel*.35;sx=cx+dx*Math.cos(angle)-dy*Math.sin(angle)+Math.cos(phase)*cell*.35;sy=cy+dx*Math.sin(angle)+dy*Math.cos(angle)+Math.sin(phase)*cell*.35;blend=old?strength*(.25+.75*Math.abs(peel)):strength*.3;}
              for(let c=0;c<3;c++){const current=sample(src,w,h,x,y,c),channelOffset=p.mode==='temporal-molting'?(c-1)*2*Math.abs(Math.sin(phase)):0,pixel=old?sample(old,w,h,sx+channelOffset,sy,c):sample(src,w,h,sx+channelOffset,sy,c);dst[i+c]=clamp(current+(pixel-current)*blend,0,src[i+3]);}dst[i+3]=src[i+3];}}
            signal.throwIfAborted();if(candidate){while(history.length>=maxHistoryFrames||historyBytes+bytes>maxHistoryBytes){const retired=history.shift();historyBytes-=retired.lease.value.width*retired.lease.value.height*16;retired.lease.release();}history.push({time:timeSeconds,lease:candidate});historyBytes+=bytes;candidate=undefined;}pending=undefined;last={width:input.width,height:input.height,sourceId:input.sourceId,epoch:input.epoch,sequence:input.sequence,timestampSeconds:input.timestampSeconds,timeSeconds,mode:p.mode};return output;
          }finally{delayed?.release();}
        }
        const event=pending&&timeSeconds>=pending.timeSeconds?pending:undefined;
        if(event?.name==='capture'){
          if(input.width*input.height*16>maxSnapshotBytes)throw Error('Fossil exceeds configured snapshot byte limit');
          candidate=copy(input);
        }
        const selected=candidate??(event?.name==='release'?undefined:snapshot),start=candidate?timeSeconds:capturedAt;
        const age=selected?Math.max(0,timeSeconds-start):0;
        const strength=selected?fossilStrength(age,p):0;
        output=environment.allocator.frame(input);
        if(device&&p.mode==='fossil-bloom')device.draw(sculptKernel,output.value,{current:input,fossil:selected?.value??input},{time:timeSeconds,strength,mode:1,hold:p.holdSeconds});
        else if(device)device.draw(kernel,output.value,{current:input,fossil:selected?.value??input},{strength});
        else{const d=output.value.storage.data,c=input.storage.data,f=selected?.value.storage.data,w=input.width,h=input.height;if(p.mode==='fossil-bloom'&&selected){const cx=(w-1)/2,cy=(h-1)/2,radius=((timeSeconds-start)*.28*Math.min(w,h))%Math.max(1,Math.hypot(w,h));for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,ring=Math.max(0,1-Math.abs(Math.hypot(x-cx,y-cy)-radius)/Math.max(3,Math.min(w,h)*.035))*strength;for(let ch=0;ch<3;ch++)d[i+ch]=clamp(c[i+ch]+strength*(f[i+ch]-c[i+ch])+ring*(f[i+ch]+.2),0,c[i+3]);d[i+3]=c[i+3];}}else for(let i=0;i<d.length;i++){if(i>0&&(i&0x3ffff)===0){signal.throwIfAborted();await yieldFrame();}d[i]=strength===0?c[i]:c[i]+strength*(f[i]-c[i]);}}
        signal.throwIfAborted();
        // Commit only after allocation/render succeeds: recapture failure preserves old fossil.
        if(candidate){clear();snapshot=candidate;candidate=undefined;capturedAt=timeSeconds;}
        if(event?.name==='release'||strength===0&&snapshot)clear();
        if(event)pending=undefined;
        last={width:input.width,height:input.height,sourceId:input.sourceId,epoch:input.epoch,sequence:input.sequence,timestampSeconds:input.timestampSeconds,timeSeconds,mode:p.mode};
        return output;
      }catch(error){output?.release();throw error;}finally{candidate?.release();busy=false;}
    },
    reset(){if(busy)throw Error('Temporal engine is busy');clear();clearHistory();pending=undefined;last=undefined;cpuFallback?.reset();},
    serializeParameters(parameters){return {engine:'temporal-sculptor',version:1,parameters:temporalParameters(parameters)};},
    restoreParameters(preset){if(preset?.engine!=='temporal-sculptor'||preset.version!==1)throw Error('Unsupported temporal preset');return temporalParameters(preset.parameters);},
    get status(){return {captured:!!snapshot,capturedAt:capturedAt??null,retainedBytes:snapshot?snapshot.value.width*snapshot.value.height*16:0,pending:pending?.name??null,historyFrames:history.length,historyBytes};},
    dispose(){if(busy)throw Error('Temporal engine is busy');clear();clearHistory();pending=undefined;last=undefined;cpuFallback?.dispose();cpuFallback=undefined;cpuAllocator=undefined;disposed=true;environment=undefined;device=undefined;},
  };
}
