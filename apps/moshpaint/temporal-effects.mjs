// MoshPaint adapter: the portable temporal engine renders the effect while the host owns the canvas and mask.
import {createTemporalSculptor} from './packages/temporal-sculptor/index.mjs';
import {BudgetAllocator,frameToSrgb8} from './packages/processing-runtime/index.mjs';
import {surface} from './processors.mjs';

export async function renderTemporalRegion(region,{frame},parameters){
  const engine=createTemporalSculptor(),allocator=new BudgetAllocator(128*1048576);let output;
  try{
    await engine.initialize({backend:'cpu',allocator,services:{}});
    if(parameters.mode==='fossil-bloom')engine.command('capture',null,frame.timestampSeconds);
    output=await engine.process({input:frame,masks:[],parameters,timeSeconds:frame.timestampSeconds,deltaSeconds:0,seed:0,discontinuity:'source',signal:new AbortController().signal});
    if(parameters.mode==='fossil-bloom'){
      output.release();output=await engine.process({input:{...frame,sequence:frame.sequence+1,timestampSeconds:frame.timestampSeconds+1},masks:[],parameters,timeSeconds:frame.timestampSeconds+1,deltaSeconds:1,seed:0,discontinuity:'none',signal:new AbortController().signal});
    }
    const{x,y,w,h}=region.rect,full=surface(frame.width,frame.height),ctx=full.getContext('2d'),pixels=ctx.createImageData(frame.width,frame.height);frameToSrgb8(output.value,pixels.data);ctx.putImageData(pixels,0,0);const cropped=surface(w,h);cropped.getContext('2d').drawImage(full,x,y,w,h,0,0,w,h);full.width=full.height=1;return cropped.toDataURL('image/png');
  }finally{output?.release();engine.dispose();allocator.dispose();}
}
