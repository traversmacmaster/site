// Moshpaint adapter: normalize/capture stays in the host; processing stays in the portable engine.
import {createFrequencyWeaver} from './packages/frequency-weaver/index.mjs';
import {BudgetAllocator,frameToSrgb8} from './packages/processing-runtime/index.mjs';
import {surface} from './processors.mjs';

export async function renderFrequencyRegion(region,{frame},parameters){
  const engine=createFrequencyWeaver(),engineAllocator=new BudgetAllocator(128*1048576);let output;
  try{
    await engine.initialize({backend:'cpu',allocator:engineAllocator,services:{}});
    output=await engine.process({input:frame,masks:[],parameters,timeSeconds:frame.timestampSeconds,deltaSeconds:0,seed:0,discontinuity:'source',signal:new AbortController().signal});
    const {x,y,w,h}=region.rect,full=surface(frame.width,frame.height),fullContext=full.getContext('2d'),pixels=fullContext.createImageData(frame.width,frame.height);
    frameToSrgb8(output.value,pixels.data);fullContext.putImageData(pixels,0,0);
    const cropped=surface(w,h);cropped.getContext('2d').drawImage(full,x,y,w,h,0,0,w,h);full.width=full.height=1;
    return cropped.toDataURL('image/png');
  }finally{output?.release();engine.dispose();engineAllocator.dispose();}
}
