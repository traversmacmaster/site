import {History} from '../src/core.mjs';
import {surface} from '../src/processors.mjs';
import {drawLivingStroke} from '../src/living.mjs';
export class MosaicMask{
 constructor(width,height){this.canvas=surface(width,height);this.context=this.canvas.getContext('2d',{willReadFrequently:true});this.history=new History();this.base=null;this.revision=0;}
 apply(operation){const x=this.context;x.save();x.setTransform(1,0,0,1,0,0);x.globalAlpha=1;
  if(operation.kind==='clear')x.clearRect(0,0,this.canvas.width,this.canvas.height);
  else if(operation.kind==='invert'){const im=x.getImageData(0,0,this.canvas.width,this.canvas.height);for(let i=0;i<im.data.length;i+=4){im.data[i]=im.data[i+1]=im.data[i+2]=255;im.data[i+3]=255-im.data[i+3];}x.putImageData(im,0,0);}
  else{x.globalCompositeOperation=operation.erase?'destination-out':'source-over';x.fillStyle='#fff';drawLivingStroke(x,operation.points,operation.size,'round',1);}
  x.restore();this.revision++;
 }
 commit(operation,{alreadyDrawn=false}={}){this.history.add(structuredClone(operation));if(!alreadyDrawn)this.apply(operation);}
 rebuild(){this.context.clearRect(0,0,this.canvas.width,this.canvas.height);if(this.base)this.context.drawImage(this.base,0,0);for(const op of this.history.active)this.apply(op);this.revision++;}
 undo(){this.history.undo();this.rebuild();}redo(){this.history.redo();this.rebuild();}
 async restore(data){const image=new Image();image.src=data;await image.decode();if(image.width!==this.canvas.width||image.height!==this.canvas.height)throw Error('Mask dimensions do not match target.');this.base=image;this.history=new History();this.rebuild();}
 async restoreHistory(record){this.base=null;if(record.base){const image=new Image();image.src=record.base;await image.decode();if(image.width!==this.canvas.width||image.height!==this.canvas.height)throw Error('Mask base dimensions do not match target.');this.base=image;}this.history.load(structuredClone(record.operations),record.cursor);this.rebuild();}
 serializeHistory(){return{base:this.base?.src||null,operations:this.history.operations,cursor:this.history.cursor};}
}
