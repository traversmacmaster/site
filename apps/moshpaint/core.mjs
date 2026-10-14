import {validateSolidify} from './color-solidify.mjs';
import {validateProcedural} from './fills/procedural.mjs';
import {preflightDataURL} from './media-limits.mjs';
import {motionSettings} from './motion-plan.mjs';
export const VERSION=3;
export function migrateProject(project){
  if(project?.app==='MoshPaint'&&[1,2].includes(project.version))return {...project,version:VERSION,migratedFrom:project.version};
  return project;
}
export function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function validateProject(p){
  if(!p||p.app!=='MoshPaint')throw Error('This is not a MoshPaint project.');
  if(p.version!==VERSION)throw Error(`Project version ${p.version} is not supported by this version of MoshPaint.`);
  if(!p.canvas||!Number.isInteger(p.canvas.width)||!Number.isInteger(p.canvas.height)||p.canvas.width<32||p.canvas.height<32||p.canvas.width>4096||p.canvas.height>4096||p.canvas.width*p.canvas.height>16777216)throw Error('Canvas dimensions must be between 32 and 4096 pixels.');
  if(!Array.isArray(p.sources)||p.sources.length>32||!Array.isArray(p.operations)||p.operations.length>10000)throw Error('Project contains too many sources or operations.');
  if(p.canvas.background!==undefined&&!/^(transparent|#[0-9a-f]{6})$/i.test(p.canvas.background))throw Error('Invalid canvas background.');
  for(const s of p.sources){if(!s||typeof s.id!=='string'||typeof s.name!=='string'||!['image','video'].includes(s.type)||typeof s.data!=='string'||s.data.length>112*1024*1024||!/^data:(image|video)\//.test(s.data)||!s.sample||!Number.isFinite(s.sample.x)||!Number.isFinite(s.sample.y)||(s.playbackRate!==undefined&&![.25,.5,.75,1,1.5,2].includes(s.playbackRate))||(s.rangeIn!==undefined&&(!Number.isFinite(s.rangeIn)||s.rangeIn<0||s.rangeIn>86400))||(s.rangeOut!==undefined&&(!Number.isFinite(s.rangeOut)||s.rangeOut<=0||s.rangeOut>86400))||(s.rangeIn!==undefined&&s.rangeOut!==undefined&&s.rangeOut<=s.rangeIn))throw Error('Invalid embedded source.');}
  for(const s of p.sources)if(s.solidify)validateSolidify(s.solidify);
  for(const s of p.sources)if(s.procedural){if(s.type!=='image'||!s.data.startsWith('data:image/png;base64,'))throw Error('Invalid procedural pigment source.');validateProcedural(s.procedural);}
  let samples=0;
  const finite=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
  if(p.formScene!==undefined){const f=p.formScene;if(!f||!['flat','cube','sphere','cylinder','fold','relief','scene'].includes(f.shape)||!finite(f.yaw,-1000000,1000000)||!finite(f.pitch,-1.4,1.4)||!finite(f.zoom,.4,2.4)||!finite(f.amount,0,1)||!Array.isArray(f.heights)||![0,1024].includes(f.heights.length)||f.heights.some(v=>!finite(v,0,1))||!Array.isArray(f.faces)||f.faces.length!==8||f.faces.some(face=>!face||(face.source!==null&&!p.sources.some(s=>s.id===face.source))||(face.ink!==null&&(typeof face.ink!=='string'||face.ink.length>8*1024*1024||!face.ink.startsWith('data:image/png;base64,')))))throw Error('Invalid canvas form scene.');for(const face of f.faces)if(face.ink){const d=preflightDataURL(face.ink);if(!d||d.width!==512||d.height!==512)throw Error('Invalid form surface dimensions.');}}
  const validPath=path=>path===undefined||(Array.isArray(path)&&path.length>=3&&path.length<=12001&&path.every(pt=>pt&&finite(pt.x,-100000,100000)&&finite(pt.y,-100000,100000)));
  const validRect=r=>r&&['x','y','w','h'].every(k=>Number.isFinite(r[k]))&&r.w>0&&r.h>0&&r.w<=4096&&r.h<=4096&&Math.abs(r.x)<=100000&&Math.abs(r.y)<=100000&&validPath(r.path);
  const tools=new Set(['image','stamp','ribbon','stretch','scatter','mosh','time','clean','tape','shredder','chroma','edge','timesmear','smear','sort','knife','compression','melt','repeat','damage-mosh','magnet','eraser','pencil','brush','line','rectangle','ellipse','fill','livingbrush','livingfill','livingwand','videoselect','livingellipse','livingrectangle','livingtube','livinginflate','livingplane','text']);
  const treatments=new Set(['clean','mosh','sort','block','rgb','jpeg','echo','melt']);
  const validAdvanced=a=>a&&typeof a==='object'&&!Array.isArray(a)&&Object.entries(a).every(([k,v])=>({block:finite(v,2,64),threshold:finite(v,0,1),offset:finite(v,1,80),timeOffset:finite(v,-60,60),feedback:finite(v,0,1)})[k]===true);
  const validWet=regions=>Array.isArray(regions)&&regions.length<=20&&regions.every(r=>r&&finite(r.x,-100000,100000)&&finite(r.y,-100000,100000)&&finite(r.size,1,180)&&finite(r.dx,-5,5)&&finite(r.dy,-5,5)&&Number.isInteger(r.life)&&r.life>=1&&r.life<=40&&Number.isInteger(r.total)&&r.total>=r.life&&r.total<=40&&finite(r.amount,0,1)&&Number.isInteger(r.seed)&&r.seed>=0&&r.seed<=4294967295&&['rgb','smear'].includes(r.kind)&&(!r.clip||validRect(r.clip))&&(r.physics===undefined||r.physics===true)&&(r.spread===undefined||finite(r.spread,0,1))&&(r.viscosity===undefined||finite(r.viscosity,0,1))&&(r.edgeHold===undefined||finite(r.edgeHold,0,1)));
  const validWetPhysics=value=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).every(key=>['mode','angle','force','viscosity','spread','dryRate','edgeHold'].includes(key))&&['legacy','down','up','left','right','angle','radial-in','radial-out','gesture'].includes(value.mode)&&finite(value.angle,-180,180)&&finite(value.force,0,1)&&finite(value.viscosity,0,1)&&finite(value.spread,0,1)&&finite(value.dryRate,0,1)&&finite(value.edgeHold,0,1);
  const sourceIds=new Set(p.sources.map(s=>s.id));if(sourceIds.size!==p.sources.length)throw Error('Duplicate source identifiers.');
  if(p.activeSource!=null&&!sourceIds.has(p.activeSource))throw Error('The active source is missing.');
  if(p.motion!==undefined)motionSettings(p.motion);
  if(p.cursor!==undefined&&(!Number.isInteger(p.cursor)||p.cursor<0||p.cursor>p.operations.length))throw Error('Invalid history cursor.');
  if(p.state){
    if(p.state.drySolidify!==undefined)validateSolidify(p.state.drySolidify);
    const allowed=new Set(['tool','treatment','shape','size','amount','videoSelectTolerance','drySolidify','color','wet','wetPhysics','advanced','seed']);
    if(typeof p.state!=='object'||Object.keys(p.state).some(k=>!allowed.has(k))||!new Set([...tools,'select','lasso','zoom','eyedropper']).has(p.state.tool)||!treatments.has(p.state.treatment)||(p.state.shape!==undefined&&!['round','block','strip','comb','shard'].includes(p.state.shape))||!finite(p.state.size,2,512)||!finite(p.state.amount,0,1)||(p.state.videoSelectTolerance!==undefined&&!finite(p.state.videoSelectTolerance,0,.3))||!finite(p.state.wet,0,1)||(p.state.wetPhysics!==undefined&&!validWetPhysics(p.state.wetPhysics))||!/^#[0-9a-f]{6}$/i.test(p.state.color)||!validAdvanced(p.state.advanced)||!Number.isInteger(p.state.seed)||p.state.seed<0||p.state.seed>4294967295)throw Error('Invalid saved tool state.');
  }
  function validateOperation(op,nested=false){
    if(!op||!['stroke','wreck','selection','place','living-fill','living-control','wet-control'].includes(op.kind)||(nested&&op.kind!=='stroke'))throw Error('Unknown history operation.');
    if(!Number.isInteger(op.seed)||op.seed<0||op.seed>4294967295)throw Error('Invalid stroke or mutation seed.');
    if(op.clip&&!validRect(op.clip))throw Error('Invalid clipping region.');
    if(op.kind==='place'&&(!validRect(op.rect)||typeof op.image!=='string'||op.image.length>96*1024*1024||!op.image.startsWith('data:image/png;base64,')))throw Error('Invalid placed image.');
    if(op.kind==='living-fill'){
      if(typeof op.id!=='string'||!op.id||(!op.fill&&!op.image&&!sourceIds.has(op.source))||!validRect(op.rect)||typeof op.mask!=='string'||op.mask.length>96*1024*1024||!op.mask.startsWith('data:image/png;base64,')||op.mapping!=='cover'||!Array.isArray(op.replaces)||op.replaces.length>64||op.replaces.some(id=>typeof id!=='string')||(op.range!==undefined&&(!op.range||!finite(op.range.in,0,86400)||!finite(op.range.out,.01,86400)||op.range.out<=op.range.in)))throw Error('Invalid living fill.');
      if(op.image!==undefined){if(typeof op.image!=='string'||op.image.length>96*1024*1024||!op.image.startsWith('data:image/png;base64,'))throw Error('Invalid placed form image.');const dimensions=preflightDataURL(op.image);if(!dimensions||dimensions.width>4096||dimensions.height>4096)throw Error('Placed form image exceeds canvas limits.');}
      if(op.fill!==undefined)validateProcedural(op.fill);
      if(op.tool!==undefined&&op.tool!=='livingbrush'||op.tool==='livingbrush'&&(!finite(op.size,2,512)||!['round','block','strip','comb','shard'].includes(op.shape)||!Array.isArray(op.points)||!op.points.length||op.points.length>12001||op.points.some(pt=>!pt||!finite(pt.x,-100000,100000)||!finite(pt.y,-100000,100000)||!finite(pt.t,0,Number.MAX_SAFE_INTEGER)||(pt.pressure!==undefined&&!finite(pt.pressure,0,1)))))throw Error('Invalid living brush.');
      if(op.depthStyle!==undefined){const d=op.depthStyle;if(!d||!['tube','inflate','plane'].includes(d.mode)||!finite(d.depth,0,1)||!finite(d.light,0,360)||!finite(d.tilt,0,1)||(d.mode==='tube'&&op.tool!=='livingbrush'))throw Error('Invalid living depth settings.');}
      if(op.wetShape!==undefined){const w=op.wetShape;if(!w||typeof w!=='object'||!finite(w.amount,0,1)||!validWetPhysics(w.physics)||!Number.isInteger(w.seed)||w.seed<0||w.seed>4294967295||!Number.isInteger(w.ticks)||w.ticks<0||!Number.isInteger(w.total)||w.total<4||w.total>40||w.ticks>w.total||typeof w.dry!=='boolean')throw Error('Invalid living wet physics.');}
    }
    if(op.kind==='living-control'){
      if(!['freeze','unfreeze','bake'].includes(op.action)||!Array.isArray(op.targets)||!op.targets.length||op.targets.length>64||op.targets.some(id=>typeof id!=='string')||!Array.isArray(op.items)||op.items.length>64||op.items.some(item=>!item||typeof item.id!=='string'||!validRect(item.rect)||typeof item.image!=='string'||item.image.length>96*1024*1024||!item.image.startsWith('data:image/png;base64,')))throw Error('Invalid living pigment control.');
    }
    if(op.kind==='wet-control'){
      if(!['rewet','dry','freeze'].includes(op.action)||!validRect(op.rect)||!validWet(op.regions)||op.wetPhysics!==undefined&&!validWetPhysics(op.wetPhysics))throw Error('Invalid wetness control.');
    }
    if(op.kind==='selection'){
      if(!validRect(op.rect)||!['move','scale','stretch','echo','sort','mosh','rgb','block','melt','time'].includes(op.action))throw Error('Invalid selection operation.');
      if(op.action==='time'){if(!Array.isArray(op.strokes)||op.strokes.length>24)throw Error('Invalid temporal selection.');op.strokes.forEach(o=>validateOperation(o,true));}
      for(const key of ['dx','dy'])if(op[key]!==undefined&&!finite(op[key],-100000,100000))throw Error('Invalid selection translation.');
      for(const key of ['sx','sy'])if(op[key]!==undefined&&(!finite(op[key],.0001,4096)||op[key]*op.rect[key==='sx'?'w':'h']>4096))throw Error('Selection scale exceeds canvas limits.');
      if(!['move','scale','stretch','time'].includes(op.action)&&!finite(op.amount,0,1))throw Error('Invalid selection treatment amount.');
      if(op.resample!==undefined&&!['nearest','smooth'].includes(op.resample))throw Error('Invalid selection resampling mode.');
    }
    if(op.kind==='stroke'){
      if(!tools.has(op.tool)||!Number.isFinite(op.size)||op.size<1||op.size>768||!Number.isFinite(op.amount)||op.amount<0||op.amount>1||!/^#[0-9a-f]{6}$/i.test(op.color))throw Error('Invalid stroke parameters.');
      if(op.sourceRate!==undefined&&![.25,.5,.75,1,1.5,2].includes(op.sourceRate))throw Error('Invalid captured video playback rate.');
      if(!Array.isArray(op.points)||!op.points.length||op.points.length>12001||op.points.some(pt=>!Number.isFinite(pt.x)||!Number.isFinite(pt.y)||!Number.isFinite(pt.t)||Math.abs(pt.x)>100000||Math.abs(pt.y)>100000))throw Error('Invalid stroke data.');
      if(!Array.isArray(op.frames)||op.frames.length>12000||op.frames.some(f=>typeof f!=='string'||f.length>1048576||!f.startsWith('data:image/png;base64,')))throw Error('Invalid captured frame data.');
      if(['image','stamp','ribbon','stretch','scatter','mosh','time','clean','tape','shredder','chroma','edge','timesmear'].includes(op.tool)&&(!op.frames.length||op.points.some(pt=>!Number.isInteger(pt.frame)||pt.frame<0||pt.frame>=op.frames.length)))throw Error('Captured source frame is missing.');
      if(!treatments.has(op.treatment)||(op.shape!==undefined&&!['round','block','strip','comb','shard'].includes(op.shape))||!finite(op.wet,0,1)||(op.wetPhysics!==undefined&&!validWetPhysics(op.wetPhysics))||!validAdvanced(op.advanced)||!finite(op.started,0,Number.MAX_SAFE_INTEGER))throw Error('Invalid stroke treatment.');
      if(op.points.some(pt=>(pt.pressure!==undefined&&!finite(pt.pressure,0,1))||(pt.curvature!==undefined&&!finite(pt.curvature,-Math.PI,Math.PI))))throw Error('Invalid stylus data.');
      if(op.text!==undefined&&(typeof op.text!=='string'||op.text.length>500))throw Error('Invalid text operation.');
      if(op.reactive!==undefined&&!validWet(op.reactive))throw Error('Invalid wet reactivity record.');
      samples+=op.points.length;
    }
    if(op.kind==='wreck'&&op.amount!==undefined&&!finite(op.amount,0,1))throw Error('Invalid Wreck movement amount.');
    if(op.wetEffect!==undefined&&(op.wetEffect!==true||!['wreck','selection'].includes(op.kind)||!finite(op.wet,0,1)))throw Error('Invalid whole-canvas wet effect.');
    if(op.settle&&(!validWet(op.settle.regions)||!Number.isInteger(op.settle.ticks)||op.settle.ticks<0||op.settle.ticks>40))throw Error('Invalid wet drying record.');
  }
  p.operations.forEach(op=>validateOperation(op));
  if(samples>1000000)throw Error('Project stroke data is too large.');
  return p;
}
export class History{
  constructor(){this.operations=[];this.cursor=0;this.activeCache=[];}
  invalidate(){this.activeCache=null;}
  add(op){this.operations.splice(this.cursor);this.operations.push(op);this.cursor=this.operations.length;this.invalidate();}
  undo(){if(this.cursor){this.cursor--;this.invalidate();}return this.cursor;}
  redo(){if(this.cursor<this.operations.length){this.cursor++;this.invalidate();}return this.cursor;}
  get active(){return this.activeCache??=this.operations.slice(0,this.cursor);}
  load(ops,cursor=ops.length){this.operations=ops;this.cursor=clamp(cursor,0,ops.length);this.invalidate();}
}
export function gesture(a,b){const dx=b.x-a.x,dy=b.y-a.y,dt=Math.max(1,b.t-a.t);return{dx,dy,distance:Math.hypot(dx,dy),velocity:Math.hypot(dx,dy)/dt,angle:Math.atan2(dy,dx)};}
