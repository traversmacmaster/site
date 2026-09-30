import {surface} from './processors.mjs';
import {sourceDuration} from './sources.mjs';
import {rng} from './core.mjs';

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
export function colorMask(canvas,x,y,tolerance=.1,{mode='connected',invert=false}={}){
  const w=canvas.width,h=canvas.height,ctx=canvas.getContext('2d',{willReadFrequently:true});x=Math.max(0,Math.min(w-1,Math.floor(x)));y=Math.max(0,Math.min(h-1,Math.floor(y)));
  const d=ctx.getImageData(0,0,w,h).data,start=(y*w+x)*4,target=[d[start],d[start+1],d[start+2],d[start+3]],targetLab=oklab(target[0],target[1],target[2]),selected=new Uint8Array(w*h),distances=new Float32Array(w*h),colorLimit=.008+Math.max(0,Math.min(.3,tolerance))*.32,alphaLimit=3+Math.max(0,Math.min(.3,tolerance))*80;
  const matches=p=>{const i=p*4,lab=oklab(d[i],d[i+1],d[i+2]),distance=Math.hypot(lab[0]-targetLab[0],lab[1]-targetLab[1],lab[2]-targetLab[2]);distances[p]=distance;return Math.abs(d[i+3]-target[3])<=alphaLimit&&distance<=colorLimit;};
  if(mode==='connected'&&!invert){
    const seen=new Uint8Array(w*h),stack=[y*w+x];while(stack.length){const p=stack.pop();if(seen[p])continue;seen[p]=1;if(!matches(p))continue;selected[p]=1;const px=p%w,py=Math.floor(p/w);if(px)stack.push(p-1);if(px<w-1)stack.push(p+1);if(py)stack.push(p-w);if(py<h-1)stack.push(p+w);}
  }else for(let p=0;p<w*h;p++)if(matches(p)!==invert)selected[p]=1;
  let initial=0;for(const value of selected)initial+=value;
  if(initial>16&&!invert){const tightened=selected.slice(),seed=y*w+x;for(let p=0;p<w*h;p++){if(!selected[p]||p===seed||distances[p]<=colorLimit*.78)continue;const px=p%w,py=Math.floor(p/w),neighbors=(px?selected[p-1]:0)+(px<w-1?selected[p+1]:0)+(py?selected[p-w]:0)+(py<h-1?selected[p+w]:0);if(neighbors<=1)tightened[p]=0;}selected.set(tightened);}
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
export function livingStrokeMask(points,size,shape='round',seed=1,bounds=null,fixedRect=null){
  if(!points?.length)return null;const pad=size*.72;let rect=fixedRect;
  if(!rect){let left=Math.floor(Math.min(...points.map(p=>p.x))-pad),top=Math.floor(Math.min(...points.map(p=>p.y))-pad),right=Math.ceil(Math.max(...points.map(p=>p.x))+pad),bottom=Math.ceil(Math.max(...points.map(p=>p.y))+pad);if(bounds){left=Math.max(0,left);top=Math.max(0,top);right=Math.min(bounds.width,right);bottom=Math.min(bounds.height,bottom);}if(right<=left||bottom<=top)return null;rect={x:left,y:top,w:right-left,h:bottom-top};}
  const canvas=surface(rect.w,rect.h),ctx=canvas.getContext('2d');ctx.fillStyle='#fff';drawLivingStroke(ctx,points,size,shape,seed,rect);return{rect:{...rect},canvas,mask:canvas.toDataURL('image/png')};
}

export class LivingRenderer{
  constructor(canvas,sources){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.base=canvas.previousElementSibling;this.sources=sources;this.masks=new Map();this.images=new Map();this.videos=new Map();this.mediaFrames=new Map();this.scratches=new Map();this.deforms=new Map();this.active=[];this.frozen=new Map();this.resolvedOperations=null;this.animated=false;this.lastWetAt=0;}
  invalidate(){this.resolvedOperations=null;}
  resize(width,height){if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;}}
  async mask(op){const src=op.tool==='livingbrush'&&op.progress?`${op.mask}#${op.progress}`:op.mask;let item=this.masks.get(op.id);if(item?.src===src)return item;let image;if(op.tool==='livingbrush'&&op.progress){image=livingStrokeMask(op.points.slice(0,op.progress),op.size,op.shape,op.seed,null,op.rect).canvas;}else{image=new Image();image.src=op.mask;await image.decode();}const probe=surface(image.width,image.height),ctx=probe.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);item={src,image,data:ctx.getImageData(0,0,image.width,image.height).data};this.masks.set(op.id,item);return item;}
  async image(src){let image=this.images.get(src);if(image)return image;image=new Image();image.src=src;await image.decode();this.images.set(src,image);return image;}
  async video(op,source){let video=this.videos.get(op.id);if(video)return video;video=document.createElement('video');video.muted=true;video.preload='auto';video.src=source.data;await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Living video clone timed out.')),15000);video.addEventListener('loadeddata',()=>{clearTimeout(timer);resolve();},{once:true});video.addEventListener('error',()=>{clearTimeout(timer);reject(Error(`Could not clone living video: ${source.name}`));},{once:true});});this.videos.set(op.id,video);return video;}
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
    this.animated=this.active.some(op=>!frozen.has(op.id)&&(()=>{const source=this.sources.items.find(s=>s.id===op.source);return source?.type==='video'||source?.data?.startsWith('data:image/gif')||op.wetShape&&!op.wetShape.dry&&op.wetShape.ticks<op.wetShape.total;})());
    const activeIds=new Set(this.active.map(op=>op.id)),needed=new Set(this.active.filter(op=>!frozen.has(op.id)).map(op=>op.id));for(const [id,video]of this.videos)if(!needed.has(id)){video.pause();video.removeAttribute('src');video.load();this.videos.delete(id);this.mediaFrames.delete(id);}for(const [id,scratch]of this.scratches)if(!activeIds.has(id)){scratch.width=scratch.height=1;this.scratches.delete(id);}for(const [id,deformed]of this.deforms)if(!activeIds.has(id)){deformed.width=deformed.height=1;this.deforms.delete(id);}return this.active;
  }
  suspend(){for(const video of this.videos.values())video.pause();}
  mediaChanged(){let changed=false;for(const op of this.active){if(this.frozen.has(op.id))continue;const source=this.sources.items.find(s=>s.id===op.source);if(source?.data?.startsWith('data:image/gif'))return true;if(source?.type!=='video')continue;const video=this.videos.get(op.id);if(!video)return true;const quality=video.getVideoPlaybackQuality?.(),frame=quality?.totalVideoFrames??video.webkitDecodedFrameCount;if(!Number.isFinite(frame))return true;const previous=this.mediaFrames.get(op.id);this.mediaFrames.set(op.id,frame);if(previous===undefined||frame!==previous)changed=true;}return changed;}
  advanceWet(now=performance.now()){
    if(!this.lastWetAt){this.lastWetAt=now;return false;}const steps=Math.floor((now-this.lastWetAt)/90);if(!steps)return false;this.lastWetAt+=steps*90;let changed=false;for(const op of this.active){const wet=op.wetShape;if(wet&&!wet.dry&&wet.ticks<wet.total){wet.ticks=Math.min(wet.total,wet.ticks+steps);changed=true;}}return changed;
  }
  dryWet(){let changed=false;for(const op of this.active)if(op.wetShape&&!op.wetShape.dry&&op.wetShape.ticks<op.wetShape.total){op.wetShape.dry=true;changed=true;}return changed;}
  async hit(x,y){for(const op of [...this.active].reverse()){const r=op.rect;if(x<r.x||y<r.y||x>=r.x+r.w||y>=r.y+r.h)continue;const m=await this.mask(op),px=Math.floor(x-r.x),py=Math.floor(y-r.y);if(m.data[(py*r.w+px)*4+3]>0)return op;}return null;}
  async render(operations,{time=null,play=true,offsets={}}={}){
    const unchanged=operations===this.resolvedOperations;
    const base=this.base;this.resize(base?.width||this.canvas.width,base?.height||this.canvas.height);
    this.resolve(operations);
    const wetChanged=time===null&&play&&this.advanceWet();
    if(wetChanged)this.animated=this.active.some(op=>!this.frozen.has(op.id)&&(()=>{const source=this.sources.items.find(s=>s.id===op.source);return source?.type==='video'||source?.data?.startsWith('data:image/gif')||op.wetShape&&!op.wetShape.dry&&op.wetShape.ticks<op.wetShape.total;})());
    if(unchanged&&time===null&&play&&!this.animated)return false;
    if(unchanged&&time===null&&play&&!wetChanged&&!this.mediaChanged())return false;
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    for(const op of this.active){
      if(this.frozen.has(op.id)){this.ctx.drawImage(await this.image(this.frozen.get(op.id)),op.rect.x,op.rect.y,op.rect.w,op.rect.h);continue;}
      const source=this.sources.items.find(s=>s.id===op.source),r=op.rect;if(!source)continue;
      let media=source.el;if(source.type==='video'){
        media=await this.video(op,source);const rate=Number(source.playbackRate)||1;media.playbackRate=rate;const duration=sourceDuration(source)||(Number.isFinite(op.range?.out)&&op.range.out>0?op.range.out:0);if(duration<=0)continue;const start=Math.max(0,Math.min(duration-.01,Number.isFinite(op.range?.in)?op.range.in:0)),end=Math.max(start+.01,Math.min(duration,Number.isFinite(op.range?.out)?op.range.out:duration)),span=end-start;
        if(time===null){if(media.currentTime<start||media.currentTime>=end)media.currentTime=start;if(play&&media.paused)media.play().catch(()=>{});}
        else{media.pause();const offset=op.range?0:(Number(offsets[op.id]??offsets[source.id])||0),target=start+((offset+time*rate)%span+span)%span;if(Math.abs(media.currentTime-target)>.025)await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{media.removeEventListener('seeked',done);reject(Error('Living video seek timed out.'));},4000);function done(){clearTimeout(timer);resolve();}media.addEventListener('seeked',done,{once:true});media.currentTime=target;});}
      }
      const sw=media.videoWidth||media.naturalWidth,sh=media.videoHeight||media.naturalHeight;if(!sw||!sh)continue;
      let scratch=this.scratches.get(op.id);if(!scratch||scratch.width!==r.w||scratch.height!==r.h){scratch=surface(r.w,r.h);this.scratches.set(op.id,scratch);}const ctx=scratch.getContext('2d');ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,r.w,r.h);const scale=Math.max(r.w/sw,r.h/sh),dw=sw*scale,dh=sh*scale;
      ctx.drawImage(media,(r.w-dw)/2,(r.h-dh)/2,dw,dh);ctx.globalCompositeOperation='destination-in';ctx.drawImage((await this.mask(op)).image,0,0,r.w,r.h);
      const cells=livingWetCells(op);if(cells.length){const pad=Math.ceil(Math.max(r.w,r.h)*.35);let deformed=this.deforms.get(op.id);if(!deformed||deformed.width!==r.w+pad*2||deformed.height!==r.h+pad*2){deformed=surface(r.w+pad*2,r.h+pad*2);this.deforms.set(op.id,deformed);}const dc=deformed.getContext('2d');dc.clearRect(0,0,deformed.width,deformed.height);for(const cell of cells)dc.drawImage(scratch,cell.sx,cell.sy,cell.sw,cell.sh,cell.dx+pad,cell.dy+pad,cell.dw,cell.dh);this.ctx.drawImage(deformed,r.x-pad,r.y-pad);}else this.ctx.drawImage(scratch,r.x,r.y);
    }
    return true;
  }
  async snapshots(operations,targets){
    await this.render(operations);const wanted=new Set(targets),items=[];
    for(const op of this.active)if(wanted.has(op.id)){const r=op.rect,c=surface(r.w,r.h);c.getContext('2d').drawImage(this.canvas,r.x,r.y,r.w,r.h,0,0,r.w,r.h);items.push({id:op.id,rect:structuredClone(r),image:c.toDataURL('image/png')});}
    return items;
  }
}
