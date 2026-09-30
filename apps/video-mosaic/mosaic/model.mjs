import {rng,clamp} from '../src/core.mjs';
import {oklab} from '../src/living.mjs';
import {sweepSettings} from './sweep.mjs';
export const DEFAULTS=Object.freeze({tileSize:24,colorMatch:1,luminanceMatch:.7,loopLength:1.5,seed:104729});
export const LIMITS=Object.freeze({videos:8,seconds:240,bytes:64*1024*1024,edge:64,fps:12,targetEdge:1600,tiles:12000});
export const luminance=rgb=>(rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722)/255;
export function descriptor(rgb){return{rgb,lab:oklab(...rgb),luminance:luminance(rgb)};}
export function averageRGBA(data){let r=0,g=0,b=0,weight=0;for(let i=0;i<data.length;i+=4){const a=data[i+3]/255;r+=data[i]*a;g+=data[i+1]*a;b+=data[i+2]*a;weight+=a;}return descriptor(weight?[r/weight,g/weight,b/weight]:[0,0,0]);}
// Temporal statistics belong to the prepared video frames, not playback clocks.
export function frameStatistics(data){
 const mean=[0,0,0],min=[1,1,1],max=[0,0,0];let lowY=1,highY=0;
 for(let i=0;i<data.length;i+=4){for(let c=0;c<3;c++){const v=data[i+c]/255;mean[c]+=v;min[c]=Math.min(min[c],v);max[c]=Math.max(max[c],v);}const y=(data[i]*.2126+data[i+1]*.7152+data[i+2]*.0722)/255;lowY=Math.min(lowY,y);highY=Math.max(highY,y);}
 for(let c=0;c<3;c++)mean[c]/=data.length/4;
 return{mean,min,max,lowY,highY};
}
export function settings(value={}){const out={...DEFAULTS,...value};if(!Number.isInteger(out.tileSize)||out.tileSize<8||out.tileSize>160||!Number.isFinite(out.colorMatch)||out.colorMatch<0||out.colorMatch>1||!Number.isFinite(out.luminanceMatch)||out.luminanceMatch<0||out.luminanceMatch>1||!Number.isFinite(out.loopLength)||out.loopLength<.25||out.loopLength>8||!Number.isInteger(out.seed)||out.seed<0||out.seed>4294967295)throw Error('Invalid mosaic settings.');return out;}
export function matchScore(target,sample,options){const a=target.lab,b=sample.lab;return options.colorMatch*((a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2)+options.luminanceMatch*(target.luminance-sample.luminance)**2;}
export function matchTiles(targetPixels,maskPixels,width,height,samples,options=DEFAULTS){
 options=settings(options);if(!samples.length)throw Error('Scan at least one video before generating.');
 const assignments=[],size=options.tileSize;
 for(let y=0;y<height;y+=size)for(let x=0;x<width;x+=size){const w=Math.min(size,width-x),h=Math.min(size,height-y);let r=0,g=0,b=0,total=0;
  for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++){const i=(py*width+px)*4,a=maskPixels[i+3]/255*targetPixels[i+3]/255;if(a){r+=targetPixels[i]*a;g+=targetPixels[i+1]*a;b+=targetPixels[i+2]*a;total+=a;}}
  if(!total)continue;const target=descriptor([r/total,g/total,b/total]),best=[];
  for(const sample of samples){const score=matchScore(target,sample,options);let n=0;while(n<best.length&&best[n].score<=score)n++;if(n<4){best.splice(n,0,{sample,score});if(best.length>4)best.pop();}}
  const near=best.filter(v=>v.score<=best[0].score+.015),random=rng(options.seed^Math.imul(y*width+x+1,2654435761)),weights=near.map(v=>Math.exp(-(v.score-best[0].score)/.003));let choice=random()*weights.reduce((a,b)=>a+b,0),selected=near[0];for(let n=0;n<near.length;n++){choice-=weights[n];if(choice<=0){selected=near[n];break;}}
  assignments.push({x,y,w,h,sourceId:selected.sample.sourceId,timestamp:selected.sample.timestamp,phase:random()*.25,score:selected.score,targetRGB:target.rgb});
  if(assignments.length>LIMITS.tiles)throw Error('More than 12,000 masked tiles. Increase the minimum Tile Size or select a smaller region.');
 }
 return assignments;
}
export function tileSourceTime(tile,time,duration,loopLength){const span=Math.min(loopLength,duration),start=clamp(tile.timestamp-span/2,0,Math.max(0,duration-span)),offset=tile.timestamp-start+tile.phase*span;return start+((Math.max(0,time)+offset)%span+span)%span;}
export function validateProject(project){
 if(project?.app!=='VideoMosaic'||project.version!==1)throw Error('Not a supported VIDEO MOSAIC project.');settings(project.settings);
 if(project.sweep)sweepSettings(project.sweep);
 const validSource=s=>s&&typeof s.id==='string'&&s.id.length>0&&typeof s.name==='string'&&typeof s.data==='string'&&s.data.length<=112*1024*1024&&s.sample&&Number.isFinite(s.sample.x)&&Number.isFinite(s.sample.y)&&s.sample.x>=0&&s.sample.x<=1&&s.sample.y>=0&&s.sample.y<=1;
 if(!validSource(project.target)||!Array.isArray(project.sources)||project.sources.some(s=>!validSource(s)))throw Error('Invalid embedded source metadata.');
 if(!project.target||project.target.type!=='image'||!/^data:image\//.test(project.target.data)||typeof project.mask!=='string'||!project.mask.startsWith('data:image/png;base64,')||!Number.isInteger(project.width)||!Number.isInteger(project.height)||project.width<1||project.height<1||project.width>LIMITS.targetEdge||project.height>LIMITS.targetEdge)throw Error('Invalid target or mask.');
 if(!Array.isArray(project.sources)||project.sources.length>LIMITS.videos||project.sources.some(s=>s.type!=='video'||typeof s.id!=='string'||typeof s.data!=='string'||!s.data.startsWith('data:video/'))||new Set(project.sources.map(s=>s.id)).size!==project.sources.length)throw Error('Invalid video pool.');
 const ids=new Set(project.sources.map(s=>s.id));if(!Array.isArray(project.assignments)||project.assignments.length>LIMITS.tiles||project.assignments.some(t=>!ids.has(t.sourceId)||!['x','y','w','h','timestamp','phase'].every(k=>Number.isFinite(t[k]))||t.x<0||t.y<0||t.w<=0||t.h<=0||t.x+t.w>project.width||t.y+t.h>project.height||t.timestamp<0||t.phase<0||t.phase>1))throw Error('Invalid tile assignments.');
 if(project.assignments.some(t=>t.targetRGB!==undefined&&(!Array.isArray(t.targetRGB)||t.targetRGB.length!==3||t.targetRGB.some(v=>!Number.isFinite(v)||v<0||v>255))))throw Error('Invalid reconstruction colors.');
 if(project.analysis!==undefined&&(!Array.isArray(project.analysis)||project.analysis.length>2048||project.analysis.some(s=>!ids.has(s.sourceId)||!Number.isFinite(s.timestamp)||s.timestamp<0||!Array.isArray(s.rgb)||s.rgb.length!==3||s.rgb.some(v=>!Number.isFinite(v)||v<0||v>255)||!Array.isArray(s.lab)||s.lab.length!==3||s.lab.some(v=>!Number.isFinite(v)||Math.abs(v)>2)||!Number.isFinite(s.luminance)||s.luminance<0||s.luminance>1)))throw Error('Invalid saved analysis.');
 if(!Number.isFinite(project.time)||project.time<0||project.time>86400)throw Error('Invalid project time.');
 if(project.maskHistory){const record=project.maskHistory;if(!Array.isArray(record.operations)||record.operations.length>2000||!Number.isInteger(record.cursor)||record.cursor<0||record.cursor>record.operations.length||(record.base!==null&&!(typeof record.base==='string'&&record.base.startsWith('data:image/png;base64,'))))throw Error('Invalid mask history.');let points=0;for(const op of record.operations){if(!['clear','invert','stroke'].includes(op.kind))throw Error('Unknown mask operation.');if(op.kind==='stroke'){if(!Number.isFinite(op.size)||op.size<4||op.size>300||typeof op.erase!=='boolean'||!Array.isArray(op.points)||!op.points.length||op.points.length>12000||op.points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>100000||Math.abs(p.y)>100000||(p.pressure!==undefined&&(!Number.isFinite(p.pressure)||p.pressure<0||p.pressure>1))))throw Error('Invalid mask stroke.');points+=op.points.length;}}if(points>100000)throw Error('Mask history exceeds 100,000 points.');}
 return project;
}
