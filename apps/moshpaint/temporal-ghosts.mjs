// Moshpaint decoding/Canvas adapter; temporal blending stays in the portable engine.
import {createTemporalSculptor} from './packages/temporal-sculptor/index.mjs';
import {BudgetAllocator,frameFromSrgb8,frameToSrgb8} from './packages/processing-runtime/index.mjs';
import {renderProcedural} from './fills/procedural.mjs';
import {solidifyFrame} from './color-solidify.mjs';
import {surface} from './processors.mjs';
export const MAX_GHOST_PIXELS=1048576,MAX_GHOST_REGIONS=8;
export class GhostPlates{
  constructor(){this.items=new Map();this.allocator=new BudgetAllocator(64*1048576);}
  cleanup(item){item.engine.dispose();if(item.video){item.video.pause();item.video.removeAttribute('src');item.video.load();}item.canvas.width=item.canvas.height=1;}
  retire(id){const item=this.items.get(id);if(!item)return;item.retired=true;item.abort.abort();if(!item.busy)this.cleanup(item);this.items.delete(id);}
  retain(ids){for(const id of this.items.keys())if(!ids.has(id))this.retire(id);}
  dispose(){this.retain(new Set());this.allocator.dispose();}
  async process(op,source,current,{time,media}){
    const {w,h}=op.rect;if(w*h>MAX_GHOST_PIXELS)throw Error('Temporal pigment region exceeds 1,048,576 pixels. Select a smaller territory.');
    let item=this.items.get(op.id);if(item&&item.source!==source){this.retire(op.id);item=undefined;}
    if(!item){
      if(this.items.size>=MAX_GHOST_REGIONS)throw Error('At most eight combined Ghosts / Time Taffy regions are supported.');
      item={engine:createTemporalSculptor(),canvas:surface(w,h),abort:new AbortController(),sequence:0,source};
      const sample=async(input,target,signal)=>{
        signal.throwIfAborted();const context=item.context;let delayed=source.el;
        if(source.procedural)delayed=renderProcedural(source.procedural,w,h,target);
        else if(source.type==='video'){
          if(!item.video){
            const video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='auto';item.video=video;
            await new Promise((resolve,reject)=>{const done=()=>{clearTimeout(timer);video.removeEventListener('loadeddata',loaded);video.removeEventListener('error',failed);signal.removeEventListener('abort',failed);},loaded=()=>{done();resolve();},failed=()=>{done();reject(Error('Ghost video decoding cancelled or failed.'));},timer=setTimeout(failed,15000);video.addEventListener('loadeddata',loaded);video.addEventListener('error',failed);signal.addEventListener('abort',failed,{once:true});video.src=source.data;});
          }
          const video=item.video,start=op.range?.in??0,rate=source.playbackRate||1,targetMedia=Math.max(start,(context.mediaTime??start)-(input.timestampSeconds-target)*rate);
          if(Math.abs(video.currentTime-targetMedia)>.002)await new Promise((resolve,reject)=>{const done=()=>{clearTimeout(timer);video.removeEventListener('seeked',seeked);video.removeEventListener('error',failed);signal.removeEventListener('abort',failed);},seeked=()=>{done();resolve();},failed=()=>{done();reject(Error('Ghost video seek cancelled or failed.'));},timer=setTimeout(failed,4000);video.addEventListener('seeked',seeked);video.addEventListener('error',failed);signal.addEventListener('abort',failed,{once:true});video.currentTime=targetMedia;});
          delayed=source.solidify?.enabled?solidifyFrame(source,video,{detection:true,frameTime:targetMedia}):video;
        }
        signal.throwIfAborted();return this.frame(item,delayed,{...input,timestampSeconds:target});
      };
      this.items.set(op.id,item);try{await item.engine.initialize({backend:'cpu',allocator:this.allocator,services:{'temporal-samples':{version:1,sample}}});item.abort.signal.throwIfAborted();}catch(error){this.retire(op.id);throw error;}
    }
    if(item.canvas.width!==w||item.canvas.height!==h){item.canvas.width=w;item.canvas.height=h;item.engine.reset();}
    item.context={time,mediaTime:media.currentTime};const now=time??performance.now()/1000,metadata={width:w,height:h,format:'linear-srgb-premultiplied-rgba',origin:'top-left',sourceId:source.id,epoch:0,sequence:item.sequence++,timestampSeconds:now};
    const input=this.frame(item,current,metadata);let output;item.busy=true;
    try{
      output=await item.engine.process({input:input.value,masks:[],parameters:op.taffy?{mode:'time-taffy',...op.taffy}:{mode:'ghosts',...op.ghost},timeSeconds:now,deltaSeconds:0,seed:op.seed,discontinuity:'none',signal:item.abort.signal});
      const ctx=item.canvas.getContext('2d'),pixels=ctx.createImageData(w,h);frameToSrgb8(output.value,pixels.data);ctx.putImageData(pixels,0,0);return item.canvas;
    }finally{input.release();output?.release();item.busy=false;if(item.retired)this.cleanup(item);}
  }
  frame(item,media,metadata){
    const canvas=item.canvas,ctx=canvas.getContext('2d',{willReadFrequently:true}),w=metadata.width,h=metadata.height,sw=media.videoWidth||media.naturalWidth||media.width,sh=media.videoHeight||media.naturalHeight||media.height,scale=Math.max(w/sw,h/sh);
    ctx.clearRect(0,0,w,h);ctx.drawImage(media,(w-sw*scale)/2,(h-sh*scale)/2,sw*scale,sh*scale);
    return frameFromSrgb8(this.allocator,ctx.getImageData(0,0,w,h).data,metadata);
  }
}
