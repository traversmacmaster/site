// Host adapter: persist an engine-produced fossil through Moshpaint's existing plates.
import {createTemporalSculptor} from './packages/temporal-sculptor/index.mjs';
import {frameToSrgb8} from './packages/processing-runtime/index.mjs';
export async function captureTimeFossil(region,{frame,device,allocator}){
  const engine=createTemporalSculptor();let output;
  try{
    await engine.initialize({backend:device?'webgl2':'cpu',deviceId:device?.deviceId,allocator,services:device?{'webgl-device':device}:{}});
    engine.command('capture',null,frame.timestampSeconds);
    output=await engine.process({input:frame,masks:[],parameters:{mode:'time-fossils',holdSeconds:0,decaySeconds:0},timeSeconds:frame.timestampSeconds,deltaSeconds:0,seed:0,discontinuity:'none',signal:new AbortController().signal});
    const plate=document.createElement('canvas');plate.width=region.rect.w;plate.height=region.rect.h;const ctx=plate.getContext('2d');
    if(device)ctx.drawImage(device.present(output.value),region.rect.x,region.rect.y,region.rect.w,region.rect.h,0,0,region.rect.w,region.rect.h);
    else{
      const full=document.createElement('canvas');full.width=frame.width;full.height=frame.height;const fc=full.getContext('2d'),pixels=fc.createImageData(frame.width,frame.height);frameToSrgb8(output.value,pixels.data);fc.putImageData(pixels,0,0);
      ctx.drawImage(full,region.rect.x,region.rect.y,region.rect.w,region.rect.h,0,0,region.rect.w,region.rect.h);full.width=full.height=1;
    }
    const mask=new Image();mask.src=region.mask;await mask.decode();ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0,plate.width,plate.height);
    return plate.toDataURL('image/png');
  }finally{output?.release();engine.dispose();}
}
