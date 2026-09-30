// MoshPaint's captureStream/MediaRecorder pattern, without desktop-only FFmpeg
// normalization. Captures the existing art canvas, never an alternate renderer.
import {finiteWebm} from './webm-duration.mjs';
export function recordingMime(format='webm',supported=type=>globalThis.MediaRecorder?.isTypeSupported(type)){
 const candidates=format==='mp4'?['video/mp4','video/mp4;codecs=avc1.42E034']:format==='webm'?['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm']:[];
 const mime=candidates.find(supported);if(!mime)throw Error(`${format.toUpperCase()} recording is unavailable in this browser. Choose another format or use current Edge/Chrome.`);return mime;
}
export class LiveCanvasRecorder{
 constructor(){this.recorder=null;this.chunks=[];this.bytes=0;this.started=0;}
 start(canvas,{format='webm',onStop=()=>{},onError=()=>{}}={}){
  if(this.recorder)throw Error('A recording is already running.');
  if(typeof MediaRecorder==='undefined'||!canvas.captureStream)throw Error('Live recording needs a current Edge or Chrome browser.');
  const mime=recordingMime(format);
  const stream=canvas.captureStream(30);this.track=stream.getVideoTracks()[0];let recorder;try{recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:12_000_000});}catch(error){stream.getTracks().forEach(t=>t.stop());throw error;}
  this.chunks=[];this.bytes=0;this.started=performance.now();this.recorder=recorder;
  recorder.ondataavailable=e=>{if(e.data.size){this.chunks.push(e.data);this.bytes+=e.data.size;if(this.bytes>256*1024*1024)this.stop();}};
  recorder.onerror=e=>{onError(e.error||Error('Recording failed.'));this.stop();};
  recorder.onstart=()=>{this.track?.requestFrame?.();canvas.getContext('2d').drawImage(canvas,0,0);};
  recorder.onstop=async()=>{clearTimeout(this.timer);stream.getTracks().forEach(t=>t.stop());const seconds=(performance.now()-this.started)/1000;let blob=new Blob(this.chunks,{type:recorder.mimeType});this.chunks=[];if(format==='webm')try{blob=await finiteWebm(blob,seconds);}catch(error){onError(Error('Saved raw WebM; duration metadata could not be finalized: '+error.message));}this.recorder=null;this.track=null;onStop(blob,{seconds,bytes:blob.size,format,mime:recorder.mimeType});};
  try{recorder.start(250);this.timer=setTimeout(()=>this.stop(),180000);}catch(error){stream.getTracks().forEach(t=>t.stop());this.recorder=null;throw error;}
 }
 stop(){if(this.recorder?.state==='recording')this.recorder.stop();}
 requestFrame(){this.track?.requestFrame?.();}
 get active(){return Boolean(this.recorder);}
}
