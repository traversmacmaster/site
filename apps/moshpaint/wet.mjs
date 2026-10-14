import {clamp,gesture,rng} from './core.mjs';
import {damage} from './processors.mjs';

export const WET_INTERVAL=90;
export const MAX_WET_REGIONS=20;
export const WET_PHYSICS_DEFAULTS=Object.freeze({mode:'legacy',angle:90,force:.5,viscosity:.5,spread:0,dryRate:.5,edgeHold:0});
export function wetPhysics(value={}){
  const mode=['legacy','down','up','left','right','angle','radial-in','radial-out','gesture'].includes(value.mode)?value.mode:'legacy';
  return{mode,angle:clamp(Number(value.angle)||0,-180,180),force:clamp(Number(value.force??.5),0,1),viscosity:clamp(Number(value.viscosity??.5),0,1),spread:clamp(Number(value.spread)||0,0,1),dryRate:clamp(Number(value.dryRate??.5),0,1),edgeHold:clamp(Number(value.edgeHold)||0,0,1)};
}
// Seventy percent now reaches the former full-wet response; the remaining
// slider range adds extra gravity and travel without changing saved values.
const wetFlood=amount=>clamp((amount-.5)/.2,0,1.6);

export function clipRegion(ctx,clip){
  if(!clip)return;
  ctx.beginPath();
  if(clip.path){clip.path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}
  else ctx.rect(clip.x,clip.y,clip.w,clip.h);
  ctx.clip();
}

export function depositedRegions(op){
  if(op.kind==='wet-control'&&op.action==='rewet')return structuredClone(op.regions||[]);
  if(op.wet&&op.wetEffect&&['wreck','selection'].includes(op.kind)){
    const rect=op.clip||op.rect,random=rng((op.seed^0x71e7cafe)>>>0),points=[];
    if(!rect)return [];
    for(let i=0;i<MAX_WET_REGIONS;i++)points.push({x:rect.x+random()*rect.w,y:rect.y+random()*rect.h,t:i*WET_INTERVAL,pressure:.65+random()*.35});
    const regions=depositedRegions({tool:'clean',treatment:op.kind==='wreck'&&random()>.45?'rgb':'melt',wet:op.wet,wetPhysics:op.wetPhysics,seed:op.seed,size:clamp(Math.min(rect.w,rect.h)*(.08+op.wet*.08),24,112),points,clip:op.clip||op.rect,started:0});
    return wetPhysics(op.wetPhysics).mode==='legacy'?regions.map(region=>({...region,dy:Math.max(.8,Math.abs(region.dy))})):regions;
  }
  if(!op.wet||!['image','stamp','ribbon','stretch','scatter','mosh','time','clean','tape','shredder','chroma','edge','timesmear'].includes(op.tool))return [];
  const points=op.points,flood=wetFlood(op.wet),shapeFlood=Math.min(1,flood),response=clamp(op.wet/.7,0,1),limit=flood?MAX_WET_REGIONS:10;
  const step=Math.max(1,Math.ceil(points.length/limit)),regions=[],random=rng((op.seed^0x71e7cafe)>>>0);
  const physics=wetPhysics(op.wetPhysics),modern=physics.mode!=='legacy',center=points.reduce((a,p)=>({x:a.x+p.x/points.length,y:a.y+p.y/points.length}),{x:0,y:0});
  for(let i=0;i<points.length;i+=step){
    const p=points[i],prev=points[Math.max(0,i-step)],g=gesture(prev,p);
    const column=.8-shapeFlood*(.48+random()*.18),legacyLife=Math.min(40,8+Math.round(response*20+shapeFlood*12)),life=modern?Math.min(40,Math.max(2,Math.round(legacyLife*(1.65-physics.dryRate*1.15)))):legacyLife;
    const kind=op.treatment==='rgb'||(flood>.28&&regions.length%4===2)?'rgb':'smear';
    if(!modern){regions.push({x:p.x+(random()-.5)*op.size*flood*.22,y:p.y,size:clamp(op.size*(p.pressure||1)*column,8,flood?112:180),dx:clamp(g.dx*.1+(random()-.5)*flood*1.4,-5,5)||.7,dy:clamp(g.dy*.06+.6+flood*(2.35+random()*1.35),-4,5),life,total:life,amount:op.wet,seed:(op.seed+i)>>>0,kind,clip:op.clip||null});continue;}
    let vx=0,vy=1;
    if(physics.mode==='up')vy=-1;else if(physics.mode==='left'){vx=-1;vy=0;}else if(physics.mode==='right'){vx=1;vy=0;}else if(physics.mode==='angle'){const a=physics.angle*Math.PI/180;vx=Math.cos(a);vy=Math.sin(a);}else if(physics.mode.startsWith('radial')){const d=Math.hypot(p.x-center.x,p.y-center.y)||1,sign=physics.mode==='radial-in'?-1:1;vx=(p.x-center.x)/d*sign;vy=(p.y-center.y)/d*sign;}else if(physics.mode==='gesture'){const d=Math.hypot(g.dx,g.dy)||1,speed=clamp(g.velocity*12,.25,2);vx=g.dx/d*speed;vy=g.dy/d*speed;}
    const edge=Math.sin(Math.PI*(i+step)/(points.length+step)),mobility=(1-physics.edgeHold*(1-edge*.75))*(1-physics.viscosity*.78),force=physics.force*5;
    regions.push({x:p.x+(random()-.5)*op.size*flood*.22,y:p.y,size:clamp(op.size*(p.pressure||1)*column,8,flood?112:180),dx:clamp(vx*force*mobility+g.dx*.025,-5,5),dy:clamp(vy*force*mobility+g.dy*.025,-5,5),life,total:life,amount:op.wet,seed:(op.seed+i)>>>0,kind,clip:op.clip||null,physics:true,spread:physics.spread,viscosity:physics.viscosity,edgeHold:physics.edgeHold});
  }
  return regions;
}

export function wetSelectionRegions({rect,points,seed,wet,wetPhysics:physics,size=96}){
  const chosen=(points||[]).slice(0,MAX_WET_REGIONS);
  if(!rect||!chosen.length||!wet)return [];
  return depositedRegions({tool:'clean',treatment:'clean',wet,wetPhysics:physics,seed,size,points:chosen.map((p,i)=>({x:p.x,y:p.y,t:i*WET_INTERVAL,pressure:1})),clip:rect,started:0});
}

export function controlsRegion(region,rect){
  if(!rect)return true;
  if(region.x<rect.x||region.y<rect.y||region.x>rect.x+rect.w||region.y>rect.y+rect.h)return false;
  if(!rect.path)return true;
  let inside=false;
  for(let i=0,j=rect.path.length-1;i<rect.path.length;j=i++){
    const a=rect.path[i],b=rect.path[j];
    if((a.y>region.y)!==(b.y>region.y)&&region.x<(b.x-a.x)*(region.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}

export function controlWetRegions(regions,action,rect){
  if(action==='dry')return regions.filter(region=>!controlsRegion(region,rect));
  if(action==='freeze')return regions.map(region=>controlsRegion(region,rect)?{...region,dx:0,dy:0}:region);
  return structuredClone(regions);
}

export function ageRegions(regions,steps){
  return regions.map(r=>{const flood=wetFlood(r.amount),travel=(.18+flood*.7)*(r.physics?1-r.viscosity*.45:1);return {...r,x:r.x+r.dx*steps*travel*.35,y:r.y+r.dy*steps*travel,life:Math.max(0,r.life-steps)};}).filter(r=>r.life>0);
}

export function settlePixels(canvas,regions,tick){
  const ctx=canvas.getContext('2d');
  for(const r of regions){
    const remaining=r.life-tick;if(remaining<=0)continue;
    const flood=wetFlood(r.amount),travel=.18+flood*.7,fade=remaining/r.total;
    const modern=r.physics===true,progress=1-remaining/r.total,flow=modern?1-r.viscosity*.45:1,x=r.x+r.dx*tick*travel*.35*flow,y=r.y+r.dy*tick*travel*flow,size=modern?r.size*(1+r.spread*progress*.8):r.size;
    ctx.save();clipRegion(ctx,r.clip);
    if(r.kind==='rgb'&&flood)damage(canvas,x,y,size,'smear',r.amount*fade*(.2+flood*.28),
      (r.seed+tick*557)>>>0,{dx:r.dx*.5,dy:r.dy*(1+flood*1.8)});
    damage(canvas,x,y,size,r.kind,r.amount*fade*(.62+flood*.26)*(modern?1+r.spread*.35:1),
      (r.seed+tick*991)>>>0,{dx:r.dx*(1+flood*.4)+(modern?Math.sin((r.seed%31)+tick)*r.spread*2:0),dy:r.dy*(1+flood*1.8),offset:10+flood*22});
    ctx.restore();
  }
}

export function reactPixels(canvas,regions,op,p,g){
  const elapsed=Math.max(0,p.t-op.started)/WET_INTERVAL,ctx=canvas.getContext('2d');
  for(const r of regions||[]){
    const life=r.life-elapsed;
    if(life<=0||Math.hypot(p.x-r.x,p.y-r.y)>(op.size+r.size)*.5)continue;
    ctx.save();clipRegion(ctx,r.clip);clipRegion(ctx,op.clip);
    damage(canvas,r.x,r.y,r.size,'smear',r.amount*(life/r.total)*.25,r.seed,{dx:clamp(g.dx,-20,20),dy:clamp(g.dy,-20,20)});
    ctx.restore();
  }
}

// Live scheduling is separate from rendering. Only recorded ticks change pixels.
export class WetCanvas{
  constructor(engine,{onTick=()=>{},onDry=()=>{},onStatus=()=>{}}={}){
    this.engine=engine;this.onTick=onTick;this.onDry=onDry;this.onStatus=onStatus;
    this.regions=[];this.owner=null;this.timer=null;this.pausedAt=0;
  }
  get active(){return this.timer!==null;}
  suspend(){if(this.timer!==null)clearInterval(this.timer);this.timer=null;}
  restart(){if(this.owner&&this.regions.length&&!this.timer)this.schedule();}
  pause(){
    if(this.timer!==null)clearInterval(this.timer);
    this.timer=null;this.owner=null;this.pausedAt=performance.now();
    return structuredClone(this.regions);
  }
  dry(){
    const owner=this.owner;this.pause();this.regions=[];this.onStatus(0);if(owner)this.onDry(owner);
  }
  continue(op,regions){
    this.regions=structuredClone(regions).slice(-MAX_WET_REGIONS);
    if(!this.regions.length){this.owner=null;this.onStatus(0);return;}
    this.owner=op;op.settle={regions:structuredClone(this.regions),ticks:0};
    this.onStatus(Math.max(...this.regions.map(r=>r.life))*WET_INTERVAL);
    this.schedule();
  }
  schedule(){
    this.timer=setInterval(()=>{
      if(!this.owner)return;
      const record=this.owner.settle;
      settlePixels(this.engine.canvas,record.regions,record.ticks);
      record.ticks++;this.regions=ageRegions(this.regions,1);
      this.onTick(this.owner);
      this.onStatus(this.regions.length?Math.max(...this.regions.map(r=>r.life))*WET_INTERVAL:0);
      if(!this.regions.length)this.dry();
    },WET_INTERVAL);
  }
  resume(op){
    if(this.pausedAt)this.regions=ageRegions(this.regions,Math.floor((performance.now()-this.pausedAt)/WET_INTERVAL));
    this.regions=[...this.regions,...depositedRegions(op)].slice(-MAX_WET_REGIONS);
    if(!this.regions.length){this.onStatus(0);return;}
    this.continue(op,this.regions);
  }
}
