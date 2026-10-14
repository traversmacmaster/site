import {rng,clamp} from './core.mjs';
export const surface=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c;};
export function process(input,kind,amount,seed,params={}){
  const out=surface(input.width,input.height),ctx=out.getContext('2d',{willReadFrequently:true});ctx.drawImage(input,0,0);
  if(kind==='clean'||amount<=0)return out;
  const w=out.width,h=out.height,r=rng(seed),a=clamp(amount,0,1),block=Math.max(2,Math.round(params.block||8));
  if(kind==='block'||kind==='jpeg'){
    const small=surface(Math.max(1,w/(block*a+1)),Math.max(1,h/(block*a+1)));small.getContext('2d').drawImage(input,0,0,small.width,small.height);ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,w,h);ctx.drawImage(small,0,0,w,h);
    if(kind==='block')return out;
  }
  if(kind==='mosh'||kind==='melt'||kind==='echo'){
    const strips=kind==='melt'?Math.ceil(w/block):Math.ceil(h/block);
    for(let i=0;i<strips;i++){const d=(r()-.45)*a*50;
      if(kind==='melt'){const direction=Math.sign(params.dy??1)||1,travel=direction*(8+r()*70)*a,side=(params.dx||0)*a*.3;ctx.drawImage(input,i*block,0,block,h,i*block+side,travel,block,h);}
      else {ctx.globalAlpha=kind==='echo'?.5:1;ctx.drawImage(input,0,i*block,w,block,d+(params.dx||0)*a,i*block+(params.dy||0)*a,w,block);}}
    return out;
  }
  const image=ctx.getImageData(0,0,w,h),data=image.data,original=new Uint8ClampedArray(data);
  if(kind==='rgb'){
    const shift=Math.max(1,Math.round((params.offset||24)*a));
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;data[i]=original[(y*w+clamp(x-shift,0,w-1))*4];data[i+2]=original[(y*w+clamp(x+shift,0,w-1))*4+2];}
  }else if(kind==='edge'){
    const threshold=(params.threshold??.2)*255;
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=(y*w+x)*4,l=i-4,rr=i+4,u=i-w*4,d=i+w*4;
      const gx=(original[rr]*.299+original[rr+1]*.587+original[rr+2]*.114)-(original[l]*.299+original[l+1]*.587+original[l+2]*.114);
      const gy=(original[d]*.299+original[d+1]*.587+original[d+2]*.114)-(original[u]*.299+original[u+1]*.587+original[u+2]*.114),v=gx*gx+gy*gy>threshold*threshold?255:0;
      data[i]=data[i+1]=data[i+2]=v;data[i+3]=v?original[i+3]:0;}
  }else if(kind==='sort'){
    const threshold=params.threshold??.2,span=Math.max(4,Math.floor(w*a));
    for(let y=0;y<h;y+=2)for(let start=0;start<w;start+=span){const list=[];for(let x=start;x<Math.min(w,start+span);x++){const i=(y*w+x)*4;if(data[i+3]&&((data[i]+data[i+1]+data[i+2])/765)>threshold)list.push([data.slice(i,i+4),i]);}const sorted=list.map(v=>v[0]).sort((a,b)=>(a[0]+a[1]+a[2])-(b[0]+b[1]+b[2]));list.forEach((v,j)=>data.set(sorted[j],v[1]));}
  }else if(kind==='jpeg')for(let i=0;i<data.length;i+=4)for(let c=0;c<3;c++)data[i+c]=Math.round(data[i+c]/(8+40*a))*(8+40*a);
  ctx.putImageData(image,0,0);return out;
}
export function damage(canvas,x,y,size,kind,amount,seed,params={}){
  const ctx=canvas.getContext('2d'),s=Math.min(768,Math.max(2,Math.round(size))),patch=surface(s,s),pc=patch.getContext('2d');
  pc.drawImage(canvas,x-s/2,y-s/2,s,s,0,0,s,s);
  const mapped={smear:'mosh',knife:'rgb',compression:'block',repeat:'echo',magnet:'mosh'}[kind]||kind;
  const result=process(patch,mapped,amount,seed,params);
  ctx.save();ctx.beginPath();ctx.arc(x,y,s/2,0,Math.PI*2);ctx.clip();
  if(kind==='smear'||kind==='magnet') {ctx.globalAlpha=amount;ctx.drawImage(patch,x-s/2+(params.dx||0)*amount,y-s/2+(params.dy||0)*amount);}
  else {ctx.clearRect(x-s/2,y-s/2,s,s);ctx.drawImage(result,x-s/2,y-s/2);}
  ctx.restore();
}
