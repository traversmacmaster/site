import {BudgetAllocator,frameFromSrgb8,frameToSrgb8} from './packages/processing-runtime/index.mjs';
import {createTemporalSculptor} from './packages/temporal-sculptor/index.mjs';
import {createFrequencyWeaver} from './packages/frequency-weaver/index.mjs';
import {createRecursiveFeedback} from './packages/recursive-feedback/index.mjs';
import {createChromaticPhysics} from './packages/chromatic-physics/index.mjs';
import {createMotionEcology} from './packages/motion-ecology/index.mjs';
import {surface} from './processors.mjs';

export const BRUSH_PROCESSORS=Object.freeze({
  'temporal-sculptor':{name:'Temporal Sculptor',create:createTemporalSculptor,modes:['chrono-shatter','fossil-bloom','datamosh-fossilization','temporal-molting'],defaultMode:'chrono-shatter'},
  'frequency-weaver':{name:'Frequency Weaver',create:createFrequencyWeaver,modes:['spectral-separation','moire-displacement','contour-loom','ripple-interference','crosshatch-scanlines','radial-lens-waves','halftone-phase-drift','chromatic-slit-scan','lissajous-interference','moire-singularity','spectral-exorcism'],defaultMode:'moire-displacement'},
  'recursive-feedback':{name:'Recursive Feedback',create:createRecursiveFeedback,modes:['feedback-architecture','recursive-portals','fractured-reality','fractal-collapse','kaleidoscope-tunnel','tesseract-recursion','recursive-black-ice'],defaultMode:'feedback-architecture'},
  'chromatic-physics':{name:'Chromatic Physics',create:createChromaticPhysics,modes:['gravity-sorting','pigment-infection','chromatic-liquefaction','pigment-supernova','gravity-color-split','chromatic-tectonics','pigment-vortexes'],defaultMode:'chromatic-liquefaction'},
  'motion-ecology':{name:'Motion Ecology',create:createMotionEcology,modes:['particle-rotoscope','motion-parasites','edge-swarm','parasite-bloom','edge-weather','luminance-parasitoids'],defaultMode:'edge-swarm'},
});
export const DEFAULT_BRUSH_PROCESSING=Object.freeze({engine:'off',mode:'',strength:1});

export function normalizeBrushProcessing(value={}){
  if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid brush processing settings.');
  if(value.engine==='off')return{...DEFAULT_BRUSH_PROCESSING};
  const processor=BRUSH_PROCESSORS[value.engine];
  if(!processor||!processor.modes.includes(value.mode)||!Number.isFinite(value.strength)||value.strength<0||value.strength>1)throw Error('Invalid brush processing settings.');
  return{engine:value.engine,mode:value.mode,strength:value.strength};
}

export async function createBrushProcessingSession(settings,sourceId,seedValue){
  const config=normalizeBrushProcessing(settings),definition=BRUSH_PROCESSORS[config.engine];
  if(!definition)return null;
  const allocator=new BudgetAllocator(64*1048576),engine=definition.create();
  try{
    await engine.initialize({backend:'cpu',allocator,services:{}});
    const parameters=engine.serializeParameters({mode:config.mode}).parameters;
    if(config.engine==='temporal-sculptor'&&config.mode==='fossil-bloom')engine.command('capture',null,0);
    return{config,allocator,engine,parameters,sourceId,epoch:seedValue>>>0,sequence:0,lastTime:0,seed:seedValue>>>0,disposed:false};
  }catch(error){engine.dispose?.();allocator.dispose();throw error;}
}

export async function processBrushSource(session,dataUrl,sources,timeSeconds){
  if(!session||session.disposed)throw Error('Brush processing session is unavailable.');
  const image=await sources.frame(dataUrl),width=image.naturalWidth,height=image.naturalHeight;
  const canvas=surface(width,height),context=canvas.getContext('2d',{willReadFrequently:true});
  context.drawImage(image,0,0,width,height);
  const metadata={width,height,format:'linear-srgb-premultiplied-rgba',origin:'top-left',sourceId:session.sourceId,epoch:session.epoch,sequence:session.sequence,timestampSeconds:timeSeconds};
  const input=frameFromSrgb8(session.allocator,context.getImageData(0,0,width,height).data,metadata);let output;
  try{
    output=await session.engine.process({input:input.value,parameters:session.parameters,timeSeconds,deltaSeconds:Math.max(0,timeSeconds-session.lastTime),seed:session.seed,discontinuity:session.sequence===0?'source':'none',signal:new AbortController().signal});
    const pixels=frameToSrgb8(output.value),original=context.getImageData(0,0,width,height).data,strength=session.config.strength;
    if(strength<1)for(let i=0;i<pixels.length;i++)pixels[i]=Math.round(original[i]+(pixels[i]-original[i])*strength);
    context.putImageData(new ImageData(pixels,width,height),0,0);
    const encoded=await new Promise((resolve,reject)=>canvas.toBlob(blob=>{if(!blob){reject(Error('Could not encode the processed brush frame.'));return;}const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Could not read the processed brush frame.'));reader.readAsDataURL(blob);},'image/png'));
    session.sequence++;session.lastTime=timeSeconds;
    return encoded;
  }finally{output?.release();input.release();canvas.width=canvas.height=1;}
}

export function disposeBrushProcessingSession(session){
  if(!session||session.disposed)return;
  session.disposed=true;
  try{session.engine.dispose();}finally{session.allocator.dispose();}
}
