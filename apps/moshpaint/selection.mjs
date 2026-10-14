import {clamp} from './core.mjs';

export function handles(r){
  return [['nw',r.x,r.y],['n',r.x+r.w/2,r.y],['ne',r.x+r.w,r.y],['e',r.x+r.w,r.y+r.h/2],
    ['se',r.x+r.w,r.y+r.h],['s',r.x+r.w/2,r.y+r.h],['sw',r.x,r.y+r.h],['w',r.x,r.y+r.h/2]];
}
export function hitHandle(rect,p,zoom){return handles(rect).find(([,x,y])=>Math.abs(p.x-x)<=7/zoom&&Math.abs(p.y-y)<=7/zoom)?.[0]||null;}
export function contains(r,p){
  if(p.x<r.x||p.x>r.x+r.w||p.y<r.y||p.y>r.y+r.h)return false;
  if(!r.path)return true;
  let inside=false;
  for(let i=0,j=r.path.length-1;i<r.path.length;j=i++){
    const a=r.path[i],b=r.path[j];
    if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }
  return inside;
}
export function transformedRect(rect,target){
  const sx=target.w/rect.w,sy=target.h/rect.h;
  return {...target,...(rect.path?{path:rect.path.map(p=>({x:target.x+(p.x-rect.x)*sx,y:target.y+(p.y-rect.y)*sy}))}:{})};
}
export function resizeRect(r,handle,p,lockAspect=false){
  let left=r.x,top=r.y,right=r.x+r.w,bottom=r.y+r.h;
  if(handle.includes('w'))left=clamp(p.x,right-4096,right-2);
  if(handle.includes('e'))right=clamp(p.x,left+2,left+4096);
  if(handle.includes('n'))top=clamp(p.y,bottom-4096,bottom-2);
  if(handle.includes('s'))bottom=clamp(p.y,top+2,top+4096);
  if(lockAspect&&handle.length===2){
    const scale=clamp(Math.max((right-left)/r.w,(bottom-top)/r.h),Math.max(2/r.w,2/r.h),Math.min(4096/r.w,4096/r.h));
    if(handle.includes('w'))left=right-r.w*scale;else right=left+r.w*scale;
    if(handle.includes('n'))top=bottom-r.h*scale;else bottom=top+r.h*scale;
  }
  return transformedRect(r,{x:left,y:top,w:right-left,h:bottom-top});
}
export function transformOperation(rect,target,seed){return {kind:'selection',action:'scale',rect:structuredClone(rect),dx:target.x-rect.x,dy:target.y-rect.y,sx:target.w/rect.w,sy:target.h/rect.h,resample:'nearest',seed};}
