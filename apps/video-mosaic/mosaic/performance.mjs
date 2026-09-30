import {matchTiles,LIMITS} from './model.mjs';
import {sweepSizeAt} from './sweep.mjs';
export {sweepSettings,sweepSizeAt} from './sweep.mjs';
export class MosaicPerformance{
 constructor(){this.cache=new Map();this.identity=null;this.lastSize=null;}
 evaluate(project,pool,time){
  if(!project.sweep?.enabled)return project;
  const signature=`${project.mask.revision}:${project.settings.seed}:${project.settings.colorMatch}:${project.settings.luminanceMatch}`,size=sweepSizeAt(project.sweep,time);
  if(this.identity!==project.target||this.mask!==project.mask||this.signature!==signature||this.analysis!==pool.analysis){this.cache.clear();this.identity=project.target;this.mask=project.mask;this.signature=signature;this.analysis=pool.analysis;this.pixels=project.target.getContext('2d',{willReadFrequently:true}).getImageData(0,0,project.target.width,project.target.height).data;this.maskPixels=project.mask.context.getImageData(0,0,project.target.width,project.target.height).data;}
  let assignments=this.cache.get(size);if(!assignments){assignments=matchTiles(this.pixels,this.maskPixels,project.target.width,project.target.height,pool.analysis,{...project.settings,tileSize:size});this.cache.set(size,assignments);let total=[...this.cache.values()].reduce((n,a)=>n+a.length,0);while(this.cache.size>24||total>LIMITS.tiles*4){const key=this.cache.keys().next().value;total-=this.cache.get(key).length;this.cache.delete(key);}}else{this.cache.delete(size);this.cache.set(size,assignments);}
  this.lastSize=size;return{...project,settings:{...project.settings,tileSize:size},assignments};
 }
}
