import {solidifyFrame,cleanupColorMask} from './color-solidify.mjs';
import {renderProcedural} from './fills/procedural.mjs';
import {drawPlane,depthShade} from './living-depth.mjs';
import {surface} from './processors.mjs';
import {sourceDuration} from './sources.mjs';
import {rng} from './core.mjs';
import {GhostPlates} from './temporal-ghosts.mjs';
import {fossilStrength} from './packages/temporal-sculptor/index.mjs';

const wetModes=new Set(['legacy','down','up','left','right','angle','radial-in','radial-out','gesture']);
export function livingWetShape(amount,physics={},seed=1){
  const dry=Math.max(0,Math.min(1,Number(physics.dryRate??.5))),total=Math.max(4,Math.min(40,Math.round(8+amount*20+(1-dry)*12)));
  return{amount:Math.max(0,Math.min(1,amount)),physics:{mode:wetModes.has(physics.mode)?physics.mode:'legacy',angle:Number(physics.angle)||90,force:Math.max(0,Math.min(1,Number(physics.force??.5))),viscosity:Math.max(0,Math.min(1,Number(physics.viscosity??.5))),spread:Math.max(0,Math.min(1,Number(physics.spread)||0)),dryRate:dry,edgeHold:Math.max(0,Math.min(1,Number(physics.edgeHold)||0))},seed:seed>>>0,ticks:0,total,dry:false};
}
export function livingWetCells(op){
  const wet=op.wetShape;if(!wet||!wet.ticks)return[];const p=wet.physics,progress=Math.min(1,wet.ticks/wet.total),mobility=(1-p.viscosity*.72)*p.force,cols=8,rows=8,cells=[];
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const nx=(x+.5)/cols-.5,ny=(y+.5)/rows-.5,edge=Math.min(1,Math.min(x+.5,cols-x-.5,y+.5,rows-y-.5)/2),hold=(.15+edge*.85)*(1-p.edgeHold*(1-edge)),wave=Math.sin((wet.seed%97)*.17+x*1.7+y*.91)*(.3+p.spread*1.7);let distance=progress*op.rect.h*(.04+.22*wet.amount)*mobility*hold,vx=0,vy=1;
    if(p.mode==='up')vy=-1;else if(p.mode==='left'){vx=-1;vy=0;}else if(p.mode==='right'){vx=1;vy=0;}else if(p.mode==='angle'||p.mode==='gesture'){const a=p.angle*Math.PI/180;vx=Math.cos(a);vy=Math.sin(a);}else if(p.mode.startsWith('radial')){const d=Math.hypot(nx,ny)||1,s=p.mode==='radial-in'?-1:1;vx=nx/d*s;vy=ny/d*s;}
    const anchor=p.mode.startsWith('radial')?1:Math.abs(vx)>Math.abs(vy)?(vx>0?x/(cols-1):(cols-1-x)/(cols-1)):(vy>0?y/(rows-1):(rows-1-y)/(rows-1));distance*=anchor;
    cells.push({sx:x*op.rect.w/cols,sy:y*op.rect.h/rows,sw:op.rect.w/cols+1,sh:op.rect.h/rows+1,dx:x*op.rect.w/cols+vx*distance+wave*progress*3*anchor,dy:y*op.rect.h/rows+vy*distance+Math.abs(wave)*progress*2*anchor,dw:op.rect.w/cols+1+p.spread*progress*4*anchor,dh:op.rect.h/rows+1+p.spread*progress*4*anchor});
  }return cells;
}

export function floodMask(canvas,x,y,tolerance=.18){
  const w=canvas.width,h=canvas.height,ctx=canvas.getContext('2d',{willReadFrequently:true});
  x=Math.max(0,Math.min(w-1,Math.floor(x)));y=Math.max(0,Math.min(h-1,Math.floor(y)));
  const image=ctx.getImageData(0,0,w,h),d=image.data,start=(y*w+x)*4,target=[d[start],d[start+1],d[start+2],d[start+3]];
  const limit=Math.max(4,Math.round(tolerance*255*3)),seen=new Uint8Array(w*h),stack=[y*w+x],pixels=[];
  let left=w,top=h,right=-1,bottom=-1;
  while(stack.length){
    const p=stack.pop(),px=p%w,py=Math.floor(p/w),i=p*4;if(seen[p])continue;seen[p]=1;
    if(Math.abs(d[i]-target[0])+Math.abs(d[i+1]-target[1])+Math.abs(d[i+2]-target[2])+Math.abs(d[i+3]-target[3])>limit)continue;
    pixels.push(p);left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);
    if(px)stack.push(p-1);if(px<w-1)stack.push(p+1);if(py)stack.push(p-w);if(py<h-1)stack.push(p+w);
  }
  if(!pixels.length)return null;
  const out=surface(right-left+1,bottom-top+1),mask=out.getContext('2d').createImageData(out.width,out.height);
  for(const p of pixels){const px=p%w-left,py=Math.floor(p/w)-top;mask.data[(py*out.width+px)*4+3]=255;}
  out.getContext('2d').putImageData(mask,0,0);
  return {rect:{x:left,y:top,w:out.width,h:out.height},mask:out.toDataURL('image/png'),pixels:pixels.length};
}

const linear=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;};
export function oklab(r,g,b){
  r=linear(r);g=linear(g);b=linear(b);
  const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
  return[.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];
}
export function pigmentDifference(a,b){const x=oklab(a[0],a[1],a[2]),y=oklab(b[0],b[1],b[2]);return Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2]);}
export function pigmentMatches(pixel,target,tolerance=.1){
  const colorLimit=.008+Math.max(0,Math.min(.3,tolerance))*.32,alphaLimit=3+Math.max(0,Math.min(.3,tolerance))*80;
  return Math.abs(pixel[3]-target[3])<=alphaLimit&&pigmentDifference(pixel,target)<=colorLimit;
}
export function colorMask(canvas,x,y,tolerance=.1,{mode='connected',invert=false,cleanup=0}={}){
  const w=canvas.width,h=canvas.height,ctx=canvas.getContext('2d',{willReadFrequently:true});x=Math.max(0,Math.min(w-1,Math.floor(x)));y=Math.max(0,Math.min(h-1,Math.floor(y)));
  const d=ctx.getImageData(0,0,w,h).data,start=(y*w+x)*4,target=[d[start],d[start+1],d[start+2],d[start+3]],targetLab=oklab(target[0],target[1],target[2]),selected=new Uint8Array(w*h),distances=new Float32Array(w*h),colorLimit=.008+Math.max(0,Math.min(.3,tolerance))*.32,alphaLimit=3+Math.max(0,Math.min(.3,tolerance))*80;
  const matches=p=>{const i=p*4,lab=oklab(d[i],d[i+1],d[i+2]),distance=Math.hypot(lab[0]-targetLab[0],lab[1]-targetLab[1],lab[2]-targetLab[2]);distances[p]=distance;return Math.abs(d[i+3]-target[3])<=alphaLimit&&distance<=colorLimit;};
  if(mode==='connected'&&!invert){
    const seen=new Uint8Array(w*h),stack=[y*w+x];while(stack.length){const p=stack.pop();if(seen[p])continue;seen[p]=1;if(!matches(p))continue;selected[p]=1;const px=p%w,py=Math.floor(p/w);if(px)stack.push(p-1);if(px<w-1)stack.push(p+1);if(py)stack.push(p-w);if(py<h-1)stack.push(p+w);}
  }else for(let p=0;p<w*h;p++)if(matches(p)!==invert)selected[p]=1;
  let initial=0;for(const value of selected)initial+=value;
  if(initial>16&&!invert){const tightened=selected.slice(),seed=y*w+x;for(let p=0;p<w*h;p++){if(!selected[p]||p===seed||distances[p]<=colorLimit*.78)continue;const px=p%w,py=Math.floor(p/w),neighbors=(px?selected[p-1]:0)+(px<w-1?selected[p+1]:0)+(py?selected[p-w]:0)+(py<h-1?selected[p+w]:0);if(neighbors<=1)tightened[p]=0;}selected.set(tightened);}
  cleanupColorMask(selected,w,h,cleanup,d);
  let count=0,left=w,top=h,right=-1,bottom=-1;for(let p=0;p<w*h;p++)if(selected[p]){const px=p%w,py=Math.floor(p/w);count++;left=Math.min(left,px);right=Math.max(right,px);top=Math.min(top,py);bottom=Math.max(bottom,py);}
  if(!count)return null;const out=surface(right-left+1,bottom-top+1),mask=out.getContext('2d').createImageData(out.width,out.height);for(let py=top;py<=bottom;py++)for(let px=left;px<=right;px++){const p=py*w+px;if(!selected[p])continue;const i=((py-top)*out.width+px-left)*4;mask.data[i]=mask.data[i+1]=mask.data[i+2]=mask.data[i+3]=255;}out.getContext('2d').putImageData(mask,0,0);return{rect:{x:left,y:top,w:out.width,h:out.height},mask:out.toDataURL('image/png'),pixels:count};
}

export function shapeMask(shape,a,b){
  const x=Math.floor(Math.min(a.x,b.x)),y=Math.floor(Math.min(a.y,b.y)),right=Math.ceil(Math.max(a.x,b.x)),bottom=Math.ceil(Math.max(a.y,b.y)),w=right-x,h=bottom-y;
  if(w<2||h<2)return null;const out=surface(w,h),ctx=out.getContext('2d');ctx.fillStyle='#fff';ctx.beginPath();
  if(shape==='ellipse')ctx.ellipse(w/2,h/2,w/2,h/2,0,0,Math.PI*2);else ctx.rect(0,0,w,h);ctx.fill();
  return{rect:{x,y,w,h},mask:out.toDataURL('image/png')};
}

function fillBrushShape(ctx,shape,x,y,size,angle,seed){
  ctx.save();ctx.translate(x,y);ctx.rotate(angle||0);ctx.beginPath();
  if(!shape||shape==='round')ctx.arc(0,0,size/2,0,Math.PI*2);
  else if(shape==='block')ctx.rect(-size/2,-size/2,size,size);
  else if(shape==='strip')ctx.rect(-size/2,-size*.16,size,size*.32);
  else if(shape==='comb'){const tooth=Math.max(1,size*.08);for(let i=-2;i<=2;i++)ctx.rect(-size/2,i*size*.18-tooth/2,size,tooth);}
  else if(shape==='shard'){const random=rng(seed);for(let i=0;i<7;i++){const a=Math.PI*2*i/7,r=size*(.31+random()*.2),px=Math.cos(a)*r,py=Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();}
  ctx.fill();ctx.restore();
}
export function drawLivingStroke(ctx,points,size,shape='round',seed=1,offset={x:0,y:0}){
  if(!points?.length)return;let dab=0;
  for(let i=0;i<points.length;i++){
    const a=points[Math.max(0,i-1)],b=points[i],dx=b.x-a.x,dy=b.y-a.y,distance=Math.hypot(dx,dy),steps=i?Math.max(1,Math.ceil(distance/Math.max(2,size*.12))):1,angle=Math.atan2(dy,dx);
    for(let j=i?1:0;j<=steps;j++){const t=steps?j/steps:0,pressure=(a.pressure??1)+((b.pressure??1)-(a.pressure??1))*t;fillBrushShape(ctx,shape,a.x+dx*t-offset.x,a.y+dy*t-offset.y,Math.max(1,size*pressure),angle,seed+dab++*113);}
  }
}
export function livingStrokeMask(points,size,shape='round',seed=1,bounds=null,fixedRect=null,encode=true){
  if(!points?.length)return null;const pad=size*.72;let rect=fixedRect;
  if(!rect){let left=Math.floor(Math.min(...points.map(p=>p.x))-pad),top=Math.floor(Math.min(...points.map(p=>p.y))-pad),right=Math.ceil(Math.max(...points.map(p=>p.x))+pad),bottom=Math.ceil(Math.max(...points.map(p=>p.y))+pad);if(bounds){left=Math.max(0,left);top=Math.max(0,top);right=Math.min(bounds.width,right);bottom=Math.min(bounds.height,bottom);}if(right<=left||bottom<=top)return null;rect={x:left,y:top,w:right-left,h:bottom-top};}
  const canvas=surface(rect.w,rect.h),ctx=canvas.getContext('2d');ctx.fillStyle='#fff';drawLivingStroke(ctx,points,size,shape,seed,rect);return{rect:{...rect},canvas,mask:encode?canvas.toDataURL('image/png'):null};
}

export class LivingRenderer{
  constructor(canvas,sources){this.generation=0;this.videoBatch=0;this.canvas=canvas;this.detectionCanvas=surface(canvas.width,canvas.height);this.detectionScratches=new Map();this.ctx=canvas.getContext('2d');this.base=canvas.previousElementSibling;this.sources=sources;this.masks=new Map();this.images=new Map();this.videos=new Map();this.offlineVideoGroups=new Map();this.videoGroupKeys=new WeakMap();this.mediaFrames=new Map();this.frameSignals=new Map();this.scratches=new Map();this.deforms=new Map();this.depthMaps=new Map();this.planeFrames=new Map();this.proceduralSurfaces=new Map();this.active=[];this.frozen=new Map();this.resolvedOperations=null;this.animated=false;this.lastWetAt=0;this.ghosts=new GhostPlates();this.fossilStarts=new Map();this.fossilWeights=new Map();}
  invalidate(){this.resolvedOperations=null;}
  resize(width,height){if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;this.detectionCanvas.width=width;this.detectionCanvas.height=height;}}
  async mask(op){const src=op.tool==='livingbrush'&&op.progress?`${op.mask}#${op.progress}`:op.mask;let item=this.masks.get(op.id);if(item?.src===src)return item;let image;if(op.previewMask){const ctx=op.previewMask.getContext('2d'),r=op.rect;return{image:op.previewMask,global:!op.previewRect,get data(){return ctx.getImageData(op.previewRect?0:r.x,op.previewRect?0:r.y,r.w,r.h).data;}};}if(op.tool==='livingbrush'&&op.progress){image=surface(op.rect.w,op.rect.h);const ctx=image.getContext('2d');ctx.fillStyle='#fff';drawLivingStroke(ctx,op.points.slice(0,op.progress),op.size,op.shape,op.seed,op.rect);}else{image=new Image();image.src=op.mask;await image.decode();}const probe=surface(image.width,image.height),ctx=probe.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);let data;item={src,image,get data(){return data??=ctx.getImageData(0,0,image.width,image.height).data;}};this.masks.set(op.id,item);return item;}
  async image(src){let image=this.images.get(src);if(image)return image;image=new Image();image.src=src;await image.decode();this.images.set(src,image);return image;}
  trackVideo(video){if(this.frameSignals.has(video)||!video.requestVideoFrameCallback)return;const signal={serial:0,token:null};this.frameSignals.set(video,signal);const next=(_now,metadata)=>{if(this.frameSignals.get(video)!==signal)return;signal.serial++;signal.mediaTime=metadata.mediaTime;signal.token=video.requestVideoFrameCallback(next);};signal.token=video.requestVideoFrameCallback(next);}
  releaseVideo(video){const signal=this.frameSignals.get(video);if(signal&&signal.token!==null)video.cancelVideoFrameCallback?.(signal.token);this.frameSignals.delete(video);video.pause();video.removeAttribute('src');video.load();}
  async video(op,source,offline=false,offset=0,batch=null){
    const generation=this.generation;let video=this.videos.get(op.id);if(video)return video;
    const pooled=offline||batch!==null,key=JSON.stringify([offline?'offline':'live',offline?0:batch,source.id,op.range?.in??0,op.range?.out??sourceDuration(source),source.playbackRate||1,offset]);
    if(pooled&&this.offlineVideoGroups.has(key)){video=await this.offlineVideoGroups.get(key);if(generation!==this.generation){this.releaseVideo(video);throw Error('Living render cancelled.');}this.videos.set(op.id,video);return video;}
    const loading=(async()=>{const media=document.createElement('video');media.muted=true;media.playsInline=true;media.preload='auto';await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Living video clone timed out.')),15000);media.addEventListener('loadeddata',()=>{clearTimeout(timer);resolve();},{once:true});media.addEventListener('error',()=>{clearTimeout(timer);reject(Error('Could not clone living video: '+source.name));},{once:true});media.src=source.data;});return media;})();
    if(pooled)this.offlineVideoGroups.set(key,loading);
    try{video=await loading;if(generation!==this.generation){this.releaseVideo(video);throw Error('Living render cancelled.');}this.trackVideo(video);if(pooled)this.videoGroupKeys.set(video,key);this.videos.set(op.id,video);return video;}catch(e){if(pooled)this.offlineVideoGroups.delete(key);throw e;}
  }

  fossilWeight(op,time=null){
    if(!op.fossil)return 1;
    if(!this.fossilStarts.has(op.id))this.fossilStarts.set(op.id,performance.now()/1000);
    return fossilStrength(time??(performance.now()/1000-this.fossilStarts.get(op.id)),op.fossil);
  }
  timedFossil(op){return !!op.fossil?.holdSeconds&&(this.fossilWeight(op)>0||this.fossilWeights.get(op.id)!==0);}
  setPlaybackRate(sourceId,rate){for(const op of this.active)if(op.source===sourceId){const video=this.videos.get(op.id);if(video)video.playbackRate=rate;}}
  resolve(operations){
    if(operations===this.resolvedOperations)return this.active;
    const fills=new Map(),hidden=new Set(),frozen=new Map();
    for(const op of operations){
      if(op.kind==='living-fill'){fills.set(op.id,op);for(const id of op.replaces||[])hidden.add(id);}
      if(op.kind==='living-control'){
        if(op.action==='freeze')for(const item of op.items||[])frozen.set(item.id,item.image);
        if(op.action==='unfreeze')for(const id of op.targets)frozen.delete(id);
        if(op.action==='bake')for(const id of op.targets)hidden.add(id);
      }
    }
    this.active=[...fills.values()].filter(op=>!hidden.has(op.id));this.frozen=frozen;this.resolvedOperations=operations;
    this.animated=this.active.some(op=>!frozen.has(op.id)&&(()=>{const source=this.sources.items.find(s=>s.id===op.source);return this.timedFossil(op)||!!op.fill||!!source?.procedural||source?.type==='video'||source?.data?.startsWith('data:image/gif')||op.wetShape&&!op.wetShape.dry&&op.wetShape.ticks<op.wetShape.total;})());
    const activeIds=new Set(this.active.map(op=>op.id));this.ghosts.retain(new Set(this.active.filter(op=>(op.ghost||op.taffy)&&!frozen.has(op.id)).map(op=>op.id)));for(const id of this.fossilStarts.keys())if(!activeIds.has(id)){this.fossilStarts.delete(id);this.fossilWeights.delete(id);}for(const id of this.masks.keys())if(!activeIds.has(id))this.masks.delete(id);for(const id of this.detectionScratches.keys())if(!activeIds.has(id))this.detectionScratches.delete(id);for(const id of this.depthMaps.keys())if(!activeIds.has(id))this.depthMaps.delete(id);for(const id of this.planeFrames.keys())if(!activeIds.has(id))this.planeFrames.delete(id);const needed=new Set(this.active.filter(op=>!frozen.has(op.id)).map(op=>op.id));const retired=new Set();for(const [id,video]of this.videos)if(!needed.has(id)){retired.add(video);this.videos.delete(id);this.mediaFrames.delete(id);}const retained=new Set(this.videos.values());for(const video of retired)if(!retained.has(video)){const group=this.videoGroupKeys.get(video);if(group)this.offlineVideoGroups.delete(group);this.releaseVideo(video);}if(!this.videos.size)this.offlineVideoGroups.clear();for(const [id,scratch]of this.scratches)if(!activeIds.has(id)){scratch.width=scratch.height=1;this.scratches.delete(id);}for(const [id,deformed]of this.deforms)if(!activeIds.has(id)){deformed.width=deformed.height=1;this.deforms.delete(id);}return this.active;
  }
  dispose(){this.generation++;this.resolve([]);this.ghosts.dispose();this.offlineVideoGroups.clear();this.proceduralSurfaces.clear();this.masks.clear();this.images.clear();this.detectionScratches.clear();this.detectionCanvas.width=this.detectionCanvas.height=1;}
  suspend(){for(const video of this.videos.values())video.pause();}
  mediaChanged(){let changed=false;for(const op of this.active){if(this.frozen.has(op.id))continue;if(op.fossil&&this.fossilWeight(op)!==this.fossilWeights.get(op.id))return true;if(op.fill)return true;const source=this.sources.items.find(s=>s.id===op.source);if(source?.procedural||source?.data?.startsWith('data:image/gif'))return true;if(source?.type!=='video')continue;const video=this.videos.get(op.id);if(!video)return true;const signal=this.frameSignals.get(video),frame=signal?signal.serial:video.currentTime;if(!Number.isFinite(frame))return true;const previous=this.mediaFrames.get(op.id);this.mediaFrames.set(op.id,frame);if(previous===undefined||frame!==previous)changed=true;}return changed;}
  advanceWet(now=performance.now()){
    if(!this.lastWetAt){this.lastWetAt=now;return false;}const steps=Math.floor((now-this.lastWetAt)/90);if(!steps)return false;this.lastWetAt+=steps*90;let changed=false;for(const op of this.active){const wet=op.wetShape;if(wet&&!wet.dry&&wet.ticks<wet.total){wet.ticks=Math.min(wet.total,wet.ticks+steps);changed=true;}}return changed;
  }
  dryWet(){let changed=false;for(const op of this.active)if(op.wetShape&&!op.wetShape.dry&&op.wetShape.ticks<op.wetShape.total){op.wetShape.dry=true;changed=true;}return changed;}
  async hit(x,y){for(const op of [...this.active].reverse()){const r=op.rect;if(x<r.x||y<r.y||x>=r.x+r.w||y>=r.y+r.h)continue;const m=await this.mask(op),px=Math.floor(x-r.x),py=Math.floor(y-r.y);if(m.data[(py*r.w+px)*4+3]>0)return op;}return null;}
  render(operations,options={}){
    const generation=this.generation,run=()=>{if(generation!==this.generation)throw Error('Living render cancelled.');return this.renderOnce(operations,options);};
    const pending=(this.renderQueue??Promise.resolve()).then(run);this.renderQueue=pending.catch(()=>{});return pending;
  }
  async renderOnce(operations,{time=null,play=true,offsets={},detection=true,fossilTime=time,fossilOffsets={}}={}){
    const unchanged=operations===this.resolvedOperations;
    const base=this.base;this.resize(base?.width||this.canvas.width,base?.height||this.canvas.height);
    this.resolve(operations);
    const wetChanged=time===null&&play&&this.advanceWet();
    if(wetChanged)this.animated=this.active.some(op=>!this.frozen.has(op.id)&&(()=>{const source=this.sources.items.find(s=>s.id===op.source);return this.timedFossil(op)||!!op.fill||!!source?.procedural||source?.type==='video'||source?.data?.startsWith('data:image/gif')||op.wetShape&&!op.wetShape.dry&&op.wetShape.ticks<op.wetShape.total;})());
    if(unchanged&&time===null&&play&&!this.animated)return false;
    if(unchanged&&time===null&&play&&!wetChanged&&!this.mediaChanged())return false;
    const videoBatch=++this.videoBatch;
    // Decode new regions together before clearing the last complete frame.
    await Promise.all(this.active.map(async op=>{
      if(this.frozen.has(op.id)){await this.image(this.frozen.get(op.id));return;}
      const source=this.sources.items.find(s=>s.id===op.source);
      await Promise.all([this.mask(op),op.image?this.image(op.image):Promise.resolve(),source?.type==='video'&&!op.fill?this.video(op,source,time!==null,op.range?0:(offsets[op.id]??offsets[source.id]??0),time===null?videoBatch:null):Promise.resolve()]);
    }));
    if(time!==null){
      const seeks=new Map();
      await Promise.all(this.active.map(async op=>{
        if(op.fill||this.frozen.has(op.id))return;const source=this.sources.items.find(s=>s.id===op.source);if(source?.type!=='video')return;
        const media=this.videos.get(op.id),rate=Number(source.playbackRate)||1,duration=sourceDuration(source)||(Number.isFinite(op.range?.out)?op.range.out:0);if(!media||duration<=0)return;
        media.pause();media.playbackRate=rate;const start=Math.max(0,Math.min(duration-.01,Number.isFinite(op.range?.in)?op.range.in:0)),end=Math.max(start+.01,Math.min(duration,Number.isFinite(op.range?.out)?op.range.out:duration)),span=end-start,offset=op.range?0:(Number(offsets[op.id]??offsets[source.id])||0),target=start+((offset+time*rate)%span+span)%span;
        if(!seeks.has(media)){const seek=Math.abs(media.currentTime-target)>.002?new Promise((resolve,reject)=>{const timer=setTimeout(()=>{media.removeEventListener('seeked',done);reject(Error('Living video seek timed out.'));},4000);function done(){clearTimeout(timer);resolve();}media.addEventListener('seeked',done,{once:true});media.currentTime=target;}):Promise.resolve();seeks.set(media,seek);}await seeks.get(media);
      }));
    }
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    const detectionCtx=this.detectionCanvas.getContext('2d');if(detection)detectionCtx.clearRect(0,0,this.canvas.width,this.canvas.height);
    const proceduralFrames=new Map(),solidifiedFrames=new Map();
    const processVideo=(source,media)=>{const frameTime=time===null?this.frameSignals.get(media)?.mediaTime:null,key=frameTime===undefined||frameTime===null?null:source.id+'/'+frameTime+'/'+JSON.stringify(source.solidify);if(key&&solidifiedFrames.has(key))return solidifiedFrames.get(key);const frame=solidifyFrame(source,media,{detection:true,frameTime});if(key)solidifiedFrames.set(key,frame);return frame;};
    for(const op of this.active){
      if(this.frozen.has(op.id)){const frozen=await this.image(this.frozen.get(op.id));this.ctx.drawImage(frozen,op.rect.x,op.rect.y,op.rect.w,op.rect.h);if(detection)detectionCtx.drawImage(frozen,op.rect.x,op.rect.y,op.rect.w,op.rect.h);continue;}
      const weight=this.fossilWeight(op,fossilTime===null?null:fossilTime-(fossilOffsets[op.id]??0));if(time===null)this.fossilWeights.set(op.id,weight);if(weight===0)continue;
      const source=this.sources.items.find(s=>s.id===op.source),r=op.rect;if(!source&&!op.fill&&!op.image)continue;
      let media=op.image?await this.image(op.image):source?.el;const fill=op.fill||source?.procedural;if(fill){const key=JSON.stringify(fill)+'/'+r.w+'/'+r.h;media=proceduralFrames.get(key);if(!media){const frame=renderProcedural(fill,r.w,r.h,time??performance.now()/1000);media=this.proceduralSurfaces.get(key);if(!media||media.width!==frame.width||media.height!==frame.height){media=surface(frame.width,frame.height);this.proceduralSurfaces.set(key,media);}media.getContext('2d').drawImage(frame,0,0);proceduralFrames.set(key,media);}while(this.proceduralSurfaces.size>16)this.proceduralSurfaces.delete(this.proceduralSurfaces.keys().next().value);}if(!op.fill&&source?.type==='video'){
        media=await this.video(op,source);const rate=Number(source.playbackRate)||1;media.playbackRate=rate;const duration=sourceDuration(source)||(Number.isFinite(op.range?.out)&&op.range.out>0?op.range.out:0);if(duration<=0)continue;const start=Math.max(0,Math.min(duration-.01,Number.isFinite(op.range?.in)?op.range.in:0)),end=Math.max(start+.01,Math.min(duration,Number.isFinite(op.range?.out)?op.range.out:duration)),span=end-start;
        if(time===null){media.loop=start<=.001&&end>=duration-.001;if(media.currentTime<start||(!media.loop&&media.currentTime>=end))media.currentTime=start;if(play&&media.paused)media.play().catch(()=>{});}
        else{media.pause();const offset=op.range?0:(Number(offsets[op.id]??offsets[source.id])||0),target=start+((offset+time*rate)%span+span)%span;if(Math.abs(media.currentTime-target)>.002)await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{media.removeEventListener('seeked',done);reject(Error('Living video seek timed out.'));},4000);function done(){clearTimeout(timer);resolve();}media.addEventListener('seeked',done,{once:true});media.currentTime=target;});}
      }
      let detectionMedia=detection&&source?.type==='video'?processVideo(source,media):media;
      let visibleMedia=source?.solidify?.enabled&&source.solidify.applyTo==='visible'?processVideo(source,media):media;
      if(op.ghost||op.taffy){visibleMedia=await this.ghosts.process(op,source,visibleMedia,{time,media});detectionMedia=visibleMedia;}
      const drawRegion=async(media,scratch,target)=>{
      const sw=media.videoWidth||media.naturalWidth||media.width,sh=media.videoHeight||media.naturalHeight||media.height;if(!sw||!sh)return;
      const ctx=scratch.getContext('2d');ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,r.w,r.h);const scale=Math.max(r.w/sw,r.h/sh),dw=sw*scale,dh=sh*scale;
      if(op.depthStyle?.mode==='plane'){let flat=this.planeFrames.get(op.id);if(!flat||flat.width!==r.w||flat.height!==r.h){flat=surface(r.w,r.h);this.planeFrames.set(op.id,flat);}flat.getContext('2d').clearRect(0,0,r.w,r.h);flat.getContext('2d').drawImage(media,(r.w-dw)/2,(r.h-dh)/2,dw,dh);drawPlane(ctx,flat,r.w,r.h,op.depthStyle.tilt);}else if(op.image)ctx.drawImage(media,0,0,r.w,r.h);else ctx.drawImage(media,(r.w-dw)/2,(r.h-dh)/2,dw,dh);if(op.depthStyle){const key=JSON.stringify(op.depthStyle)+'/'+(op.progress||0);let shade=this.depthMaps.get(op.id);if(shade?.key!==key){shade={key,canvas:depthShade(op)};this.depthMaps.set(op.id,shade);}ctx.globalCompositeOperation='multiply';ctx.drawImage(shade.canvas,0,0);}if(!op.image){ctx.globalCompositeOperation='destination-in';const mask=await this.mask(op);if(mask.global)ctx.drawImage(mask.image,r.x,r.y,r.w,r.h,0,0,r.w,r.h);else ctx.drawImage(mask.image,0,0,r.w,r.h);}
      const cells=livingWetCells(op);if(cells.length){const pad=Math.ceil(Math.max(r.w,r.h)*.35);let deformed=this.deforms.get(op.id);if(!deformed||deformed.width!==r.w+pad*2||deformed.height!==r.h+pad*2){deformed=surface(r.w+pad*2,r.h+pad*2);this.deforms.set(op.id,deformed);}const dc=deformed.getContext('2d');dc.clearRect(0,0,deformed.width,deformed.height);for(const cell of cells)dc.drawImage(scratch,cell.sx,cell.sy,cell.sw,cell.sh,cell.dx+pad,cell.dy+pad,cell.dw,cell.dh);target.drawImage(deformed,r.x-pad,r.y-pad);}else target.drawImage(scratch,r.x,r.y);
      };
      let scratch=this.scratches.get(op.id);if(!scratch||scratch.width!==r.w||scratch.height!==r.h){scratch=surface(r.w,r.h);this.scratches.set(op.id,scratch);}
      this.ctx.globalAlpha=weight;detectionCtx.globalAlpha=weight;
      try{
      await drawRegion(visibleMedia,scratch,this.ctx);
      if(detection&&detectionMedia===visibleMedia){const cells=livingWetCells(op);if(cells.length){const pad=Math.ceil(Math.max(r.w,r.h)*.35);detectionCtx.drawImage(this.deforms.get(op.id),r.x-pad,r.y-pad);}else detectionCtx.drawImage(scratch,r.x,r.y);}
      else if(detection){let probe=this.detectionScratches.get(op.id);if(!probe||probe.width!==r.w||probe.height!==r.h){probe=surface(r.w,r.h);this.detectionScratches.set(op.id,probe);}await drawRegion(detectionMedia,probe,detectionCtx);}
      }finally{this.ctx.globalAlpha=1;detectionCtx.globalAlpha=1;}

    }
    if(time===null)this.animated=this.active.some(op=>!this.frozen.has(op.id)&&(this.timedFossil(op)||!!op.fill||!!this.sources.items.find(s=>s.id===op.source&&(s.type==='video'||s.procedural||s.data?.startsWith('data:image/gif')))||op.wetShape&&!op.wetShape.dry&&op.wetShape.ticks<op.wetShape.total));
    return true;
  }
  async snapshots(operations,targets){
    await this.render(operations);const wanted=new Set(targets),items=[];
    for(const op of this.active)if(wanted.has(op.id)){if(op.image&&!op.fossil){items.push({id:op.id,rect:structuredClone(op.rect),image:op.image});continue;}const r=op.rect,c=surface(r.w,r.h);c.getContext('2d').drawImage(this.canvas,r.x,r.y,r.w,r.h,0,0,r.w,r.h);items.push({id:op.id,rect:structuredClone(r),image:c.toDataURL('image/png')});}
    return items;
  }
}
