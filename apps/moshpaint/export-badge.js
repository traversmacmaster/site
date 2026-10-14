// Free export standard. Draw only on export surfaces, never project artwork.
let fontPromise;
export function badgeReady() {
  return fontPromise ||= (async () => {
    const face = new FontFace('TM Export Mono', `url(${new URL('./IBM-Plex-Mono-Medium.ttf', import.meta.url)})`, {weight:'500'});
    await face.load(); document.fonts.add(face);
  })();
}
export function badgeLayout(ctx, width, height, machine) {
  const text = `MADE WITH ${machine.toUpperCase()} · TRAVERSMACMASTER.COM`;
  let fontSize = height * .0275 / 1.8;
  const available = width * .95;
  ctx.font = `500 ${fontSize}px "TM Export Mono"`;
  fontSize *= Math.min(1, available / (ctx.measureText(text).width + fontSize * 1.4));
  ctx.font = `500 ${fontSize}px "TM Export Mono"`;
  return {text,fontSize,x:width*.025,y:height-height*.035-fontSize*1.8,width:ctx.measureText(text).width+fontSize*1.4,height:fontSize*1.8};
}
export function drawBadge(ctx, width, height, machine) {
  ctx.save(); ctx.setTransform(1,0,0,1,0,0);
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;ctx.filter='none';
  const box=badgeLayout(ctx,width,height,machine);
  ctx.fillStyle='rgba(0,0,0,0.85)';ctx.fillRect(box.x,box.y,box.width,box.height);
  ctx.fillStyle='#fff';ctx.textAlign='left';ctx.textBaseline='middle';
  ctx.fillText(box.text,box.x+box.fontSize*.7,box.y+box.height/2);
  ctx.restore();return box;
}
export async function brandedCanvas(source,machine) {
  await badgeReady();
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);drawBadge(ctx,canvas.width,canvas.height,machine);return canvas;
}
export async function badgePng(width,height,machine) {
  await badgeReady();const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  drawBadge(canvas.getContext('2d'),width,height,machine);
  return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Export badge could not be rendered.')),'image/png'));
}
export async function brandedSvg(svg,width,height,machine) {
  const png=await badgePng(width,height,machine);
  const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(png);});
  return svg.replace('</svg>',`<image x="0" y="0" width="${width}" height="${height}" href="${data}"/></svg>`);
}
export async function badgeStream(source,fps,machine) {
  await badgeReady();
  let video, inputStream;
  if(typeof source.getTracks==='function') {
    inputStream=source;video=document.createElement('video');video.muted=true;video.playsInline=true;video.srcObject=source;
    try {await video.play();}catch(error){source.getTracks().forEach(t=>t.stop());throw error;}
    source=video;
  }
  const canvas=document.createElement('canvas');canvas.width=source.videoWidth||source.width;canvas.height=source.videoHeight||source.height;
  const ctx=canvas.getContext('2d',{alpha:false});let active=true,raf,previous=-Infinity,stream;
  const draw=now=>{if(!active)return;if(now-previous>=1000/fps){previous=now;ctx.drawImage(source,0,0,canvas.width,canvas.height);drawBadge(ctx,canvas.width,canvas.height,machine);stream?.getVideoTracks()[0]?.requestFrame?.();}raf=requestAnimationFrame(draw);};
  draw(performance.now());stream=canvas.captureStream(fps);
  const cleanup=()=>{if(!active)return;active=false;cancelAnimationFrame(raf);inputStream?.getTracks().forEach(t=>t.stop());if(video){video.pause();video.srcObject=null;}};
  stream.getTracks().forEach(track=>{const stop=track.stop.bind(track);track.stop=()=>{cleanup();stop();};});
  inputStream?.getVideoTracks()[0]?.addEventListener('ended',()=>{stream.getVideoTracks()[0]?.dispatchEvent(new Event('ended'));stream.getTracks().forEach(t=>t.stop());},{once:true});
  return stream;
}
