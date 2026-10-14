import {motionEvents,motionPlan} from './motion-plan.mjs';
import {settlePixels} from './wet.mjs';
// Encoding speed and wall-clock scheduling never determine artwork timestamps.
export async function renderFrames(engine,operations,settings,onFrame,cancelled=()=>false){
  const plan=motionPlan(operations,engine.config,settings);let delivered=0,work=0;
  const check=()=>{if(cancelled())throw Error('Export cancelled.');};
  for(let repeat=0;repeat<plan.repeats;repeat++){
    engine.clear();const visible=[],livingIndexes=new Map();let visibleState=[];const events=motionEvents(operations,plan);let next=events.next();
    for(let frame=0;frame<plan.cycleFrames;frame++){
      check();const time=frame/plan.fps;
      while(!next.done&&next.value.time<=time+1e-8){
        check();const e=next.value;
        if(e.kind==='dab')await engine.dab(e.op,e.index);
        else if(e.kind==='living-dab'){let at=livingIndexes.get(e.op);if(at===undefined){at=visible.length;livingIndexes.set(e.op,at);visible.push(e.op);}visible[at]=e.index===e.op.points.length-1?e.op:{...e.op,progress:e.index+1};visibleState=visible.slice();}
        else if(e.kind==='finish'){engine.finish(e.op);visible.push(e.op);visibleState=visible.slice();}
        else if(e.kind==='wet')settlePixels(engine.canvas,e.op.settle.regions,e.tick);
        else{await engine.apply(e.op);visible.push(e.op);visibleState=visible.slice();}
        next=events.next();if(++work%8===0)await new Promise(r=>setTimeout(r,0));
      }
      check();await onFrame(engine.canvas,delivered++,plan,{operations:visibleState});
    }
  }
  return plan;
}
