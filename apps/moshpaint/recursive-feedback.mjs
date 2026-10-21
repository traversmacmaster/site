// Host adapter renders a captured territory snapshot through the portable engine.
import {createRecursiveFeedback} from './packages/recursive-feedback/index.mjs';
import {BudgetAllocator,frameToSrgb8} from './packages/processing-runtime/index.mjs';
import {surface} from './processors.mjs';

export async function renderRecursiveRegion(region,{frame},parameters){
  const engine=createRecursiveFeedback(),allocator=new BudgetAllocator(128*1048576);let first,second;
  try{
    await engine.initialize({backend:'cpu',allocator,services:{}});
    const evaluation={input:frame,timeSeconds:frame.timestampSeconds,deltaSeconds:0,seed:0,parameters,signal:new AbortController().signal};
    first=await engine.process(evaluation);
    // A still image has no prior frame. Prime one feedback step using the same
    // captured image so all three modes create a visible, deterministic result.
    second=await engine.process({...evaluation,input:{...frame,sequence:frame.sequence+1,timestampSeconds:frame.timestampSeconds+1/60},timeSeconds:frame.timestampSeconds+1/60});
    const {x,y,w,h}=region.rect,full=surface(frame.width,frame.height),ctx=full.getContext('2d'),pixels=ctx.createImageData(frame.width,frame.height);
    frameToSrgb8(second.value,pixels.data);ctx.putImageData(pixels,0,0);const cropped=surface(w,h);cropped.getContext('2d').drawImage(full,x,y,w,h,0,0,w,h);full.width=full.height=1;return cropped.toDataURL('image/png');
  }finally{second?.release();first?.release();engine.dispose();allocator.dispose();}
}
