import {territoryPreset,restoreTerritoryPreset} from './packages/color-territories/index.mjs';
import {frequencyParameters} from './packages/frequency-weaver/index.mjs';
import {recursiveParameters} from './packages/recursive-feedback/index.mjs';
import {chromaticParameters} from './packages/chromatic-physics/index.mjs';
import {motionParameters} from './packages/motion-ecology/index.mjs';
import {temporalParameters} from './packages/temporal-sculptor/index.mjs';
export function defaultTerritory(){return {id:'territory-1',hue:[340,20],saturation:[.3,1],luminance:[0,1],tolerance:0,boundarySoftness:0,feather:0,smoothingSeconds:0,invert:false};}
export function territoryProject(value){
  if(value===undefined)return {version:1,preset:territoryPreset([defaultTerritory()]),selectedId:'territory-1',renderer:'auto',surface:'canvas',resolution:320,route:'moirefield',fullCanvas:false,fossil:{holdSeconds:0,decaySeconds:0},ghost:{delaySeconds:.25,ghostStrength:.5},taffy:{stretchSeconds:.5,taffyStrength:1,direction:'left-to-right'},temporal:temporalParameters({mode:'chrono-shatter'}),frequency:frequencyParameters(),recursive:recursiveParameters(),chromatic:chromaticParameters(),motion:motionParameters()};
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['version','preset','selectedId','renderer','surface','resolution','route','fullCanvas','fossil','ghost','taffy','temporal','frequency','recursive','chromatic','motion'].includes(k))||
    value.version!==1||!['auto','cpu'].includes(value.renderer)||!['canvas','dry'].includes(value.surface)||![160,320,640].includes(value.resolution)||!['video','moirefield','fossil','ghost','taffy','temporal','frequency','recursive','chromatic','motion'].includes(value.route))throw Error('Invalid Color Territories project settings.');
  const fossil=value.fossil===undefined?{holdSeconds:0,decaySeconds:0}:value.fossil;
  if(!fossil||typeof fossil!=='object'||Array.isArray(fossil)||Object.keys(fossil).some(k=>!['holdSeconds','decaySeconds'].includes(k))||!Number.isFinite(fossil.holdSeconds)||fossil.holdSeconds<0||fossil.holdSeconds>3600||!Number.isFinite(fossil.decaySeconds)||fossil.decaySeconds<0||fossil.decaySeconds>300)throw Error('Invalid fossil timing.');
  const ghost=value.ghost===undefined?{delaySeconds:.25,ghostStrength:.5}:value.ghost;
  if(!ghost||typeof ghost!=='object'||Array.isArray(ghost)||Object.keys(ghost).some(k=>!['delaySeconds','ghostStrength'].includes(k))||!Number.isFinite(ghost.delaySeconds)||ghost.delaySeconds<0||ghost.delaySeconds>2||!Number.isFinite(ghost.ghostStrength)||ghost.ghostStrength<0||ghost.ghostStrength>1)throw Error('Invalid Ghosts settings.');
  const taffy=value.taffy===undefined?{stretchSeconds:.5,taffyStrength:1,direction:'left-to-right'}:value.taffy;
  if(!taffy||typeof taffy!=='object'||Array.isArray(taffy)||Object.keys(taffy).some(k=>!['stretchSeconds','taffyStrength','direction'].includes(k))||!Number.isFinite(taffy.stretchSeconds)||taffy.stretchSeconds<0||taffy.stretchSeconds>2||!Number.isFinite(taffy.taffyStrength)||taffy.taffyStrength<0||taffy.taffyStrength>1||!['left-to-right','right-to-left','top-to-bottom','bottom-to-top'].includes(taffy.direction))throw Error('Invalid Time Taffy settings.');
  const regions=restoreTerritoryPreset(value.preset);
  if(regions.length<1||regions.length>8||!regions.some(s=>s.id===value.selectedId))throw Error('Invalid Color Territories selection.');
  const frequency=frequencyParameters(value.frequency===undefined?{}:value.frequency);
  const recursive=recursiveParameters(value.recursive===undefined?{}:value.recursive);
  const chromatic=chromaticParameters(value.chromatic===undefined?{}:value.chromatic);
  const motion=motionParameters(value.motion===undefined?{}:value.motion);
  const temporal=temporalParameters(value.temporal===undefined?{mode:'chrono-shatter'}:value.temporal);
  if(value.fullCanvas!==undefined&&typeof value.fullCanvas!=='boolean')throw Error('Invalid Color Territories full-canvas setting.');
  return {...value,fullCanvas:value.fullCanvas??false,fossil:{...fossil},ghost:{...ghost},taffy:{...taffy},temporal,frequency,recursive,chromatic,motion,preset:territoryPreset(regions)};
}
