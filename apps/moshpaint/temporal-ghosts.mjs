// MoshPaint host-side temporal sampling for living source pigment.
// Kept independent of the standalone Temporal Sculptor engine.
import {renderProcedural} from './fills/procedural.mjs';
import {solidifyFrame} from './color-solidify.mjs';
import {surface} from './processors.mjs';
export const MAX_GHOST_PIXELS=1048576,MAX_GHOST_REGIONS=8;
const linear=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;};
const srgb=v=>Math.round(255*(v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055));
export class GhostPlates{
  constructor(){this.items=new Map();}
  cleanup(item){if(item.video){item.video.pause();item.video.removeAttribute('src');item.video.load();}for(const canvas of [item.canvas,item.sampleCanvas])if(canvas)canvas.width=canvas.height=1;}
  retire(id){const item=this.items.get(id);if(!item)return;item.retired=true;item.abort.abort();if(!item.busy)this.cleanup(item);this.items.delete(id);}
  retain(ids){for(const id of this.items.keys())if(!ids.has(id))this.retire(id);}
  dispose(){this.retain(new Set());}
  async process(op,source,current,{time,media}){
    const {w,h}=op.rect;if(w*h>MAX_GHOST_PIXELS)throw Error('Temporal pigment region exceeds 1,048,576 pixels. Select a smaller territory.');
    let item=this.items.get(op.id);if(item&&item.source!==source){this.retire(op.id);item=undefined;}
    if(!item){if(this.items.size>=MAX_GHOST_REGIONS)throw Error('At most eight combined Ghosts / Time Taffy regions are supported.');item={canvas:surface(w,h),sampleCanvas:surface(w,h),abort:new AbortController(),sequence:0,source,opRange:op.range};this.items.set(op.id,item);}
    if(item.canvas.width!==w||item.canvas.height!==h){item.canvas.width=item.sampleCanvas.width=w;item.canvas.height=item.sampleCanvas.height=h;}
    item.context={time,mediaTime:media?.currentTime??0};const signal=item.abort.signal,now=time??performance.now()/1000;
    const currentPixels=this.pixels(current,item.canvas,w,h),out=new Uint8ClampedArray(currentPixels),ctx=item.canvas.getContext('2d');item.busy=true;
    try{
      if(op.taffy){const stretch=Math.max(0,Number(op.taffy.stretchSeconds)||0),strength=Math.max(0,Math.min(1,Number(op.taffy.taffyStrength)||0)),horizontal=['left-to-right','right-to-left'].includes(op.taffy.direction),reverse=['right-to-left','bottom-to-top'].includes(op.taffy.direction)?1:0;
        for(let band=1;band<8&&stretch>0&&strength>0;band++){const delayed=await this.sample(source,item,now-stretch*band/7,signal);if(!delayed)continue;const pixels=this.pixels(delayed,item.sampleCanvas,w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let index=Math.floor((horizontal?x/w:y/h)*8);if(reverse)index=7-index;if(index!==band)continue;const i=(y*w+x)*4;for(let c=0;c<3;c++)out[i+c]=srgb(linear(currentPixels[i+c])+strength*(linear(pixels[i+c])-linear(currentPixels[i+c])));}}
      }else{const delay=Math.max(0,Number(op.ghost?.delaySeconds)||0),strength=Math.max(0,Math.min(1,Number(op.ghost?.ghostStrength)||0)),delayed=delay?await this.sample(source,item,now-delay,signal):current;if(delayed){const pixels=this.pixels(delayed,item.sampleCanvas,w,h);for(let i=0;i<out.length;i+=4)for(let c=0;c<3;c++)out[i+c]=srgb(linear(currentPixels[i+c])+strength*(linear(pixels[i+c])-linear(currentPixels[i+c])));}}
      signal.throwIfAborted();const image=ctx.createImageData(w,h);image.data.set(out);ctx.putImageData(image,0,0);item.sequence++;return item.canvas;
    }finally{item.busy=false;if(item.retired)this.cleanup(item);}
  }
  pixels(media,canvas,w,h){const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.clearRect(0,0,w,h);const sw=media.videoWidth||media.naturalWidth||media.width,sh=media.videoHeight||media.naturalHeight||media.height;if(!sw||!sh)return new Uint8ClampedArray(w*h*4);const scale=Math.max(w/sw,h/sh);ctx.drawImage(media,(w-sw*scale)/2,(h-sh*scale)/2,sw*scale,sh*scale);return ctx.getImageData(0,0,w,h).data;}
  async sample(source,item,target,signal){
    signal.throwIfAborted();let delayed=source.el;
    if(source.procedural)delayed=renderProcedural(source.procedural,item.canvas.width,item.canvas.height,target);
    else if(source.type==='video'){
      if(!item.video){const video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='auto';item.video=video;await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Ghost video decoding timed out.')),15000),done=()=>{clearTimeout(timer);video.removeEventListener('loadeddata',ready);video.removeEventListener('error',failed);signal.removeEventListener('abort',failed);},ready=()=>{done();resolve();},failed=()=>{done();reject(Error('Ghost video decoding cancelled or failed.'));};video.addEventListener('loadeddata',ready);video.addEventListener('error',failed);signal.addEventListener('abort',failed,{once:true});video.src=source.data;});}
      const video=item.video,duration=Number(source.el?.duration)||Number(source.duration)||0,start=Number(item.opRange?.in??0),end=Math.min(duration||Infinity,Number(item.opRange?.out)||duration||Infinity),rate=Number(source.playbackRate)||1,delta=Math.max(0,(item.context.time??performance.now()/1000)-target),desired=item.context.mediaTime-delta*rate;let targetMedia=Math.max(start,desired);
      if(end>start)targetMedia=start+((desired-start)%(end-start)+(end-start))%(end-start);targetMedia=Math.max(start,targetMedia);
      if(Math.abs(video.currentTime-targetMedia)>.002)await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{video.removeEventListener('seeked',done);reject(Error('Ghost video seek timed out.'));},4000);function done(){clearTimeout(timer);resolve();}video.addEventListener('seeked',done,{once:true});video.currentTime=targetMedia;});
      delayed=source.solidify?.enabled?solidifyFrame(source,video,{detection:true,frameTime:targetMedia}):video;
    }
    signal.throwIfAborted();return delayed;
  }
}
