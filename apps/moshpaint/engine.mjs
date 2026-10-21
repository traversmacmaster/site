import {preflightDataURL} from './media-limits.mjs';
import {clamp,rng,gesture} from './core.mjs';
import {surface,process,damage} from './processors.mjs';
import {reactPixels,settlePixels} from './wet.mjs';
export const paintTools=['image','stamp','ribbon','stretch','scatter','mosh','time','clean','tape','shredder','chroma','edge','timesmear'];
export const damageTools=['smear','sort','knife','compression','melt','repeat','damage-mosh','magnet','eraser'];
export const brushShapes=['round','block','strip','comb','shard'];
export function brushPath(ctx,shape,x,y,size,angle=0,seed=1){
  ctx.beginPath();
  if(!shape||shape==='round'){ctx.arc(x,y,size/2,0,Math.PI*2);ctx.clip();return;}
  ctx.save();ctx.translate(x,y);ctx.rotate(angle||0);
  if(shape==='block')ctx.rect(-size/2,-size/2,size,size);
  else if(shape==='strip')ctx.rect(-size/2,-size*.16,size,size*.32);
  else if(shape==='comb'){const tooth=Math.max(1,size*.08);for(let i=-2;i<=2;i++)ctx.rect(-size/2,i*size*.18-tooth/2,size,tooth);}
  else if(shape==='shard'){const random=rng(seed);for(let i=0;i<7;i++){const a=Math.PI*2*i/7,r=size*(.31+random()*.2),px=Math.cos(a)*r,py=Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();}
  ctx.restore();ctx.clip();
}
export class Engine{
  constructor(canvas,sources){this.canvas=canvas;this.ctx=canvas.getContext('2d',{willReadFrequently:true});this.sources=sources;this.config={width:1200,height:900,background:'#ffffff'};this.maskCacheUrl='';this.maskCache=null;this.clear();}
  clear(config=this.config){this.config={...config};this.canvas.width=config.width;this.canvas.height=config.height;this.ctx.clearRect(0,0,config.width,config.height);if(config.background!=='transparent'){this.ctx.fillStyle=config.background;this.ctx.fillRect(0,0,config.width,config.height);}}
  captureMaskBase(){return this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height);}
  async applyMask(op,base){
    const r=op.maskRect;if(!this.maskCache||this.maskCacheUrl!==op.mask){const image=new Image();image.src=op.mask;await image.decode();const canvas=surface(image.naturalWidth,image.naturalHeight);canvas.getContext('2d').drawImage(image,0,0);this.maskCacheUrl=op.mask;this.maskCache=canvas;}
    const maskCtx=this.maskCache.getContext('2d',{willReadFrequently:true}),coverage=maskCtx.getImageData(0,0,r.w,r.h).data,painted=this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height),out=painted.data,original=base.data;
    for(let y=0;y<this.canvas.height;y++)for(let x=0;x<this.canvas.width;x++){const i=(y*this.canvas.width+x)*4,mi=(y-r.y)*r.w+(x-r.x),a=x>=r.x&&y>=r.y&&x<r.x+r.w&&y<r.y+r.h?coverage[mi*4+3]/255:0;if(a>=1)continue;if(a<=0){out[i]=original[i];out[i+1]=original[i+1];out[i+2]=original[i+2];out[i+3]=original[i+3];continue;}for(let c=0;c<4;c++)out[i+c]=Math.round(original[i+c]+(out[i+c]-original[i+c])*a);}
    this.ctx.putImageData(painted,0,0);
  }
  async dab(op,index){
    const p=op.points[index],prev=op.points[Math.max(0,index-1)],g=gesture(prev,p),ctx=this.ctx;
    const size=clamp(op.size*(p.pressure||1),1,768),random=rng(op.seed+index*113),amount=op.amount;
    ctx.save();
    if(op.clip){ctx.beginPath();if(op.clip.path){op.clip.path.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();}else ctx.rect(op.clip.x,op.clip.y,op.clip.w,op.clip.h);ctx.clip();}
    if(paintTools.includes(op.tool)){
      const frame=await this.sources.frame(op.frames[p.frame||0]);
      const base=surface(192,192);base.getContext('2d').drawImage(frame,0,0,192,192);
      const kind=op.tool==='clean'?'clean':op.tool==='mosh'?'mosh':op.tool==='chroma'?'rgb':op.tool==='edge'?'edge':op.treatment;
      const patch=process(base,kind,op.tool==='mosh'?clamp(amount+g.velocity*.12+Math.abs(p.curvature||0)*.15,0,1):amount,op.seed+index,{...op.advanced,dx:g.dx,dy:g.dy});
      if(op.tool==='timesmear'&&index>0){const earlier=op.points[Math.max(0,index-2)]?.frame??0,old=await this.sources.frame(op.frames[earlier]);const pc=patch.getContext('2d');pc.globalAlpha=.25+amount*.4;pc.drawImage(old,-g.dx*.7,-g.dy*.7,192,192);pc.globalAlpha=1;}
      if(op.tool==='mosh'&&index>0&&(op.advanced.feedback??.4)>0){const feedback=surface(192,192),fc=feedback.getContext('2d');fc.drawImage(this.canvas,p.x-size/2,p.y-size/2,size,size,0,0,192,192);const pc=patch.getContext('2d');pc.globalAlpha=(op.advanced.feedback??.4)*.55;pc.drawImage(feedback,g.dx*.2,g.dy*.2);pc.globalAlpha=1;}
      ctx.globalAlpha=op.tool==='clean'?1:.55+amount*.45;
      if(op.tool==='stamp'){if(index===0||g.distance>size*.4){if(op.shape)brushPath(ctx,op.shape,p.x,p.y,size,g.angle,op.seed+index);ctx.drawImage(patch,p.x-size/2,p.y-size/2,size,size);}}
      else if(op.tool==='tape'){ctx.translate(p.x,p.y);ctx.rotate(g.angle);ctx.drawImage(patch,-Math.max(3,g.distance),-size*.11,Math.max(size*.25,g.distance+3),size*.22);}
      else if(op.tool==='shredder'){ctx.translate(p.x,p.y);ctx.rotate(g.angle);const teeth=7,h=size/teeth*.55;for(let n=0;n<teeth;n++){const y=(n-(teeth-1)/2)*size/teeth;ctx.drawImage(patch,0,n*192/teeth,192,192/teeth,-size*.5,y-h/2,size,h);}}
      else if(op.tool==='ribbon'||op.tool==='stretch'){
        const len=op.tool==='stretch'?Math.max(size,Math.hypot(p.x-op.points[0].x,p.y-op.points[0].y)):Math.max(size*.15,g.distance+4);
        ctx.translate(p.x,p.y);ctx.rotate(g.angle);ctx.drawImage(patch,-len,-size/2,len+2,size);
      }else if(op.tool==='scatter'){
        for(let n=0;n<5;n++){const s=size*(.1+random()*.24),x=p.x+(random()-.5)*size*1.8,y=p.y+(random()-.5)*size*1.8;ctx.drawImage(patch,random()*100,random()*100,80,80,x-s/2,y-s/2,s,s);}
      }else if(op.tool==='chroma'){
        ctx.globalCompositeOperation='screen';for(const [dx,dy]of [[-g.dx*.35,-g.dy*.35],[0,0],[g.dx*.35,g.dy*.35]]){ctx.save();brushPath(ctx,op.shape||'round',p.x+dx,p.y+dy,size,g.angle,op.seed+index);ctx.globalAlpha=.48+amount*.18;ctx.drawImage(patch,p.x-size/2+dx,p.y-size/2+dy,size,size);ctx.restore();}
      }else{
        brushPath(ctx,op.shape||'round',p.x,p.y,size,g.angle,op.seed+index);ctx.drawImage(patch,p.x-size/2,p.y-size/2,size,size);
      }
    }else if(damageTools.includes(op.tool)){
      if(op.tool==='eraser'){ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(p.x,p.y,size/2,0,Math.PI*2);ctx.fill();}
      else damage(this.canvas,p.x,p.y,size,op.tool==='damage-mosh'?'mosh':op.tool,amount,op.seed+index,{...op.advanced,dx:g.dx,dy:g.dy});
    }else if(op.tool==='brush'||op.tool==='pencil'){
      ctx.strokeStyle=op.color;ctx.fillStyle=op.color;ctx.lineWidth=op.tool==='pencil'?Math.min(size,3):size;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(p.x,p.y);ctx.stroke();if(index===0){ctx.beginPath();ctx.arc(p.x,p.y,ctx.lineWidth/2,0,Math.PI*2);ctx.fill();}
    }
    ctx.restore();
    if(op.reactive?.length&&index>0)reactPixels(this.canvas,op.reactive,op,p,g);
    if(op.wet>0&&index>0&&paintTools.includes(op.tool)){
      ctx.save();if(op.clip){ctx.beginPath();if(op.clip.path){op.clip.path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}else ctx.rect(op.clip.x,op.clip.y,op.clip.w,op.clip.h);ctx.clip();}
      damage(this.canvas,prev.x,prev.y,size*.9,'smear',op.wet*.2,op.seed+index,{dx:g.dx*.6,dy:g.dy*.6});ctx.restore();
    }
  }
  finish(op){
    const ctx=this.ctx,a=op.points?.[0],b=op.points?.at(-1);
    ctx.save();if(op.clip){ctx.beginPath();if(op.clip.path){op.clip.path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}else ctx.rect(op.clip.x,op.clip.y,op.clip.w,op.clip.h);ctx.clip();}
    ctx.strokeStyle=op.color;ctx.fillStyle=op.color;ctx.lineWidth=Math.max(1,Math.min(op.size,50));
    if(op.tool==='line'){ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    if(op.tool==='rectangle')ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y);
    if(op.tool==='ellipse'){ctx.beginPath();ctx.ellipse((a.x+b.x)/2,(a.y+b.y)/2,Math.max(1,Math.abs(a.x-b.x)/2),Math.max(1,Math.abs(a.y-b.y)/2),0,0,Math.PI*2);ctx.stroke();}
    if(op.tool==='text'){ctx.font=`700 ${op.size}px Segoe UI, sans-serif`;ctx.fillText(op.text,a.x,a.y);}
    if(op.tool==='fill')this.fill(a.x,a.y,op.color,op.clip);
    ctx.restore();
  }
  fill(x,y,color,clip){
    const w=this.canvas.width,h=this.canvas.height;x=clamp(Math.floor(x),0,w-1);y=clamp(Math.floor(y),0,h-1);
    const image=this.ctx.getImageData(0,0,w,h),d=image.data,idx=(y*w+x)*4,target=d.slice(idx,idx+4),rgb=color.match(/\w\w/g)?.map(n=>parseInt(n,16));if(!rgb||rgb.length!==3)return;
    if(target[0]===rgb[0]&&target[1]===rgb[1]&&target[2]===rgb[2]&&target[3]===255)return;
    const seen=new Uint8Array(w*h),stack=[y*w+x];
    const inside=(px,py)=>{if(!clip)return true;if(px<clip.x||py<clip.y||px>=clip.x+clip.w||py>=clip.y+clip.h)return false;if(!clip.path)return true;let yes=false;for(let i=0,j=clip.path.length-1;i<clip.path.length;j=i++){const a=clip.path[i],b=clip.path[j];if(((a.y>py)!==(b.y>py))&&(px<(b.x-a.x)*(py-a.y)/(b.y-a.y)+a.x))yes=!yes;}return yes;};
    while(stack.length){const p=stack.pop(),xx=p%w,yy=Math.floor(p/w),i=p*4;if(seen[p]||!inside(xx,yy))continue;seen[p]=1;if(Math.abs(d[i]-target[0])+Math.abs(d[i+1]-target[1])+Math.abs(d[i+2]-target[2])+Math.abs(d[i+3]-target[3])>24)continue;d.set([...rgb,255],i);if(xx>0)stack.push(p-1);if(xx<w-1)stack.push(p+1);if(yy>0)stack.push(p-w);if(yy<h-1)stack.push(p+w);}
    this.ctx.putImageData(image,0,0);
  }
  selection(op,cachedPatch=null){
    const r=op.rect,patch=surface(r.w,r.h),pc=patch.getContext('2d');
    if(r.path){pc.beginPath();r.path.forEach((p,i)=>i?pc.lineTo(p.x-r.x,p.y-r.y):pc.moveTo(p.x-r.x,p.y-r.y));pc.closePath();pc.clip();}
    pc.drawImage(cachedPatch||this.canvas,cachedPatch?0:r.x,cachedPatch?0:r.y,cachedPatch?cachedPatch.width:r.w,cachedPatch?cachedPatch.height:r.h,0,0,r.w,r.h);
    const ctx=this.ctx;ctx.save();ctx.beginPath();if(r.path){r.path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}else ctx.rect(r.x,r.y,r.w,r.h);ctx.clip();
    if(['move','scale','stretch'].includes(op.action))ctx.clearRect(r.x,r.y,r.w,r.h);
    else{const out=process(patch,op.action,op.amount,op.seed,op.advanced);ctx.clearRect(r.x,r.y,r.w,r.h);ctx.drawImage(out,r.x,r.y);}
    ctx.restore();if(['move','scale','stretch'].includes(op.action)){ctx.save();ctx.imageSmoothingEnabled=op.resample!=='nearest';ctx.drawImage(patch,r.x+(op.dx||0),r.y+(op.dy||0),r.w*(op.sx||1),r.h*(op.sy||1));ctx.restore();}
  }
  wreck(op){const r=rng(op.seed),kinds=['mosh','sort','rgb','block','melt','echo'],movement=.2+clamp(op.amount??.65,0,1)*1.23;const region=op.clip||{x:0,y:0,w:this.canvas.width,h:this.canvas.height};for(let i=0;i<18;i++)damage(this.canvas,region.x+r()*region.w,region.y+r()*region.h,80+r()*Math.min(600,region.w),kinds[Math.floor(r()*kinds.length)],.35+r()*.65,op.seed+i,{dx:(r()-.5)*140*movement,dy:(r()-.5)*80*movement,block:8+r()*28});}
  async apply(op,onPoint){
    if(op.kind==='wet-control'){for(let tick=0;tick<(op.settle?.ticks||0);tick++){settlePixels(this.canvas,op.settle.regions,tick);if(onPoint)await onPoint(-1,op.settle.ticks,{kind:'wet',duration:90});else if(tick%4===0)await new Promise(r=>setTimeout(r,0));}return;}
    if(op.kind==='living-fill'||op.kind==='living-control'&&op.action!=='bake')return;
    if(op.kind==='living-control'&&op.action==='bake'){for(const item of op.items){const image=new Image();image.src=item.image;await image.decode();this.ctx.drawImage(image,item.rect.x,item.rect.y,item.rect.w,item.rect.h);}return;}
    if(op.kind==='place'){
      const dims=preflightDataURL(op.image);if(!dims||dims.width>4096||dims.height>4096)throw Error('Placed image exceeds canvas limits.');
      const img=new Image();img.src=op.image;await img.decode();
      this.ctx.drawImage(img,op.rect.x,op.rect.y,op.rect.w,op.rect.h);return;
    }
    if(op.kind==='wreck'){if(op.clip){this.ctx.save();this.ctx.beginPath();if(op.clip.path){op.clip.path.forEach((p,i)=>i?this.ctx.lineTo(p.x,p.y):this.ctx.moveTo(p.x,p.y));this.ctx.closePath();}else this.ctx.rect(op.clip.x,op.clip.y,op.clip.w,op.clip.h);this.ctx.clip();}this.wreck(op);if(op.clip)this.ctx.restore();for(let tick=0;tick<(op.settle?.ticks||0);tick++)settlePixels(this.canvas,op.settle.regions,tick);return;}
    if(op.kind==='selection'){if(op.action==='time'){for(const stroke of op.strokes)await this.apply(stroke,onPoint);}else this.selection(op);for(let tick=0;tick<(op.settle?.ticks||0);tick++)settlePixels(this.canvas,op.settle.regions,tick);return;}
    const maskBase=op.mask?this.captureMaskBase(op):null;
    for(let i=0;i<op.points.length;i++){await this.dab(op,i);if(onPoint)await onPoint(i,op.points.length);else if(i%40===0)await new Promise(r=>setTimeout(r,0));}this.finish(op);
    for(let tick=0;tick<(op.settle?.ticks||0);tick++){settlePixels(this.canvas,op.settle.regions,tick);if(onPoint)await onPoint(-1,op.settle.ticks,{kind:'wet',duration:90});else if(tick%4===0)await new Promise(r=>setTimeout(r,0));}if(maskBase)await this.applyMask(op,maskBase);
  }
}
