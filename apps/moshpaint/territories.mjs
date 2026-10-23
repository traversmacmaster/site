// Moshpaint UI/media adapter. Selection and GPU rendering remain in portable packages.
import {BudgetAllocator,frameFromSrgb8} from './packages/processing-runtime/index.mjs';
import {createRangeTerritories,territoryPreset,restoreTerritoryPreset} from './packages/color-territories/index.mjs';
import {createGpuTerritories} from './packages/color-territories/gpu.mjs';
import {createWebGLDevice} from './packages/processing-webgl/index.mjs';
import {territoryProject,defaultTerritory} from './territory-settings.mjs';

const MAX_NATIVE_PIXELS=1920*1080;
export function installTerritories({mount,getState,drawInput,canEdit,onChanged,onCaptureStart,onCaptureEnd,onFill,onPaintMask,onError,showSettings}) {
  let config=territoryProject(),disposed=false,processing=false,frame=0,epoch=0,raf=0,lastAt=0,force=true,lastKey='',lastClocks=new Map(),nextId=2;
  let gpuDevice,gpuService,gpuAttempted=false,gpuError='';
  const allocator=new BudgetAllocator(64*1048576),cpuService=createRangeTerritories({allocator,maxPixels:MAX_NATIVE_PIXELS,maxRegions:8});
  const scratch=document.createElement('canvas'),gpuCanvas=document.createElement('canvas');
  const panel=document.createElement('details');panel.id='colorTerritories';
  panel.innerHTML=`<summary>Color Territories <span>+</span></summary>
<p class="micro">Build reusable color masks, then fill them with source pigment or Moirefield. Save a mask for the source brush when you want to paint inside its shape.</p>
<label>Territory<select id="ctRegion"></select></label><div class="ct-buttons"><button id="ctAdd">Add</button><button id="ctRemove">Remove</button></div>
<div class="ct-pair"><label>Hue start °<input id="ctHueStart" type="number" min="0" max="360"></label><label>Hue end °<input id="ctHueEnd" type="number" min="0" max="360"></label></div><label>Hue tolerance °<input id="ctTolerance" type="number" min="0" max="60"></label>
<div class="ct-pair"><label>Saturation min<input id="ctSatMin" type="number" min="0" max="1" step=".05"></label><label>Saturation max<input id="ctSatMax" type="number" min="0" max="1" step=".05"></label></div><div class="ct-pair"><label>Luminance min<input id="ctLumMin" type="number" min="0" max="1" step=".05"></label><label>Luminance max<input id="ctLumMax" type="number" min="0" max="1" step=".05"></label></div>
<label>Boundary softness<input id="ctSoftness" type="range" min="0" max="1" step=".01"></label><div class="ct-pair"><label>Feather · canvas px<input id="ctFeather" type="number" min="0" max="16"></label><label>Preview smoothing · s<input id="ctSmoothing" type="number" min="0" max="2" step=".05"></label></div><label><input id="ctInvert" type="checkbox"> Invert territory</label>
<details><summary>Preview options</summary><label>Mask from<select id="ctSurface"><option value="canvas">Dry + living canvas</option><option value="dry">Dry canvas only</option></select></label><label>Renderer<select id="ctRenderer"><option value="auto">GPU when available</option><option value="cpu">CPU reference</option></select></label><label>Preview resolution<select id="ctResolution"><option>160</option><option>320</option><option>640</option></select></label><label><input id="ctLive" type="checkbox" checked> Live mask preview</label><button id="ctRefresh">Refresh mask</button></details>
<canvas id="ctPreview" width="160" height="120" aria-label="Color territory mask preview"></canvas><output id="ctStatus" role="status">Open this panel to preview a territory.</output>
<label>Fill selected territory with<select id="ctRoute"><option value="moirefield">Moirefield</option><option value="video">Selected source video / pigment</option><option value="ghost">Ghosts · source pigment</option><option value="taffy">Time Taffy · source pigment</option></select></label>
<div id="ctGhostControls" hidden><div class="ct-pair"><label>Ghost delay · seconds<input id="ctGhostDelay" type="number" min="0" max="2" step=".05"></label><label>Ghost strength<input id="ctGhostStrength" type="number" min="0" max="1" step=".05"></label></div></div><div id="ctTaffyControls" hidden><label>Stretch · seconds<input id="ctTaffyStretch" type="number" min="0" max="2" step=".05"></label><label>Time direction<select id="ctTaffyDirection"><option value="left-to-right">Left to right</option><option value="right-to-left">Right to left</option><option value="top-to-bottom">Top to bottom</option><option value="bottom-to-top">Bottom to top</option></select></label><label>Taffy strength<input id="ctTaffyStrength" type="number" min="0" max="1" step=".05"></label></div>
<p class="micro">The mask stays shared and independent of the fill. Video and Moirefield can remain alive inside the selected color region.</p><button id="ctApply" class="dark">Capture mask &amp; apply</button><div class="ct-buttons"><button id="ctReset">Reset territory</button><button id="ctSave">Save mask preset</button><button id="ctLoad">Load mask preset</button></div><input id="ctPreset" type="file" accept=".json,application/json" hidden>`;
  mount.append(panel);
  const $=id=>panel.querySelector('#'+id),preview=$('ctPreview'),status=$('ctStatus');
  const brushMaskButton=document.createElement('button');brushMaskButton.id='ctBrushMask';brushMaskButton.textContent='Use for brush';brushMaskButton.title='Capture this territory and constrain brush and pencil strokes to it';$('ctApply').before(brushMaskButton);const brushMaskNote=document.createElement('p');brushMaskNote.className='micro';brushMaskNote.textContent='Use the selected territory to limit Brush and Pencil strokes to its white areas. Each stroke keeps its mask for undo and project reopen.';brushMaskButton.after(brushMaskNote);
  const stats={frames:0,backend:null,bytesUsed:0,error:null};
  const regions=()=>config.preset.selections,current=()=>regions().find(s=>s.id===config.selectedId);
  function reset(){cpuService.reset();gpuService?.reset();epoch++;lastKey='';lastClocks.clear();force=true;}
  function sync(){
    $('ctRegion').replaceChildren(...regions().map(s=>{const option=new Option(s.id,s.id);option.selected=s.id===config.selectedId;return option;}));
    const s=current();
    for(const [id,value] of Object.entries({ctHueStart:s.hue[0],ctHueEnd:s.hue[1],ctTolerance:s.tolerance,ctSatMin:s.saturation[0],ctSatMax:s.saturation[1],ctLumMin:s.luminance[0],ctLumMax:s.luminance[1],ctSoftness:s.boundarySoftness,ctFeather:s.feather,ctSmoothing:s.smoothingSeconds}))$(id).value=value;
    $('ctInvert').checked=s.invert;for(const [id,key] of [['ctSurface','surface'],['ctRenderer','renderer'],['ctResolution','resolution'],['ctRoute','route']])$(id).value=config[key];
    $('ctGhostControls').hidden=config.route!=='ghost';$('ctGhostDelay').value=config.ghost.delaySeconds;$('ctGhostStrength').value=config.ghost.ghostStrength;
    $('ctTaffyControls').hidden=config.route!=='taffy';$('ctTaffyStretch').value=config.taffy.stretchSeconds;$('ctTaffyDirection').value=config.taffy.direction;$('ctTaffyStrength').value=config.taffy.taffyStrength;
    $('ctAdd').disabled=regions().length===8;$('ctRemove').disabled=regions().length===1;
  }
  function gpu(){
    if(gpuDevice?.unavailable)throw Error('Color Territories GPU context lost. Select CPU reference or wait for restoration.');
    if(!gpuAttempted){gpuAttempted=true;
      try{const gl=gpuCanvas.getContext('webgl2',{alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true,antialias:false});
        gpuDevice=createWebGLDevice({gl,deviceId:crypto.randomUUID(),byteLimit:64*1048576,maxPixels:MAX_NATIVE_PIXELS});
        gpuService=createGpuTerritories({device:gpuDevice,maxPixels:MAX_NATIVE_PIXELS,maxRegions:8});gpuError='';
      }catch(error){gpuDevice?.dispose();gpuDevice=undefined;gpuError=error.message;}
    }
    return gpuDevice;
  }
  function active(){if(config.renderer==='auto'&&gpu())return {device:gpuDevice,service:gpuService};return {device:null,service:cpuService};}
  gpuCanvas.addEventListener('webglcontextlost',()=>{if(disposed)return;stats.error='GPU context lost. Select CPU reference or wait for restoration.';status.textContent=stats.error;});
  gpuCanvas.addEventListener('webglcontextrestored',()=>{if(disposed)return;gpuService?.dispose();gpuDevice?.dispose();gpuService=undefined;gpuDevice=undefined;gpuAttempted=false;stats.error=null;reset();schedule();});
  function metadata(state,width,height){
    const key=`${state.width}/${state.height}/${state.revision}/${config.surface}`;
    const clocks=new Map(state.clocks??[]);
    if(key!==lastKey||clocks.size!==lastClocks.size||[...clocks].some(([id,t])=>!lastClocks.has(id)||t<lastClocks.get(id)-.05))reset();
    lastKey=key;lastClocks=clocks;
    return {width,height,format:'linear-srgb-premultiplied-rgba',origin:'top-left',sourceId:'moshpaint-canvas',epoch,sequence:frame++,timestampSeconds:performance.now()/1000};
  }
  function captureInput(state,width,height,device){
    scratch.width=width;scratch.height=height;const ctx=scratch.getContext('2d',{willReadFrequently:true});ctx.clearRect(0,0,width,height);drawInput(ctx,width,height,config.surface);
    const meta=metadata(state,width,height);
    return device?device.uploadSrgb(scratch,meta):frameFromSrgb8(allocator,ctx.getImageData(0,0,width,height).data,meta);
  }
  async function renderPreview(){
    if(disposed||processing||!canEdit())return;processing=true;let input,result;
    try{
      const start=performance.now(),state=getState(),scale=Math.min(1,config.resolution/Math.max(state.width,state.height));
      const width=Math.max(1,Math.round(state.width*scale)),height=Math.max(1,Math.round(state.height*scale));
      const {device,service}=active();input=captureInput(state,width,height,device);
      // Feather values are native canvas pixels; previews approximate that width.
      const values=regions().map(s=>({...s,feather:Math.round(s.feather*scale)}));
      result=await service.evaluate(input.value,values,new AbortController().signal);if(disposed)return;
      const mask=result.masks.find(m=>m.value.id===config.selectedId).value;
      if(preview.width!==width||preview.height!==height){preview.width=width;preview.height=height;}
      const ctx=preview.getContext('2d');ctx.clearRect(0,0,width,height);
      if(device)ctx.drawImage(device.present(mask),0,0);
      else{const image=ctx.createImageData(width,height);for(let p=0;p<mask.storage.data.length;p++){const v=Math.round(mask.storage.data[p]*255);image.data[p*4]=image.data[p*4+1]=image.data[p*4+2]=v;image.data[p*4+3]=255;}ctx.putImageData(image,0,0);}
      stats.frames++;stats.backend=device?'webgl2':'cpu';stats.error=null;force=false;
      status.textContent=`${device?'GPU':'CPU'} · ${width} × ${height} preview · ${(performance.now()-start).toFixed(0)} ms${!device&&gpuError?' · GPU unavailable':''}`;
    }catch(error){stats.error=error.message;status.textContent=error.message;force=false;}
    finally{result?.masks.forEach(m=>m.release());input?.release();stats.bytesUsed=allocator.bytesUsed+(gpuDevice?.allocator.bytesUsed??0);processing=false;}
  }
  async function tick(time){raf=0;if(disposed||!panel.open||document.hidden)return;
    if(time-lastAt>=120&&canEdit()){
      const state=getState(),key=`${state.width}/${state.height}/${state.revision}/${config.surface}`;
      if(force||($('ctLive').checked&&(state.animated||key!==lastKey))){lastAt=time;await renderPreview();}
    }schedule();
  }
  function schedule(){if(!raf&&!disposed&&panel.open&&!document.hidden)raf=requestAnimationFrame(tick);}
  for(const [id,key] of [['ctGhostDelay','delaySeconds'],['ctGhostStrength','ghostStrength']])$(id).addEventListener('change',()=>{try{change({...config,ghost:{...config.ghost,[key]:Number($(id).value)}});}catch(error){sync();onError(error);}});
  for(const [id,key] of [['ctTaffyStretch','stretchSeconds'],['ctTaffyStrength','taffyStrength'],['ctTaffyDirection','direction']])$(id).addEventListener('change',()=>{try{change({...config,taffy:{...config.taffy,[key]:key==='direction'?$(id).value:Number($(id).value)}});}catch(error){sync();onError(error);}});
  function change(next){if(processing||!canEdit()){sync();return;}config=territoryProject(next);reset();sync();onChanged();schedule();}
  for(const id of ['ctHueStart','ctHueEnd','ctTolerance','ctSatMin','ctSatMax','ctLumMin','ctLumMax','ctSoftness','ctFeather','ctSmoothing','ctInvert'])$(id).addEventListener('change',()=>{
    try{const value={id:config.selectedId,hue:[+$('ctHueStart').value,+$('ctHueEnd').value],tolerance:+$('ctTolerance').value,saturation:[+$('ctSatMin').value,+$('ctSatMax').value],luminance:[+$('ctLumMin').value,+$('ctLumMax').value],boundarySoftness:+$('ctSoftness').value,feather:+$('ctFeather').value,smoothingSeconds:+$('ctSmoothing').value,invert:$('ctInvert').checked};
      change({...config,preset:territoryPreset(regions().map(s=>s.id===config.selectedId?value:s))});
    }catch(error){sync();onError(error);}
  });
  for(const [id,key] of [['ctRegion','selectedId'],['ctSurface','surface'],['ctRenderer','renderer'],['ctResolution','resolution'],['ctRoute','route']])$(id).addEventListener('change',()=>{try{change({...config,[key]:key==='resolution'?+$(id).value:$(id).value});}catch(error){sync();onError(error);}});
  $('ctAdd').onclick=()=>{if(regions().length>=8)return;while(regions().some(s=>s.id===`territory-${nextId}`))nextId++;const s={...defaultTerritory(),id:`territory-${nextId++}`};change({...config,preset:territoryPreset([...regions(),s]),selectedId:s.id});};
  $('ctRemove').onclick=()=>{if(regions().length<=1)return;const values=regions().filter(s=>s.id!==config.selectedId);change({...config,preset:territoryPreset(values),selectedId:values[0].id});};
  $('ctReset').onclick=()=>change({...config,preset:territoryPreset(regions().map(s=>s.id===config.selectedId?{...defaultTerritory(),id:s.id}:s))});
  $('ctRefresh').onclick=()=>{force=true;schedule();};$('ctLive').onchange=()=>{force=true;schedule();};
  panel.addEventListener('toggle',()=>{if(panel.open){force=true;schedule();}else{cancelAnimationFrame(raf);raf=0;if(!processing)reset();}});
  async function captureSelectedMask(route){
    if(processing||!canEdit())return;processing=true;let locked=false,input,result,service;
    try{
      const state=getState();if(state.width*state.height>MAX_NATIVE_PIXELS)throw Error('Native territory capture supports up to 2,073,600 canvas pixels. Resize the canvas before applying a fill.');
      await onCaptureStart(route);locked=true;reset();
      const {device,service:activeService}=active();service=activeService;input=captureInput(state,state.width,state.height,device);
      result=await service.evaluate(input.value,[{...current(),smoothingSeconds:0}],new AbortController().signal);
      const data=device?device.read(result.masks[0].value):result.masks[0].value.storage.data;
      let left=state.width,top=state.height,right=-1,bottom=-1,count=0;
      for(let p=0;p<data.length;p++)if(Math.round(data[p]*255)>0){const x=p%state.width,y=Math.floor(p/state.width);left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);count++;}
      if(!count)throw Error('No canvas pixels match this territory. Adjust its hue, saturation or luminance.');
      const rect={x:left,y:top,w:right-left+1,h:bottom-top+1},canvas=document.createElement('canvas');canvas.width=rect.w;canvas.height=rect.h;
      const ctx=canvas.getContext('2d'),image=ctx.createImageData(rect.w,rect.h);
      for(let y=0;y<rect.h;y++)for(let x=0;x<rect.w;x++){const i=(y*rect.w+x)*4;image.data[i]=image.data[i+1]=image.data[i+2]=255;image.data[i+3]=Math.round(data[(y+rect.y)*state.width+x+rect.x]*255);}
      ctx.putImageData(image,0,0);const region={rect,mask:canvas.toDataURL('image/png'),pixels:count},frameContext={ghost:{...config.ghost},taffy:{...config.taffy}};
      result?.masks.forEach(mask=>mask.release());result=undefined;
      if(route!=='paint'){await onFill(region,route,frameContext);status.textContent=`${count.toLocaleString()} pixels captured · fill added to history`;return null;}
      return region;
    }catch(error){status.textContent=error.message;onError(error);}
    finally{result?.masks.forEach(m=>m.release());input?.release();if(locked)onCaptureEnd();processing=false;force=true;schedule();}
  }
  $('ctApply').onclick=async()=>{await captureSelectedMask(config.route);};
  brushMaskButton.onclick=async()=>{
    if(processing||!canEdit())return;
    if(brushMaskButton.dataset.active==='true'){try{await onPaintMask?.(null);delete brushMaskButton.dataset.active;brushMaskButton.textContent='Use for brush';status.textContent='Territory brush mask cleared.';}catch(error){status.textContent=error.message;onError(error);}return;}
    const region=await captureSelectedMask('paint');if(!region)return;
    try{await onPaintMask?.(region);brushMaskButton.dataset.active='true';brushMaskButton.textContent='Clear brush mask';status.textContent=`${region.pixels.toLocaleString()} pixels captured · added to Source Wells`;}catch(error){status.textContent=error.message;onError(error);}
  };
  $('ctSave').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(config.preset,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='color-territories.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  $('ctLoad').onclick=()=>$('ctPreset').click();$('ctPreset').onchange=async()=>{try{const file=$('ctPreset').files[0];if(!file)return;if(file.size>65536)throw Error('Territory preset exceeds 64 KiB.');const values=restoreTerritoryPreset(JSON.parse(await file.text()));if(!values.length||values.length>8)throw Error('Choose a preset with 1–8 territories.');change({...config,preset:territoryPreset(values),selectedId:values[0].id});}catch(error){onError(error);}finally{$('ctPreset').value='';}};
  const onVisibility=()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else{if(!processing)reset();schedule();}};document.addEventListener('visibilitychange',onVisibility);
  const favorite=document.createElement('button');favorite.id='favoriteTerritories';favorite.className='favorite-action';favorite.innerHTML='<span class="glyph">◌</span>Territories';favorite.title='Color Territories: reusable color masks for moving fills';favorite.onclick=()=>{showSettings();panel.open=true;panel.scrollIntoView({block:'start'});};document.getElementById('favoriteTools').append(favorite);
  sync();
  return {
    serialize:()=>territoryProject(config),
    restore(value){if(processing)throw Error('Wait for territory processing before opening a project.');config=territoryProject(value);reset();sync();schedule();},
    get stats(){return {...stats,bytesUsed:allocator.bytesUsed+(gpuDevice?.allocator.bytesUsed??0)};},get processing(){return processing;},
    dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);raf=0;document.removeEventListener('visibilitychange',onVisibility);cpuService.dispose();allocator.dispose();gpuService?.dispose();gpuDevice?.dispose();scratch.width=scratch.height=gpuCanvas.width=gpuCanvas.height=preview.width=preview.height=1;},
  };
}



