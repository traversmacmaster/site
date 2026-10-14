export function installCamera({canOpen,onCapture}){
 const button=document.createElement('button');button.id='cameraPigment';button.className='add-source';button.innerHTML='◉<span>Camera pigment</span>';button.title='Record a camera clip to paint with';document.querySelector('#addSource').after(button);
 const dialog=document.createElement('dialog');dialog.id='cameraDialog';dialog.innerHTML='<div class="dialog-kicker">MAKE YOUR OWN MOVING PAINT</div><h2>Camera pigment</h2><video id="cameraPreview" autoplay muted playsinline></video><p id="cameraStatus" role="status">Opening your camera…</p><p class="micro">Record up to 30 seconds, then paint with your clip. Camera clips stay in your project. No sound is recorded.</p><div class="dialog-actions"><button id="cameraCancel">Cancel</button><button id="cameraSwitch">Switch camera</button><button id="cameraRecord" class="dark" disabled>Record clip</button><button id="cameraUse" class="dark" hidden>Stop & use pigment</button></div>';document.body.append(dialog);
 const $=id=>dialog.querySelector('#'+id),preview=$('cameraPreview'),status=$('cameraStatus');let stream=null,recorder=null,chunks=[],facing='user',session=0,started=0,timer=null,limitTimer=null;
 function release(){clearInterval(timer);clearTimeout(limitTimer);timer=limitTimer=null;if(recorder&&recorder.state!=='inactive')recorder.stop();recorder=null;for(const track of stream?.getTracks()||[])track.stop();stream=null;preview.srcObject=null;chunks=[];}
 function reset(){session++;release();}
 function message(error){if(error?.name==='NotAllowedError')return 'Camera access was declined. Allow camera access in your browser settings, then try again.';if(error?.name==='NotFoundError')return 'No camera was found. Connect a camera or import a video instead.';if(error?.name==='NotReadableError')return 'The camera is busy. Close other apps using it, then try again.';return error?.message||'Could not open your camera.';}
 async function openCamera(){
  const token=++session;release();$('cameraRecord').disabled=true;$('cameraSwitch').disabled=true;$('cameraUse').hidden=true;$('cameraRecord').hidden=false;status.textContent='Opening your camera…';
  try{
   if(!navigator.mediaDevices?.getUserMedia)throw Error('Camera access needs HTTPS or localhost. Open the secure version of MoshPaint, or import a video.');
   if(typeof MediaRecorder==='undefined')throw Error('Camera recording is unavailable in this browser. Import a video instead.');
   let next;try{next=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:facing},width:{ideal:1280},height:{ideal:720}}});}catch(e){if(!['OverconstrainedError','NotFoundError'].includes(e.name))throw e;next=await navigator.mediaDevices.getUserMedia({audio:false,video:true});}
   if(token!==session||!dialog.open){next.getTracks().forEach(track=>track.stop());return;}
   stream=next;preview.srcObject=stream;preview.classList.toggle('selfie',facing==='user');await preview.play();if(token!==session)return;
   status.textContent='Ready. Record a short movement to turn it into pigment.';$('cameraRecord').disabled=false;$('cameraSwitch').disabled=false;
   for(const track of stream.getVideoTracks())track.onended=()=>{if(dialog.open){reset();status.textContent='Camera disconnected. Close this window and try again.';$('cameraRecord').disabled=true;$('cameraSwitch').disabled=true;$('cameraUse').hidden=true;}};
  }catch(e){if(token===session){release();status.textContent=message(e);}}
 }
 async function useClip(){
  if(!recorder||recorder.state==='inactive')return;const current=recorder,token=session,duration=Math.max(.1,(performance.now()-started)/1000);clearInterval(timer);clearTimeout(limitTimer);$('cameraUse').disabled=true;status.textContent='Preparing your camera pigment…';
  try{await new Promise((resolve,reject)=>{current.addEventListener('stop',resolve,{once:true});current.addEventListener('error',e=>reject(e.error),{once:true});current.stop();});if(token!==session)return;
   const blob=new Blob(chunks,{type:current.mimeType});if(!blob.size)throw Error('The camera clip was empty. Try recording for a little longer.');const extension=current.mimeType.includes('mp4')?'mp4':'webm',file=new File([blob],`Camera pigment ${new Date().toLocaleTimeString().replaceAll(':','-')}.${extension}`,{type:blob.type});
   release();await onCapture(file,duration);dialog.close();
  }catch(e){if(token===session){release();status.textContent=message(e);$('cameraRecord').disabled=true;$('cameraUse').hidden=true;}}finally{$('cameraUse').disabled=false;}
 }
 button.onclick=()=>{if(!canOpen())return;facing='user';dialog.showModal();openCamera();};
 $('cameraCancel').onclick=()=>dialog.close();dialog.addEventListener('close',reset);dialog.addEventListener('cancel',reset);
 $('cameraSwitch').onclick=()=>{facing=facing==='user'?'environment':'user';openCamera();};
 $('cameraRecord').onclick=()=>{
  if(!stream||recorder)return;const type=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'].find(value=>MediaRecorder.isTypeSupported(value));
  if(!type){status.textContent='This browser cannot record camera video. Import a video instead.';return;}
  try{chunks=[];recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:4000000});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onerror=e=>{reset();status.textContent=message(e.error);$('cameraRecord').disabled=true;$('cameraUse').hidden=true;};started=performance.now();recorder.start(250);$('cameraRecord').hidden=true;$('cameraUse').hidden=false;$('cameraSwitch').disabled=true;status.textContent='Recording · 0.0 / 30 seconds';timer=setInterval(()=>{status.textContent=`Recording · ${((performance.now()-started)/1000).toFixed(1)} / 30 seconds`;},100);limitTimer=setTimeout(useClip,30000);}catch(e){release();status.textContent=message(e);$('cameraRecord').disabled=true;$('cameraUse').hidden=true;}
 };
 $('cameraUse').onclick=useClip;
 window.addEventListener('pagehide',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden&&dialog.open)dialog.close();});
 return {close:()=>dialog.close()};
}
