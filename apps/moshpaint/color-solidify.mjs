// A fixed, saved OKLab palette makes frame processing independent of playback order.
export const SOLIDIFY_DEFAULTS=Object.freeze({enabled:false,consolidation:35,paletteSize:24,edgePreservation:80,maskCleanup:25,applyTo:'mask',palette:[]});
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)));
export function solidifySettings(value={}){return {...SOLIDIFY_DEFAULTS,enabled:!!value.enabled,consolidation:clamp(value.consolidation??35,0,100),paletteSize:Math.round(clamp(value.paletteSize??24,2,64)),edgePreservation:clamp(value.edgePreservation??80,0,100),maskCleanup:clamp(value.maskCleanup??25,0,100),applyTo:value.applyTo==='visible'?'visible':'mask',palette:Array.isArray(value.palette)?value.palette:[]};}
export function validateSolidify(s){if(!s||typeof s.enabled!=='boolean'||!['mask','visible'].includes(s.applyTo)||!['consolidation','edgePreservation','maskCleanup'].every(k=>Number.isFinite(s[k])&&s[k]>=0&&s[k]<=100)||!Number.isInteger(s.paletteSize)||s.paletteSize<2||s.paletteSize>64||!Array.isArray(s.palette)||s.palette.length>64||s.palette.some(c=>!Array.isArray(c)||c.length!==3||c.some(v=>!Number.isFinite(v)||v<0||v>255)))throw Error('Invalid Color Solidify settings.');}
const linear=Array.from({length:256},(_,i)=>{const v=i/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
function lab(r,g,b){r=linear[Math.round(r)];g=linear[Math.round(g)];b=linear[Math.round(b)];const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];}
const distance=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2;
function nearest(c,palette){let best=0,d=Infinity;for(let j=0;j<palette.length;j++){const n=distance(c,palette[j]);if(n<d){d=n;best=j;}}return best;}
export function buildSolidifyPalette(image,size=24){
  const samples=[],data=image.data,step=Math.max(1,Math.floor(image.width*image.height/2048));
  for(let p=0;p<image.width*image.height;p+=step){const i=p*4;if(data[i+3]<128)continue;const rgb=[data[i],data[i+1],data[i+2]];samples.push({rgb,lab:lab(...rgb)});}
  if(!samples.length)return [[0,0,0]];
  const centers=[samples[0].lab];while(centers.length<size){let far=null,d=0;for(const s of samples){const n=distance(s.lab,centers[nearest(s.lab,centers)]);if(n>d){d=n;far=s.lab;}}if(!far||d<.00008)break;centers.push(far);}
  let colors=[];for(let iteration=0;iteration<6;iteration++){const sums=centers.map(()=>({lab:[0,0,0],rgb:[0,0,0],n:0}));for(const s of samples){const sum=sums[nearest(s.lab,centers)];sum.n++;for(let k=0;k<3;k++){sum.lab[k]+=s.lab[k];sum.rgb[k]+=s.rgb[k];}}colors=sums.map((s,j)=>s.n?s.rgb.map(v=>Math.round(v/s.n)):colors[j]||samples[0].rgb);for(let j=0;j<centers.length;j++)if(sums[j].n)centers[j]=sums[j].lab.map(v=>v/sums[j].n);}
  return colors;
}
export function solidifyPixels(image,settings){
  const s=solidifySettings(settings),{width:w,height:h,data:d}=image,out=new Uint8ClampedArray(d);
  if(!s.enabled||!s.consolidation||!s.palette.length)return out;
  const colors=[];for(const color of s.palette){const c=lab(...color);if(!colors.some(other=>distance(c,lab(...other))<(.012+s.consolidation*.00065)**2))colors.push(color);}const labs=new Float32Array(w*h*3),palette=colors.map(c=>lab(...c));for(let p=0;p<w*h;p++){const c=lab(d[p*4],d[p*4+1],d[p*4+2]);labs.set(c,p*3);}
  const strength=s.consolidation/100,limit=.025+(1-s.edgePreservation/100)*.18;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const p=y*w+x,i=p*4;if(!d[i+3])continue;const c=[labs[p*3],labs[p*3+1],labs[p*3+2]],sum=[0,0,0];let weight=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;const q=yy*w+xx;if(!d[q*4+3])continue;const delta=(labs[q*3]-c[0])**2+(labs[q*3+1]-c[1])**2+(labs[q*3+2]-c[2])**2,wt=Math.exp(-delta/(limit*limit))*(dx||dy?strength:1);weight+=wt;for(let k=0;k<3;k++)sum[k]+=labs[q*3+k]*wt;}
    const smoothed=sum.map(v=>v/weight),index=nearest(smoothed,palette);if(distance(smoothed,palette[index])>(.16+strength*.14)**2)continue;const rgb=colors[index];out[i]=rgb[0];out[i+1]=rgb[1];out[i+2]=rgb[2];
  }return out;
}
export function cleanupColorMask(selected,w,h,amount=25,alpha=null){
  if(!amount)return selected;const out=selected.slice(),threshold=amount>=65?5:6;
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const p=y*w+x;if(alpha&&alpha[p*4+3]===0)continue;let count=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy)count+=selected[p+dy*w+dx];if(count>=threshold)out[p]=1;else if(count<=8-threshold)out[p]=0;}
  selected.set(out);return selected;
}
const processors=new WeakMap();
let gpu;
function gpuRenderer(){
  if(gpu!==undefined)return gpu;
  gpu=null;const canvas=document.createElement('canvas'),options={alpha:true,premultipliedAlpha:false,preserveDrawingBuffer:true},gl=canvas.getContext('webgl2',options)||canvas.getContext('webgl',options);if(!gl)return null;const webgl2=!!gl.texStorage2D;
  const compile=(type,text)=>{const shader=gl.createShader(type);if(webgl2){text='#version 300 es\n'+text.replace(/attribute /g,'in ').replace(/varying /g,type===gl.VERTEX_SHADER?'out ':'in ').replace(/texture2D/g,'texture').replace(/gl_FragColor/g,'outColor');if(type===gl.FRAGMENT_SHADER)text=text.replace('precision highp float;','precision highp float;out vec4 outColor;');}gl.shaderSource(shader,text);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
  try{
    const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}'));
    gl.attachShader(program,compile(gl.FRAGMENT_SHADER,`precision highp float;
      varying vec2 uv;uniform sampler2D image;uniform vec2 texel;uniform float strength;uniform float edgeLimit;uniform int count;uniform vec3 colors[64];uniform vec3 labs[64];
      vec3 toLab(vec3 rgb){vec3 low=rgb/12.92,high=pow((rgb+.055)/1.055,vec3(2.4));vec3 c=mix(high,low,step(rgb,vec3(.04045)));
        vec3 lms=pow(vec3(dot(c,vec3(.4122214708,.5363325363,.0514459929)),dot(c,vec3(.2119034982,.6806995451,.1073969566)),dot(c,vec3(.0883024619,.2817188376,.6299787005))),vec3(1./3.));
        return vec3(dot(lms,vec3(.2104542553,.793617785,-.0040720468)),dot(lms,vec3(1.9779984951,-2.428592205,.4505937099)),dot(lms,vec3(.0259040371,.7827717662,-.808675766)));}
      void main(){vec4 original=texture2D(image,uv);if(strength==0.||original.a==0.){gl_FragColor=original;return;}vec3 center=toLab(original.rgb),sum=vec3(0.);float weight=0.;
        for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 at=uv+vec2(float(x),float(y))*texel;if(at.x<0.||at.y<0.||at.x>1.||at.y>1.)continue;vec4 pixel=texture2D(image,at);if(pixel.a==0.)continue;vec3 c=toLab(pixel.rgb),delta=c-center;float wt=exp(-dot(delta,delta)/(edgeLimit*edgeLimit))*((x==0&&y==0)?1.:strength);sum+=c*wt;weight+=wt;}
        vec3 c=sum/max(weight,.00001),rgb=original.rgb;float best=100.;for(int i=0;i<64;i++){if(i>=count)break;vec3 delta=c-labs[i];float d=dot(delta,delta);if(d<best){best=d;rgb=colors[i];}}
        float limit=.16+strength*.14;if(best>limit*limit)rgb=original.rgb;gl_FragColor=vec4(rgb,original.a);}`));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);for(const param of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,param,gl.CLAMP_TO_EDGE);for(const param of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,param,gl.NEAREST);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    const uniform=Object.fromEntries(['texel','strength','edgeLimit','count','colors[0]','labs[0]'].map(name=>[name,gl.getUniformLocation(program,name)]));
    gpu={render(media,w,h,s){if(gl.isContextLost())return null;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);gl.useProgram(program);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,media);
      const colors=[];for(const color of s.palette)if(!colors.some(other=>distance(lab(...color),lab(...other))<(.012+s.consolidation*.00065)**2))colors.push(color);
      gl.uniform2f(uniform.texel,1/(media.videoWidth||media.naturalWidth||media.width),1/(media.videoHeight||media.naturalHeight||media.height));gl.uniform1f(uniform.strength,s.consolidation/100);gl.uniform1f(uniform.edgeLimit,.025+(1-s.edgePreservation/100)*.18);gl.uniform1i(uniform.count,colors.length);gl.uniform3fv(uniform['colors[0]'],new Float32Array(colors.flat().map(v=>v/255)));gl.uniform3fv(uniform['labs[0]'],new Float32Array(colors.flatMap(c=>lab(...c))));gl.drawArrays(gl.TRIANGLE_STRIP,0,4);return canvas;}};
  }catch{gpu=null;}return gpu;
}
export function solidifyFrame(source,media=source.el,{detection=false,frameTime=null}={}){
  const s=solidifySettings(source?.solidify);if(!s.enabled||(!detection&&s.applyTo!=='visible'))return media;
  const sw=media.videoWidth||media.naturalWidth||media.width,sh=media.videoHeight||media.naturalHeight||media.height;if(!sw||!sh)return media;
  const renderer=gpuRenderer(),scale=Math.min(1,(renderer?512:192)/Math.max(sw,sh)),w=Math.max(1,Math.round(sw*scale)),h=Math.max(1,Math.round(sh*scale));
  let cache=processors.get(media);if(!cache){const canvas=document.createElement('canvas');cache={canvas,ctx:canvas.getContext('2d',{willReadFrequently:true})};processors.set(media,cache);}
  const key=JSON.stringify(s),time=frameTime??media.currentTime??0;if(cache.key===key&&cache.time===time)return cache.canvas;
  if(cache.canvas.width!==w||cache.canvas.height!==h){cache.canvas.width=w;cache.canvas.height=h;}
  if(!s.palette.length){cache.ctx.clearRect(0,0,w,h);cache.ctx.drawImage(media,0,0,w,h);s.palette=buildSolidifyPalette(cache.ctx.getImageData(0,0,w,h),s.paletteSize);source.solidify={...s};}
  const frame=renderer?.render(media,w,h,s);cache.ctx.clearRect(0,0,w,h);if(frame)cache.ctx.drawImage(frame,0,0);else{cache.ctx.drawImage(media,0,0,w,h);const image=cache.ctx.getImageData(0,0,w,h);image.data.set(solidifyPixels(image,s));cache.ctx.putImageData(image,0,0);}cache.key=JSON.stringify(s);cache.time=time;return cache.canvas;
}
