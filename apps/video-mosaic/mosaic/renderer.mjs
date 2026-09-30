import {surface} from '../src/processors.mjs';
import {TileReconstruction} from './reconstruction.mjs';
import {MosaicPerformance} from './performance.mjs';
export class MosaicRenderer{
 constructor(canvas){this.canvas=canvas;this.context=canvas.getContext('2d');this.layer=surface(1,1);this.layerContext=this.layer.getContext('2d');this.reconstruction=null;this.performance=new MosaicPerformance();this.lastMs=0;}
 renderAt(project,pool,time){const started=performance.now();project=this.performance.evaluate(project,pool,time);this.lastProject=project;const {target,mask,assignments,settings}=project,w=target.width,h=target.height;
  if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}if(this.layer.width!==w||this.layer.height!==h){this.layer.width=w;this.layer.height=h;}
  const x=this.context,l=this.layerContext;x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;x.globalCompositeOperation='source-over';x.clearRect(0,0,w,h);x.drawImage(target,0,0);l.globalCompositeOperation='source-over';l.clearRect(0,0,w,h);
  if(assignments.length&&pool.frameCount){this.reconstruction??=new TileReconstruction();l.drawImage(this.reconstruction.renderAt(project,pool,time),0,0);}
  l.globalCompositeOperation='destination-in';l.drawImage(mask.canvas,0,0);l.globalCompositeOperation='source-over';x.drawImage(this.layer,0,0);this.lastMs=performance.now()-started;return this.canvas;
 }
 dispose(){this.reconstruction?.dispose();this.layer.width=this.layer.height=1;}
}
