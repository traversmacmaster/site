import {surface} from '../src/processors.mjs';
import {tileSourceTime,LIMITS} from './model.mjs';

const VERTEX=`#version 300 es
void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0.,1.);}`;
const FRAGMENT=`#version 300 es
precision highp float;
uniform sampler2D frames,tiles,statistics;
uniform vec2 resolution,grid,atlas;
uniform float tileSize,colorMatch,luminanceMatch;
out vec4 outputColor;
const vec3 Y=vec3(.2126,.7152,.0722);
void main(){
 vec2 pixel=vec2(gl_FragCoord.x,resolution.y-gl_FragCoord.y);
 ivec2 cell=ivec2(floor(pixel/tileSize));vec4 tile=texelFetch(tiles,cell,0);
 if(tile.a<.5){outputColor=vec4(0.);return;}
 int slot=int(tile.a)-1;ivec2 address=ivec2(slot%int(atlas.x),slot/int(atlas.x));
 vec2 origin=vec2(cell)*tileSize,size=min(vec2(tileSize),resolution-origin),uv=(pixel-origin)/size;
 // Sample within a frame's texel centers; never interpolate into adjacent frames.
 vec3 source=texture(frames,(vec2(address)*64.+vec2(.5)+uv*63.)/(atlas*64.)).rgb;
 if(colorMatch==0.&&luminanceMatch==0.){outputColor=vec4(source,1.);return;}
 vec4 s=texelFetch(statistics,ivec2(slot,0),0),lo=texelFetch(statistics,ivec2(slot,1),0),hi=texelFetch(statistics,ivec2(slot,2),0);
 vec3 mean=mix(s.rgb,tile.rgb,colorMatch);
 mean=clamp(mean+vec3((dot(tile.rgb,Y)-dot(mean,Y))*luminanceMatch),0.,1.);
 // Leave a small contrast headroom even for nearly white/black targets.
 mean=mix(mean,clamp(mean,.025,.975),max(colorMatch,luminanceMatch));
 float chroma=1.-.65*colorMatch;
 vec3 detail=mix(vec3(dot(source-s.rgb,Y)),source-s.rgb,chroma);
 vec3 low=mix(vec3(lo.a-s.a),lo.rgb-s.rgb,chroma),high=mix(vec3(hi.a-s.a),hi.rgb-s.rgb,chroma);
 vec3 gain=min(vec3(1.),min(mean/max(-low,vec3(.00001)),(vec3(1.)-mean)/max(high,vec3(.00001))))*.9;
 outputColor=vec4(clamp(mean+detail*gain,0.,1.),1.);
}`;

// Shared GPU color reconstruction. Video detail remains animated; its changing
// mean is removed on every prepared frame, rather than tinting over the target.
export class TileReconstruction{
 constructor(){
  this.canvas=surface(1,1);this.gl=this.canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:true,preserveDrawingBuffer:true});
  if(!this.gl)throw Error('Video reconstruction needs WebGL2. Enable hardware acceleration in Edge/Chrome.');
  const gl=this.gl,compile=(type,text)=>{const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
  this.program=gl.createProgram();const vs=compile(gl.VERTEX_SHADER,VERTEX),fs=compile(gl.FRAGMENT_SHADER,FRAGMENT);gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(this.program));
  this.frameTexture=gl.createTexture();this.tileTexture=gl.createTexture();this.statsTexture=gl.createTexture();this.members=null;this.slots=new WeakMap();this.targetCache=new WeakMap();this.tileData=null;this.gridKey='';this.uploads=0;
 }
 texture(texture,unit){const gl=this.gl;gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);}
 syncPool(pool){
  const members=[...pool.clips.values()];if(this.members&&members.length===this.members.length&&members.every((c,n)=>c===this.members[n]))return;
  const gl=this.gl,count=Math.max(1,pool.frameCount),max=gl.getParameter(gl.MAX_TEXTURE_SIZE);this.columns=Math.min(Math.ceil(Math.sqrt(count)),Math.floor(max/LIMITS.edge));this.rows=Math.ceil(count/this.columns);
  if(this.rows*LIMITS.edge>max||count>max)throw Error('This GPU cannot hold the prepared reconstruction pool. Use fewer/shorter videos.');
  this.texture(this.frameTexture,0);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,this.columns*64,this.rows*64,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  const data=new Float32Array(count*3*4);this.slots=new WeakMap();let slot=0;
  for(const clip of members)for(let n=0;n<clip.frames.length;n++,slot++){
   const s=clip.statistics[n],meanY=s.mean[0]*.2126+s.mean[1]*.7152+s.mean[2]*.0722;
   data.set([...s.mean,meanY],slot*4);data.set([...s.min,s.lowY],(count+slot)*4);data.set([...s.max,s.highY],(count*2+slot)*4);this.slots.set(clip.frames[n],{slot,uploaded:false});
  }
  this.texture(this.statsTexture,2);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,count,3,0,gl.RGBA,gl.FLOAT,data);this.members=members;
 }
 // Old v1 assignments did not persist targetRGB. Derive once without rematching
 // or changing source selections, so saved projects remain compatible.
 targetRGB(tile,target,mask){
  if(tile.targetRGB)return tile.targetRGB;let cached=this.targetCache.get(tile);if(cached?.revision===mask.revision&&cached.target===target)return cached.rgb;
  const a=target.getContext('2d',{willReadFrequently:true}).getImageData(tile.x,tile.y,tile.w,tile.h).data,b=mask.context.getImageData(tile.x,tile.y,tile.w,tile.h).data,rgb=[0,0,0];let total=0;
  for(let i=0;i<a.length;i+=4){const weight=a[i+3]*b[i+3];total+=weight;for(let c=0;c<3;c++)rgb[c]+=a[i+c]*weight;}for(let c=0;c<3;c++)rgb[c]=total?rgb[c]/total:0;
  this.targetCache.set(tile,{revision:mask.revision,target,rgb});return rgb;
 }
 renderAt(project,pool,time){
  if(this.gl.isContextLost())throw Error('Reconstruction GPU context was lost. Save the project, then reload and reopen it.');
  this.syncPool(pool);const gl=this.gl,{target,mask,assignments,settings}=project,w=target.width,h=target.height,cols=Math.ceil(w/settings.tileSize),rows=Math.ceil(h/settings.tileSize),key=`${cols}:${rows}`;
  if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}gl.viewport(0,0,w,h);
  if(this.gridKey!==key){this.tileData=new Float32Array(cols*rows*4);this.gridKey=key;}this.tileData.fill(0);
  this.texture(this.frameTexture,0);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  for(const tile of assignments){const clip=pool.clips.get(tile.sourceId);if(!clip)continue;const frame=pool.frame(tile.sourceId,tileSourceTime(tile,time,clip.duration,settings.loopLength)),entry=this.slots.get(frame);if(!entry)continue;
   if(!entry.uploaded){gl.texSubImage2D(gl.TEXTURE_2D,0,(entry.slot%this.columns)*64,Math.floor(entry.slot/this.columns)*64,gl.RGBA,gl.UNSIGNED_BYTE,frame);entry.uploaded=true;this.uploads++;}
   const rgb=this.targetRGB(tile,target,mask),i=(Math.floor(tile.y/settings.tileSize)*cols+Math.floor(tile.x/settings.tileSize))*4;this.tileData[i]=rgb[0]/255;this.tileData[i+1]=rgb[1]/255;this.tileData[i+2]=rgb[2]/255;this.tileData[i+3]=entry.slot+1;
  }
  this.texture(this.tileTexture,1);if(this.textureGridKey!==key){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,cols,rows,0,gl.RGBA,gl.FLOAT,this.tileData);this.textureGridKey=key;}else gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,cols,rows,gl.RGBA,gl.FLOAT,this.tileData);
  this.texture(this.statsTexture,2);gl.useProgram(this.program);for(const [name,unit]of [['frames',0],['tiles',1],['statistics',2]])gl.uniform1i(gl.getUniformLocation(this.program,name),unit);
  gl.uniform2f(gl.getUniformLocation(this.program,'resolution'),w,h);gl.uniform2f(gl.getUniformLocation(this.program,'atlas'),this.columns,this.rows);gl.uniform1f(gl.getUniformLocation(this.program,'tileSize'),settings.tileSize);gl.uniform1f(gl.getUniformLocation(this.program,'colorMatch'),settings.colorMatch);gl.uniform1f(gl.getUniformLocation(this.program,'luminanceMatch'),settings.luminanceMatch);gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);gl.drawArrays(gl.TRIANGLES,0,3);return this.canvas;
 }
 dispose(){const gl=this.gl;for(const texture of [this.frameTexture,this.tileTexture,this.statsTexture])gl.deleteTexture(texture);gl.deleteProgram(this.program);gl.getExtension('WEBGL_lose_context')?.loseContext();this.canvas.width=this.canvas.height=1;}
}
