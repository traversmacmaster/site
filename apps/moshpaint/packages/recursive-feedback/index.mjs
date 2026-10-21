// Standalone CPU reference for Recursive Feedback. It owns only bounded frame
// history and pixel transforms; hosts own import, masks, UI and compositing.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const modes=Object.freeze(['feedback-architecture','recursive-portals','fractured-reality','fractal-collapse','kaleidoscope-tunnel','tesseract-recursion','recursive-black-ice']);
const defaults=Object.freeze({mode:'feedback-architecture',feedback:.55,decay:.92,scale:.96,rotation:0,translateX:0,translateY:0,colorShift:0,depth:4,portalScale:.72,portalRotation:0,portalMix:.65,grid:8,fragmentMotion:10,fragmentRotation:12,fragmentScale:.12,delay:.5,seed:1});
const ranges={feedback:[0,1],decay:[0,1],scale:[.25,2],rotation:[-180,180],translateX:[-1,1],translateY:[-1,1],colorShift:[-1,1],depth:[1,8],portalScale:[.3,.95],portalRotation:[-180,180],portalMix:[0,1],grid:[2,32],fragmentMotion:[0,64],fragmentRotation:[0,180],fragmentScale:[0,.75],delay:[0,1],seed:[0,0x7fffffff]};
export function recursiveParameters(value={}){
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!Object.hasOwn(defaults,k)))throw Error('Unknown Recursive Feedback parameter');
  const p={...defaults,...value};if(!modes.includes(p.mode))throw Error('Invalid Recursive Feedback mode');
  for(const [key,[min,max]]of Object.entries(ranges))if(!Number.isFinite(p[key])||p[key]<min||p[key]>max||(key==='depth'||key==='grid'||key==='seed')&&!Number.isSafeInteger(p[key]))throw Error(`Invalid Recursive Feedback ${key}`);
  return p;
}
export const RECURSIVE_MODES=modes;
export const RECURSIVE_DESCRIPTOR=Object.freeze({id:'recursive-feedback',contractVersion:1,parameterVersion:1,modes,backends:Object.freeze(['cpu','webgl2']),requiredServices:Object.freeze({}),parameters:Object.freeze(Object.fromEntries(Object.entries(defaults).map(([key,value])=>[key,Object.freeze({type:key==='mode'?'enum':'number',default:value,...(ranges[key]?{min:ranges[key][0],max:ranges[key][1]}:{}),modulation:key==='mode'?'none':'continuous'})]))) });

function validate(input){
  if(!input||!Number.isSafeInteger(input.width)||input.width<1||!Number.isSafeInteger(input.height)||input.height<1||!Number.isSafeInteger(input.width*input.height*16)||input.origin!=='top-left'||input.format!=='linear-srgb-premultiplied-rgba'||typeof input.sourceId!=='string'||!input.sourceId||!Number.isSafeInteger(input.epoch)||input.epoch<0||!Number.isSafeInteger(input.sequence)||input.sequence<0||!Number.isFinite(input.timestampSeconds))throw Error('Invalid Recursive Feedback frame');
  const data=input.storage?.data;if(input.storage?.kind!=='cpu'||!(data instanceof Float32Array)||data.length!==input.width*input.height*4)throw Error('Recursive Feedback requires an explicitly converted CPU frame');
  for(let i=0;i<data.length;i+=4){const a=data[i+3];if(!Number.isFinite(a)||a<0||a>1)throw Error('Invalid alpha');for(let c=0;c<3;c++)if(!Number.isFinite(data[i+c])||data[i+c]<0||data[i+c]>a)throw Error('Invalid premultiplication');}
}
function bilinear(data,w,h,x,y,ch){x=clamp(x,0,w-1);y=clamp(y,0,h-1);const x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1),fx=x-x0,fy=y-y0;return (data[(y0*w+x0)*4+ch]*(1-fx)+data[(y0*w+x1)*4+ch]*fx)*(1-fy)+(data[(y1*w+x0)*4+ch]*(1-fx)+data[(y1*w+x1)*4+ch]*fx)*fy;}
function transformPoint(x,y,cx,cy,scale,angle,tx,ty){const dx=x-cx,dy=y-cy,co=Math.cos(angle),si=Math.sin(angle);return[cx+(dx*co+dy*si)/scale+tx,cy+(-dx*si+dy*co)/scale+ty];}
function hash(n){n=(n^61)^(n>>>16);n=Math.imul(n,9);n^=n>>>4;n=Math.imul(n,0x27d4eb2d);return((n^n>>>15)>>>0)/4294967296;}
export function createRecursiveFeedback({maxHistoryBytes=64*1048576}={}){
  if(!Number.isSafeInteger(maxHistoryBytes)||maxHistoryBytes<16)throw Error('Invalid Recursive Feedback history bound');
  let environment,history,historyKey,lastSequence=-1,lastTime=-Infinity,disposed=false,busy=false;
  const clear=()=>{history?.release();history=undefined;historyKey=undefined;lastSequence=-1;lastTime=-Infinity;};
  return{
    descriptor:RECURSIVE_DESCRIPTOR,
    async initialize(env){if(environment||disposed)throw Error('Recursive Feedback cannot initialize twice');if(env?.backend!=='cpu'||!env.allocator?.frame)throw Error('Recursive Feedback requires the CPU reference backend');environment=env;},
    async process(evaluation){
      if(!environment||disposed||busy)throw Error('Recursive Feedback unavailable or busy');const {input,timeSeconds=input?.timestampSeconds,discontinuity='none',signal=new AbortController().signal,seed}=evaluation;const p=recursiveParameters(evaluation.parameters);validate(input);
      if(!Number.isFinite(timeSeconds)||!Number.isSafeInteger(seed)||seed<0||!['none','seek','loop','source','resize'].includes(discontinuity))throw Error('Invalid Recursive Feedback clock');signal.throwIfAborted();busy=true;let output,candidate;
      const key=`${input.sourceId}/${input.epoch}/${input.width}/${input.height}/${p.mode}`;
      try{
        if(discontinuity!=='none'||historyKey&&historyKey!==key||input.sequence<=lastSequence||input.timestampSeconds<lastTime)clear();
        if(input.width*input.height*16>maxHistoryBytes)throw Error('Recursive Feedback frame exceeds history byte limit');
        output=environment.allocator.frame(input);const src=input.storage.data,dst=output.value.storage.data,w=input.width,h=input.height,cx=(w-1)/2,cy=(h-1)/2;
        const old=history?.value.storage.data;
        if(p.mode==='feedback-architecture'){
          const angle=p.rotation*Math.PI/180,tx=p.translateX*w,ty=p.translateY*h,amount=old?p.feedback*p.decay:0;
          for(let y=0;y<h;y++){if((y&31)===0){signal.throwIfAborted();await new Promise(resolve=>setTimeout(resolve,0));}for(let x=0;x<w;x++){const i=(y*w+x)*4,[sx,sy]=transformPoint(x,y,cx,cy,p.scale,angle,tx,ty);for(let c=0;c<4;c++){let v=old?bilinear(old,w,h,sx,sy,c):src[i+c];if(c<3&&old&&p.colorShift){const other=old[(y*w+x)*4+(c+1)%3];v=clamp(v+p.colorShift*(other-old[(y*w+x)*4+c]),0,1);}dst[i+c]=src[i+c]+(v-src[i+c])*amount;}}}
        }else if(p.mode==='recursive-portals'){
          const angle=p.portalRotation*Math.PI/180;for(let y=0;y<h;y++){if((y&31)===0){signal.throwIfAborted();await new Promise(resolve=>setTimeout(resolve,0));}for(let x=0;x<w;x++){const i=(y*w+x)*4;let px=x,py=y,weight=p.portalMix,acc=[src[i],src[i+1],src[i+2],src[i+3]],sum=1;for(let d=0;d<p.depth;d++){[px,py]=transformPoint(px,py,cx,cy,p.portalScale,angle,0,0);const a=weight*Math.pow(p.portalMix,d);for(let c=0;c<4;c++)acc[c]+=bilinear(src,w,h,px,py,c)*a;sum+=a;}for(let c=0;c<4;c++)dst[i+c]=clamp(acc[c]/sum,0,1);}}
        }else if(p.mode==='fractured-reality'){
          const cellW=w/p.grid,cellH=h/p.grid,baseSeed=(seed^p.seed)>>>0,delayOld=old&&p.delay>0;
          for(let y=0;y<h;y++){if((y&31)===0){signal.throwIfAborted();await new Promise(resolve=>setTimeout(resolve,0));}for(let x=0;x<w;x++){const gx=Math.min(p.grid-1,Math.floor(x/cellW)),gy=Math.min(p.grid-1,Math.floor(y/cellH)),id=gy*p.grid+gx,r=hash(baseSeed+id*1013),r2=hash(baseSeed+id*7919+7),r3=hash(baseSeed+id*1543+19),active=r<p.delay,i=(y*w+x)*4;let sx=x,sy=y,angle=0,scale=1;if(active){sx+=(r2*2-1)*p.fragmentMotion;sy+=(r3*2-1)*p.fragmentMotion;angle=(r2*2-1)*p.fragmentRotation*Math.PI/180;scale=1+(r3*2-1)*p.fragmentScale;}[sx,sy]=transformPoint(sx,sy,x,y,scale,angle,0,0);for(let c=0;c<4;c++){const a=delayOld&&active?p.decay:1;const val=bilinear(active&&delayOld?old:src,w,h,sx,sy,c);dst[i+c]=src[i+c]+(val-src[i+c])*a;}}}
        }else if(p.mode==='fractal-collapse'){
          const cellW=w/p.grid,cellH=h/p.grid,baseSeed=(seed^p.seed)>>>0;
          for(let y=0;y<h;y++){if((y&31)===0){signal.throwIfAborted();await new Promise(resolve=>setTimeout(resolve,0));}for(let x=0;x<w;x++){const gx=Math.min(p.grid-1,Math.floor(x/cellW)),gy=Math.min(p.grid-1,Math.floor(y/cellH)),id=gy*p.grid+gx,r=hash(baseSeed+id*1013),angle=(r-.5)*p.fragmentRotation*Math.PI/90,zoom=.55+r*p.fragmentScale*1.3,cx=(gx+.5)*cellW,cy=(gy+.5)*cellH,dx=x-cx,dy=y-cy,sx=cx+(dx*Math.cos(angle)+dy*Math.sin(angle))/zoom,sy=cy+(-dx*Math.sin(angle)+dy*Math.cos(angle))/zoom,i=(y*w+x)*4;for(let c=0;c<3;c++)dst[i+c]=bilinear(src,w,h,sx+(c-1)*p.colorShift*8,sy,c);dst[i+3]=src[i+3];}}
        }else if(p.mode==='tesseract-recursion'){
          const layers=p.depth,baseAngle=p.portalRotation*Math.PI/180,phase=timeSeconds*.35;
          for(let y=0;y<h;y++){if((y&31)===0){signal.throwIfAborted();await new Promise(resolve=>setTimeout(resolve,0));}for(let x=0;x<w;x++){let px=x,py=y,weight=1,acc=[0,0,0,0],sum=0;for(let layer=0;layer<layers;layer++){const angle=baseAngle+phase*(layer%2?1:-1),scale=Math.max(.3,p.portalScale+(layer%2)*.08),[nx,ny]=transformPoint(px,py,cx,cy,scale,angle,(layer%2?1:-1)*p.fragmentMotion*.08,(layer%2?-1:1)*p.fragmentMotion*.08);px=nx;py=ny;const wgt=weight*(1-layer/(layers+1));for(let c=0;c<4;c++)acc[c]+=bilinear(src,w,h,px,py,c)*wgt;sum+=wgt;weight*=p.portalMix;}const i=(y*w+x)*4;for(let c=0;c<4;c++)dst[i+c]=clamp(acc[c]/Math.max(sum,1e-6),0,1);}}
        }else if(p.mode==='recursive-black-ice'){
          const cellW=w/p.grid,cellH=h/p.grid,baseSeed=(seed^p.seed)>>>0,phase=timeSeconds*.22;
          for(let y=0;y<h;y++){if((y&31)===0){signal.throwIfAborted();await new Promise(resolve=>setTimeout(resolve,0));}for(let x=0;x<w;x++){const gx=Math.min(p.grid-1,Math.floor(x/cellW)),gy=Math.min(p.grid-1,Math.floor(y/cellH)),id=gy*p.grid+gx,r=hash(baseSeed+id*1013),r2=hash(baseSeed+id*7919+7),cx0=(gx+.5)*cellW,cy0=(gy+.5)*cellH,localX=x-gx*cellW,localY=y-gy*cellH,mirrorX=(gx+gy)%2===0,foldX=mirrorX?cellW-localX:localX,foldY=(gx*3+gy)%2===0?cellH-localY:localY,angle=(r-.5)*p.fragmentRotation*Math.PI/180+phase*(r2-.5),co=Math.cos(angle),si=Math.sin(angle),sx=cx0+(foldX-cellW*.5)*co-(foldY-cellH*.5)*si+(r2-.5)*p.fragmentMotion,sy=cy0+(foldX-cellW*.5)*si+(foldY-cellH*.5)*co+(r-.5)*p.fragmentMotion,crackX=Math.abs(localX-cellW*(.2+r*.6)),crackY=Math.abs(localY-cellH*(.2+r2*.6)),crack=Math.min(crackX,crackY)<Math.max(1,p.fragmentScale*3)?0:1,shade=.08+.92*crack,i=(y*w+x)*4;for(let c=0;c<3;c++)dst[i+c]=bilinear(src,w,h,sx,sy,c)*shade;dst[i+3]=src[i+3];}}
        }else{
          const angle=p.portalRotation*Math.PI/180,sectors=Math.max(3,p.depth*2),period=Math.PI*2/sectors;
          for(let y=0;y<h;y++){if((y&31)===0){signal.throwIfAborted();await new Promise(resolve=>setTimeout(resolve,0));}for(let x=0;x<w;x++){const dx=x-cx,dy=y-cy,r=Math.hypot(dx,dy),a=Math.atan2(dy,dx)+angle+timeSeconds*.3,fold=Math.abs(((a+period/2)%period+period)%period-period/2),radius=r+Math.sin(Math.log(r+1)*p.depth+timeSeconds)*p.fragmentMotion,scale=1+p.portalScale*.4,i=(y*w+x)*4,sx=cx+Math.cos(fold)*radius*scale,sy=cy+Math.sin(fold)*radius*scale;for(let c=0;c<4;c++)dst[i+c]=bilinear(src,w,h,sx,sy,c)*p.portalMix+src[i+c]*(1-p.portalMix);}}
        }
        signal.throwIfAborted();for(let i=0;i<dst.length;i+=4){const a=clamp(dst[i+3],0,1);dst[i+3]=a;for(let c=0;c<3;c++)dst[i+c]=clamp(dst[i+c],0,a);}candidate=environment.allocator.copy(output.value);signal.throwIfAborted();history?.release();history=candidate;candidate=undefined;historyKey=key;lastSequence=input.sequence;lastTime=input.timestampSeconds;return output;
      }catch(error){output?.release();throw error;}finally{candidate?.release();busy=false;}
    },
    reset(){if(busy)throw Error('Recursive Feedback is busy');clear();},
    command(name,payload){if(!environment||disposed||name!=='reset'||payload!==null)throw Error('Unknown Recursive Feedback command');this.reset();},
    serializeParameters(parameters){return{engine:'recursive-feedback',version:1,parameters:recursiveParameters(parameters)};},
    restoreParameters(preset){if(preset?.engine!=='recursive-feedback'||preset.version!==1)throw Error('Unsupported Recursive Feedback preset');return recursiveParameters(preset.parameters);},
    dispose(){if(busy)throw Error('Recursive Feedback is busy');clear();disposed=true;environment=undefined;},
  };
}
