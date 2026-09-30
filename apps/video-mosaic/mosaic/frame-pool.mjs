import {sourceDuration} from '../src/sources.mjs';
import {surface} from '../src/processors.mjs';
import {LIMITS,averageRGBA,frameStatistics} from './model.mjs';

export async function seekFrame(video,time,signal){
 if(signal?.aborted)throw new DOMException('Scan cancelled','AbortError');video.pause();const target=Math.round(time*1e6)/1e6;
 if(!video.seeking&&video.readyState>=2&&video.currentTime===target)return;
 await new Promise((resolve,reject)=>{const cleanup=()=>{clearTimeout(timer);video.removeEventListener('seeked',done);video.removeEventListener('loadeddata',done);video.removeEventListener('error',fail);signal?.removeEventListener('abort',abort);};
  const done=()=>{if(video.seeking||video.readyState<2)return;cleanup();resolve();},fail=()=>{cleanup();reject(Error('Video seek failed or timed out.'));},abort=()=>{cleanup();reject(new DOMException('Scan cancelled','AbortError'));},timer=setTimeout(fail,8000);
  video.addEventListener('seeked',done);video.addEventListener('loadeddata',done);video.addEventListener('error',fail);signal?.addEventListener('abort',abort,{once:true});video.currentTime=target;if(!video.seeking&&video.readyState>=2)queueMicrotask(done);
 });
}
export class FramePool{
 constructor(){this.clips=new Map();this.scanCount=0;this.frameCount=0;this.analysis=[];this.scratch=surface(LIMITS.edge,LIMITS.edge);this.context=this.scratch.getContext('2d',{willReadFrequently:true});}
 check(sources){const seconds=sources.reduce((n,s)=>n+sourceDuration(s),0),frames=sources.reduce((n,s)=>n+Math.ceil(sourceDuration(s)*LIMITS.fps),0);if(sources.length>LIMITS.videos||seconds>LIMITS.seconds||frames*LIMITS.edge**2*4>LIMITS.bytes)throw Error('Prototype pool limit: 8 videos, 240 seconds total and 64 MiB decoded frames. Remove a video or use shorter clips.');if(sources.some(s=>!sourceDuration(s)))throw Error('A video has no finite duration.');return frames;}
 async scan(sources,{signal,onProgress=()=>{}}={}){
  this.check(sources);const wanted=new Set(sources.map(s=>s.id));for(const id of this.clips.keys())if(!wanted.has(id))this.remove(id);
  const pending=sources.filter(s=>this.clips.get(s.id)?.data!==s.data),total=pending.reduce((n,s)=>n+Math.ceil(sourceDuration(s)*LIMITS.fps),0);let completed=0;
  for(const source of pending){const duration=sourceDuration(source),count=Math.ceil(duration*LIMITS.fps),clip={data:source.data,duration,fps:LIMITS.fps,frames:[],statistics:[],samples:[]};
   try{for(let n=0;n<count;n++){if(signal?.aborted)throw new DOMException('Scan cancelled','AbortError');const timestamp=n/LIMITS.fps;await seekFrame(source.el,timestamp,signal);const w=source.el.videoWidth,h=source.el.videoHeight,size=Math.min(w,h);this.context.drawImage(source.el,(w-size)/2,(h-size)/2,size,size,0,0,LIMITS.edge,LIMITS.edge);clip.frames.push(await createImageBitmap(this.scratch));
    const pixels=this.context.getImageData(0,0,LIMITS.edge,LIMITS.edge).data;clip.statistics.push(frameStatistics(pixels));
    if(n%LIMITS.fps===0||n===count-1)clip.samples.push({sourceId:source.id,timestamp,...averageRGBA(pixels)});
    completed++;if(n%4===0||n===count-1)onProgress({completed,total,source:source.name});if(n%8===0)await new Promise(r=>setTimeout(r,0));
   }}catch(error){for(const frame of clip.frames)frame.close();throw error;}
   this.remove(source.id);this.clips.set(source.id,clip);this.refresh();this.scanCount++;
  }
  this.refresh();onProgress({completed:total,total,source:'Ready'});return this.analysis;
 }
 refresh(){this.analysis=[...this.clips.values()].flatMap(c=>c.samples);this.frameCount=[...this.clips.values()].reduce((n,c)=>n+c.frames.length,0);}
 frame(sourceId,time){const clip=this.clips.get(sourceId);return clip?.frames[Math.min(clip.frames.length-1,Math.max(0,Math.floor(time*clip.fps+1e-8)))];}
 remove(id){const clip=this.clips.get(id);for(const frame of clip?.frames||[])frame.close();this.clips.delete(id);this.refresh();}
 dispose(){for(const id of this.clips.keys())this.remove(id);this.scratch.width=this.scratch.height=1;}
}
