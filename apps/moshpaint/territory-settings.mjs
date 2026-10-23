import {territoryPreset,restoreTerritoryPreset} from './packages/color-territories/index.mjs';
export function defaultTerritory(){return {id:'territory-1',hue:[340,20],saturation:[.3,1],luminance:[0,1],tolerance:0,boundarySoftness:0,feather:0,smoothingSeconds:0,invert:false};}
const legacyRoutes=new Set(['fossil','temporal','frequency','recursive','chromatic','motion']);
export function territoryProject(value){
  if(value===undefined)return {version:1,preset:territoryPreset([defaultTerritory()]),selectedId:'territory-1',renderer:'auto',surface:'canvas',resolution:320,route:'moirefield',fullCanvas:false,ghost:{delaySeconds:.25,ghostStrength:.5},taffy:{stretchSeconds:.5,taffyStrength:1,direction:'left-to-right'}};
  const keys=['version','preset','selectedId','renderer','surface','resolution','route','fullCanvas','fossil','ghost','taffy','temporal','frequency','recursive','chromatic','motion'];
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!keys.includes(k))||value.version!==1||!['auto','cpu'].includes(value.renderer)||!['canvas','dry'].includes(value.surface)||![160,320,640].includes(value.resolution)||!['video','moirefield','fossil','ghost','taffy','temporal','frequency','recursive','chromatic','motion'].includes(value.route))throw Error('Invalid Color Territories project settings.');
  if(value.fullCanvas!==undefined&&typeof value.fullCanvas!=='boolean')throw Error('Invalid Color Territories full-canvas setting.');
  const ghost=value.ghost===undefined?{delaySeconds:.25,ghostStrength:.5}:value.ghost;
  if(!ghost||typeof ghost!=='object'||Array.isArray(ghost)||Object.keys(ghost).some(k=>!['delaySeconds','ghostStrength'].includes(k))||!Number.isFinite(ghost.delaySeconds)||ghost.delaySeconds<0||ghost.delaySeconds>2||!Number.isFinite(ghost.ghostStrength)||ghost.ghostStrength<0||ghost.ghostStrength>1)throw Error('Invalid Ghosts settings.');
  const taffy=value.taffy===undefined?{stretchSeconds:.5,taffyStrength:1,direction:'left-to-right'}:value.taffy;
  if(!taffy||typeof taffy!=='object'||Array.isArray(taffy)||Object.keys(taffy).some(k=>!['stretchSeconds','taffyStrength','direction'].includes(k))||!Number.isFinite(taffy.stretchSeconds)||taffy.stretchSeconds<0||taffy.stretchSeconds>2||!Number.isFinite(taffy.taffyStrength)||taffy.taffyStrength<0||taffy.taffyStrength>1||!['left-to-right','right-to-left','top-to-bottom','bottom-to-top'].includes(taffy.direction))throw Error('Invalid Time Taffy settings.');
  const regions=restoreTerritoryPreset(value.preset);
  if(regions.length<1||regions.length>8||!regions.some(s=>s.id===value.selectedId))throw Error('Invalid Color Territories selection.');
  return {version:1,preset:territoryPreset(regions),selectedId:value.selectedId,renderer:value.renderer,surface:value.surface,resolution:value.resolution,route:legacyRoutes.has(value.route)?'moirefield':value.route,fullCanvas:value.fullCanvas??false,ghost:{...ghost},taffy:{...taffy}};
}
