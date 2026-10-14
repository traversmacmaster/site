export const MOTION_FPS=Object.freeze([12,15,24000/1001,24,25,30000/1001,30,50,60000/1001,60]);
export const MOTION_DEFAULTS=Object.freeze({fps:30,speed:1,repeats:1,hold:.75,gap:.12,matte:'#000000',maxEdge:1080});
export function motionSettings(input={}){
  const s={...MOTION_DEFAULTS,...input};
  if(!MOTION_FPS.includes(s.fps)||![.5,1,2,4,8].includes(s.speed)||!Number.isInteger(s.repeats)||s.repeats<1||s.repeats>8||!Number.isFinite(s.hold)||s.hold<0||s.hold>10||!Number.isFinite(s.gap)||s.gap<0||s.gap>2||!/^#[0-9a-f]{6}$/i.test(s.matte)||![720,1080,1920,4096].includes(s.maxEdge))throw Error('Invalid motion export settings.');
  return s;
}
// Preserve timing within strokes, but replace unrecorded between-gesture idle time with gap.
export function* motionEvents(operations,settings){
  const s=motionSettings(settings);let time=1/s.fps;
  function* operation(op){
    if(op.kind==='selection'&&op.action==='time'){for(const child of op.strokes)yield* operation(child);return;}
    if(op.kind==='living-fill'&&op.tool==='livingbrush'){
      for(let i=0;i<op.points.length;i++){if(i)time+=Math.max(0,op.points[i].t-op.points[i-1].t)/1000/s.speed;yield {time,kind:'living-dab',op,index:i};}return;
    }
    if(op.kind!=='stroke'){yield {time,kind:'operation',op};return;}
    for(let i=0;i<op.points.length;i++){if(i)time+=Math.max(0,op.points[i].t-op.points[i-1].t)/1000/s.speed;yield {time,kind:'dab',op,index:i};}
    yield {time,kind:'finish',op};
    for(let tick=0;tick<(op.settle?.ticks||0);tick++){time+=.09/s.speed;yield {time,kind:'wet',op,tick};}
  }
  for(let i=0;i<operations.length;i++){if(i)time+=s.gap/s.speed;yield* operation(operations[i]);}
}
export function motionPlan(operations,config,settings={}){
  const s=motionSettings(settings);let end=1/s.fps;for(const event of motionEvents(operations,s))end=event.time;
  const cycleFrames=Math.ceil((end+s.hold)*s.fps-1e-8)+1,frames=cycleFrames*s.repeats;
  const scale=Math.min(1,s.maxEdge/Math.max(config.width,config.height)),width=Math.max(1,Math.round(config.width*scale)),height=Math.max(1,Math.round(config.height*scale));
  if(frames>5400||frames/s.fps>180||width*height*frames>8e9)throw Error('Motion exceeds the 180-second / 5,400-frame rendering budget. Select fewer gestures, increase speed, or reduce FPS, repeats or output size.');
  return {...s,width,height,cycleFrames,frames,duration:frames/s.fps};
}
