import {solidifyFrame,validateSolidify} from './color-solidify.mjs';
import {renderProcedural,validateProcedural} from './fills/procedural.mjs';
import {checkDimensions,preflightDataURL} from './media-limits.mjs';
import {surface} from './processors.mjs';
import {rng} from './core.mjs';
const sourceSignals=new WeakMap();
export function videoFrameSerial(media){if(!media?.requestVideoFrameCallback)return null;let signal=sourceSignals.get(media);if(!signal){signal={serial:0,token:null};sourceSignals.set(media,signal);const next=()=>{if(sourceSignals.get(media)!==signal)return;signal.serial++;signal.token=media.requestVideoFrameCallback(next);};signal.token=media.requestVideoFrameCallback(next);}return signal.serial;}
export const VIDEO_PLAYBACK_RATES=Object.freeze([.25,.5,.75,1,1.5,2]);
export const videoPlaybackRate=value=>VIDEO_PLAYBACK_RATES.includes(Number(value))?Number(value):1;
export async function playMedia(media){
  try{await media.play();return true;}
  catch(error){if(error?.name==='AbortError')return false;throw error;}
}
const read=file=>new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=()=>reject(Error('Could not read this media file.'));fr.readAsDataURL(file);});
export function pngDataUrl(canvas){
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>{
    if(!blob){reject(Error('Could not encode a captured source frame.'));return;}
    const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Could not read a captured source frame.'));reader.readAsDataURL(blob);
  },'image/png'));
}
export function sourceDuration(source){
  const el=source?.el,candidates=[el?.duration,source?.durationHint];
  try{if(el?.seekable?.length)candidates.push(el.seekable.end(el.seekable.length-1));}catch{}
  return candidates.find(value=>Number.isFinite(value)&&value>0)||0;
}
const proceduralFrameTimes=new WeakMap();
export function refreshProceduralSource(source,time=performance.now()/1000){if(!source?.procedural)return;time=Math.floor(time*30)/30;if(proceduralFrameTimes.get(source)===time)return;proceduralFrameTimes.set(source,time);const frame=renderProcedural(source.procedural,512,512,time);source.el.getContext('2d').drawImage(frame,0,0,512,512);}
export class Sources{
  constructor(){this.items=[];this.active=null;this.frames=new Map();this.captureCanvas=null;this.captureContext=null;}
  async addFile(file,replaceId=null){if(this.items.length>=32&&!this.items.some(s=>s.id===replaceId))throw Error('A project can contain up to 32 source wells.');if(file.size>80*1024*1024)throw Error('Each source must be smaller than 80 MB.');if(!/^(image|video)\//.test(file.type))throw Error('Choose an image, GIF, or browser-compatible video.');return this.restore({id:crypto.randomUUID(),name:file.name,type:file.type.startsWith('video')?'video':'image',data:await read(file),originalPath:await window.desktop?.protectFile(file),sample:{x:.5,y:.5},time:0},replaceId);}
  async restore(record,replaceId=null){
    if(this.items.length>=32&&!this.items.some(s=>s.id===replaceId))throw Error('A project can contain up to 32 source wells.');
    if(!record || !/^(data:image\/|data:video\/)/.test(record.data))throw Error('Project source data is missing or invalid.');
    const used=this.items.filter(s=>s.id!==replaceId).reduce((sum,s)=>sum+(s.el.naturalWidth||s.el.videoWidth)*(s.el.naturalHeight||s.el.videoHeight),0);
    preflightDataURL(record.data,used);
    if(record.procedural){validateProcedural(record.procedural);checkDimensions(512,512,used);const el=surface(512,512);el.naturalWidth=512;el.naturalHeight=512;el.play=async()=>true;el.pause=()=>{};el.paused=false;const item={...record,type:'image',el};refreshProceduralSource(item,0);this.items.push(item);this.active=item.id;return item;}
    if(record.solidify)validateSolidify(record.solidify);
    const el=document.createElement(record.type==='video'?'video':'img');
    if(record.type==='video'){record={...record,playbackRate:videoPlaybackRate(record.playbackRate)};el.muted=true;el.playsInline=true;el.loop=true;el.preload='auto';el.playbackRate=record.playbackRate;}
    try{await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(`Could not decode ${record.name}. Try PNG, JPG, GIF, WebM, or H.264 MP4.`)),15000);el.addEventListener(record.type==='video'?'loadeddata':'load',()=>{clearTimeout(timer);resolve();},{once:true});el.addEventListener('error',()=>{clearTimeout(timer);reject(Error(`Unsupported or damaged media: ${record.name}`));},{once:true});el.src=record.data;});
    checkDimensions(el.naturalWidth||el.videoWidth,el.naturalHeight||el.videoHeight,used);
    if(record.originalPath)await window.desktop?.protectPath(record.originalPath);
    const item={...record,el};this.items.push(item);this.active=item.id;return item;}catch(e){releaseElement(el);throw e;}
  }
  async addProcedural(fill){validateProcedural(fill);const c=surface(512,512);c.getContext('2d').drawImage(renderProcedural(fill,512,512,0),0,0);return this.restore({id:crypto.randomUUID(),name:'Moirefield pigment',type:'image',procedural:structuredClone(fill),data:c.toDataURL(),sample:{x:.5,y:.5},time:0});}
  async addMaskBrush(mask,rect){if(this.items.length>=32)throw Error('A project can contain up to 32 source wells.');return this.restore({id:crypto.randomUUID(),name:'Territory Mask Brush',type:'image',data:mask,sample:{x:.5,y:.5},time:0,maskBrush:true,maskRect:structuredClone(rect)});}
  generate(type){
    const c=surface(512,512),ctx=c.getContext('2d'),r=rng(781);
    if(type==='noise'){const im=ctx.createImageData(512,512);for(let i=0;i<im.data.length;i+=4){im.data[i]=r()*255;im.data[i+1]=r()*255;im.data[i+2]=r()*255;im.data[i+3]=255;}ctx.putImageData(im,0,0);}
    else{const g=ctx.createLinearGradient(0,512,512,0);g.addColorStop(0,'#3525dc');g.addColorStop(.35,'#ff477a');g.addColorStop(.7,'#ffbc59');g.addColorStop(1,'#daff67');ctx.fillStyle=g;ctx.fillRect(0,0,512,512);}
    return this.restore({id:crypto.randomUUID(),name:type==='noise'?'Digital dust':'Soft spectrum',type:'image',data:c.toDataURL(),sample:{x:.5,y:.5},time:0});
  }
  get current(){return this.items.find(s=>s.id===this.active);}
  serialize(){return this.items.map(({el,...data})=>{const clean={...data,time:Number.isFinite(el.currentTime)&&el.currentTime>=0?el.currentTime:0};for(const key of ['rangeIn','rangeOut','durationHint'])if(!Number.isFinite(clean[key]))delete clean[key];if(clean.rangeIn!==undefined&&clean.rangeOut!==undefined&&clean.rangeOut<=clean.rangeIn)delete clean.rangeOut;return clean;});}
  dispose(){for(const s of this.items){releaseElement(s.el);}this.items=[];this.frames.clear();if(this.captureCanvas)this.captureCanvas.width=this.captureCanvas.height=1;this.captureCanvas=this.captureContext=null;}
  async frame(data){const dims=preflightDataURL(data);if(dims&&(dims.width>512||dims.height>512))throw Error('Captured brush frame exceeds the 512-pixel limit.');if(this.frames.has(data))return this.frames.get(data);const img=new Image();img.src=data;await img.decode();if(img.naturalWidth>512||img.naturalHeight>512)throw Error('Captured brush frame exceeds the 512-pixel limit.');if(this.frames.size>64)this.frames.delete(this.frames.keys().next().value);this.frames.set(data,img);return img;}
  sample(source,sample=source.sample){
    refreshProceduralSource(source);const el=solidifyFrame(source),w=el.videoWidth||el.naturalWidth||el.width,h=el.videoHeight||el.naturalHeight||el.height,s=Math.min(w,h)*.7,c=surface(256,256);
    c.getContext('2d').drawImage(el,Math.max(0,Math.min(w-s,sample.x*w-s/2)),Math.max(0,Math.min(h-s,sample.y*h-s/2)),s,s,0,0,256,256);return c;
  }
  async capture(source,sample=source.sample){
    refreshProceduralSource(source);const el=solidifyFrame(source),w=el.videoWidth||el.naturalWidth||el.width,h=el.videoHeight||el.naturalHeight||el.height,s=Math.min(w,h)*.7;
    if(!this.captureCanvas){this.captureCanvas=surface(256,256);this.captureContext=this.captureCanvas.getContext('2d');}
    const ctx=this.captureContext;ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,256,256);ctx.drawImage(el,Math.max(0,Math.min(w-s,sample.x*w-s/2)),Math.max(0,Math.min(h-s,sample.y*h-s/2)),s,s,0,0,256,256);
    return pngDataUrl(this.captureCanvas);
  }
}

export function releaseElement(el){const signal=sourceSignals.get(el);if(signal)el.cancelVideoFrameCallback?.(signal.token);sourceSignals.delete(el);el.pause?.();el.removeAttribute('src');el.load?.();}
