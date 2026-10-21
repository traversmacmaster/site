// Shared WebGL2 device, texture leases, conversion and composition. No host/UI imports.
const vertex=`#version 300 es
void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0.,1.);}`;
const header=`#version 300 es
precision highp float;precision highp int;
out vec4 result;
`;
export const LINEAR_TO_SRGB=`vec3 toSrgb(vec3 v){return mix(1.055*pow(max(v,vec3(0)),vec3(1./2.4))-.055,v*12.92,lessThanEqual(v,vec3(.0031308)));}`;
const copyShader=`uniform sampler2D image;void main(){result=texelFetch(image,ivec2(gl_FragCoord.xy),0);}`;
const uploadShader=`uniform sampler2D image;
vec3 toLinear(vec3 v){return mix(pow((v+.055)/1.055,vec3(2.4)),v/12.92,lessThanEqual(v,vec3(.04045)));}
void main(){vec4 p=texelFetch(image,ivec2(gl_FragCoord.xy),0);result=vec4(toLinear(p.rgb)*p.a,p.a);}`;
const composeShader=`uniform sampler2D base,processed,mask;uniform float wet,hasMask,blend;
void main(){ivec2 p=ivec2(gl_FragCoord.xy);vec4 b=texelFetch(base,p,0),s=texelFetch(processed,p,0),c=s;
if(blend>0.){vec3 cb=b.a>0.?b.rgb/b.a:vec3(0),cs=s.a>0.?s.rgb/s.a:vec3(0);
vec3 mixed=blend==1.?cb*cs:cb+cs-cb*cs;c=vec4((1.-s.a)*b.rgb+(1.-b.a)*s.rgb+b.a*s.a*mixed,s.a+b.a*(1.-s.a));}
float a=wet*(hasMask>0.?texelFetch(mask,p,0).r:1.);result=a==0.?b:b+a*(c-b);}`;
const presentShader=`uniform sampler2D image;uniform float maskView,premultiplyCanvas;${LINEAR_TO_SRGB}
void main(){ivec2 size=textureSize(image,0);ivec2 p=ivec2(int(gl_FragCoord.x),size.y-1-int(gl_FragCoord.y));vec4 v=texelFetch(image,p,0);
result=maskView>0.?vec4(vec3(v.r),1.):vec4(toSrgb(v.a>0.?v.rgb/v.a:vec3(0))*mix(1.,v.a,premultiplyCanvas),v.a);}`;

export function createWebGLDevice({gl,deviceId,byteLimit=64*1024*1024,maxPixels=1920*1080,maxKernels=64}) {
  if(!gl?.texStorage2D||typeof deviceId!=='string'||!deviceId||!Number.isSafeInteger(byteLimit)||byteLimit<1||!Number.isSafeInteger(maxPixels)||maxPixels<1)throw Error('Invalid WebGL2 device configuration');
  if(!gl.getExtension('EXT_color_buffer_float'))throw Error('WebGL2 floating-point render targets unavailable');
  if(!Number.isInteger(maxKernels)||maxKernels<1||maxKernels>256)throw Error('Invalid GPU kernel limit');
  let disposed=false,lost=false,used=0,peak=0;
  const resources=new Map(),leases=new Set(),programs=new Map();
  const framebuffer=gl.createFramebuffer(),vao=gl.createVertexArray();
  const onLost=event=>{event.preventDefault();lost=true;dispose();};
  gl.canvas.addEventListener('webglcontextlost',onLost);
  function available(){if(disposed||lost||gl.isContextLost())throw Error('WebGL device unavailable; recreate after context restoration');}
  function shape(value){
    if(!value||!Number.isSafeInteger(value.width)||!Number.isSafeInteger(value.height)||value.width<1||value.height<1||value.width*value.height>maxPixels||
      value.width>gl.getParameter(gl.MAX_TEXTURE_SIZE)||value.height>gl.getParameter(gl.MAX_TEXTURE_SIZE))throw Error('Invalid GPU dimensions or pixel limit');
  }
  function metadata(value){shape(value);if(value.origin!=='top-left'||!Number.isSafeInteger(value.epoch)||value.epoch<0||!Number.isSafeInteger(value.sequence)||value.sequence<0)throw Error('Invalid GPU metadata');}
  function reference(record,value){
    record.refs++;let released=false;
    const lease={get value(){if(released||record.dead)throw Error('GPU lease released');return value;},release(){
      if(released)return;released=true;leases.delete(lease);record.refs--;
      if(record.refs===0&&!record.dead){record.dead=true;gl.deleteTexture(record.texture);resources.delete(record.texture);used-=record.bytes;}
    }};leases.add(lease);return lease;
  }
  function allocate(template,kind){
    available();metadata(template);
    const bytes=template.width*template.height*(['frame','vector-field'].includes(kind)?16:4);
    if(bytes>byteLimit-used)throw Error('GPU texture byte budget exceeded');
    const texture=gl.createTexture();if(!texture)throw Error('GPU texture allocation failed');
    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texStorage2D(gl.TEXTURE_2D,1,['mask','scalar-field'].includes(kind)?gl.R32F:['frame','vector-field'].includes(kind)?gl.RGBA32F:gl.RGBA8,template.width,template.height);
    if(gl.getError()!==gl.NO_ERROR){gl.deleteTexture(texture);throw Error('GPU texture storage allocation failed');}
    const record={texture,bytes,refs:0,dead:false,width:template.width,height:template.height,kind};
    resources.set(texture,record);used+=bytes;peak=Math.max(peak,used);
    return reference(record,Object.freeze({...template,storage:Object.freeze({kind:'gpu',deviceId,handle:texture})}));
  }
  function assertSurface(value,kind){
    available();metadata(value);
    const record=resources.get(value.storage?.handle);
    if(value.storage?.kind!=='gpu'||value.storage.deviceId!==deviceId||!record||record.dead||record.kind!==kind||record.width!==value.width||record.height!==value.height)throw Error('Foreign, released or incompatible GPU surface');
    if(kind==='frame'&&(value.format!=='linear-srgb-premultiplied-rgba'||typeof value.sourceId!=='string'||!value.sourceId||!Number.isFinite(value.timestampSeconds)))throw Error('Invalid GPU frame');
    if(kind==='mask'&&(value.format!=='coverage-f32'||typeof value.id!=='string'||!value.id))throw Error('Invalid GPU mask');
    return value;
  }
  function kernel(fragment){
    available();if(programs.has(fragment))return programs.get(fragment);
    if(programs.size>=maxKernels)throw Error('GPU kernel limit exceeded');
    const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const log=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw Error(log);}return shader;};
    let vs,fs,program;
    try{vs=compile(gl.VERTEX_SHADER,vertex);fs=compile(gl.FRAGMENT_SHADER,header+fragment);program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));programs.set(fragment,program);return program;
    }catch(error){if(program)gl.deleteProgram(program);throw error;}finally{if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs);}
  }
  function draw(program,target,textures={},uniforms={},region){
    available();if(![...programs.values()].includes(program))throw Error('Foreign GPU kernel');
    gl.bindVertexArray(vao);gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);gl.disable(gl.SCISSOR_TEST);gl.colorMask(true,true,true,true);gl.useProgram(program);
    if(target){
      const record=resources.get(target.storage?.handle);if(!record||record.dead||target.storage.deviceId!==deviceId)throw Error('Foreign GPU target');
      if(Object.values(textures).some(t=>t.storage?.handle===target.storage.handle))throw Error('GPU read/write feedback hazard');
      gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,target.storage.handle,0);
      if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Incomplete GPU target');gl.viewport(0,0,target.width,target.height);
      if(region){const {x,y,width,height}=region;if(![x,y,width,height].every(Number.isSafeInteger)||x<0||y<0||width<1||height<1||x+width>target.width||y+height>target.height)throw Error('Invalid GPU draw region');gl.enable(gl.SCISSOR_TEST);gl.scissor(x,y,width,height);}
    }else{gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,gl.canvas.width,gl.canvas.height);}
    let unit=0;
    for(const [name,value] of Object.entries(textures)){
      if(value.storage?.deviceId!==deviceId||!resources.has(value.storage.handle))throw Error('Foreign GPU input');
      gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,value.storage.handle);gl.uniform1i(gl.getUniformLocation(program,name),unit++);
    }
    for(const [name,value] of Object.entries(uniforms)){
      const loc=gl.getUniformLocation(program,name);
      if(Array.isArray(value)){if(value.length===2)gl.uniform2fv(loc,value);else if(value.length===3)gl.uniform3fv(loc,value);else if(value.length===4)gl.uniform4fv(loc,value);else throw Error('Unsupported GPU uniform');}
      else gl.uniform1f(loc,value);
    }
    gl.drawArrays(gl.TRIANGLES,0,3);if(gl.getError()!==gl.NO_ERROR)throw Error('GPU pass failed');
  }
  const allocator={byteLimit,get bytesUsed(){return used;},get peakBytes(){return peak;},
    frame(template){assertSurface(template,'frame');return allocate(template,'frame');},
    emptyFrame(template){if(template.format!=='linear-srgb-premultiplied-rgba'||typeof template.sourceId!=='string'||!Number.isFinite(template.timestampSeconds))throw Error('Invalid GPU frame template');return allocate(template,'frame');},
    mask(template){if(template.format!=='coverage-f32'||typeof template.id!=='string'||!template.id)throw Error('Invalid GPU mask template');return allocate(template,'mask');},
    field(template){if(!['scalar-f32','vector4-f32'].includes(template.format)||typeof template.id!=='string'||!template.id||typeof template.units!=='string'||!template.units||typeof template.sourceId!=='string'||!Number.isFinite(template.timestampSeconds))throw Error('Invalid GPU field template');return allocate(template,template.format==='scalar-f32'?'scalar-field':'vector-field');},
    retain(lease){const value=lease.value,record=resources.get(value.storage?.handle);if(!record||value.storage.deviceId!==deviceId)throw Error('Foreign GPU lease');return reference(record,value);},
    copy(value){assertSurface(value,'frame');const out=allocate(value,'frame');try{draw(kernel(copyShader),out.value,{image:value});return out;}catch(error){out.release();throw error;}},
    dispose,
  };
  function uploadSrgb(source,template){
    available();shape(template);
    const raw=allocate({...template,format:'srgb-rgba8'},'raw');let output;
    try{
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,raw.value.storage.handle);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
      gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,source);
      if(gl.getError()!==gl.NO_ERROR)throw Error('GPU media upload failed; supply a canvas at working resolution');
      output=allocator.emptyFrame(template);draw(kernel(uploadShader),output.value,{image:raw.value});return output;
    }catch(error){output?.release();throw error;}finally{raw.release();}
  }
  function uploadFrame(value){
    metadata(value);if(value.storage?.kind!=='cpu'||!(value.storage.data instanceof Float32Array)||value.storage.data.length!==value.width*value.height*4)throw Error('Explicit CPU upload requires float RGBA');
    for(let i=0;i<value.storage.data.length;i+=4){const d=value.storage.data,a=d[i+3];if(!Number.isFinite(a)||a<0||a>1||[d[i],d[i+1],d[i+2]].some(v=>!Number.isFinite(v)||v<0||v>a))throw Error('Invalid CPU upload pixels');}
    const lease=allocator.emptyFrame(value);try{gl.bindTexture(gl.TEXTURE_2D,lease.value.storage.handle);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,value.width,value.height,gl.RGBA,gl.FLOAT,value.storage.data);if(gl.getError()!==gl.NO_ERROR)throw Error('GPU float upload failed');return lease;}catch(error){lease.release();throw error;}
  }
  function composite(base,processed,{mask,wet=1,blend='normal'}={}){
    assertSurface(base,'frame');assertSurface(processed,'frame');
    if(!Number.isFinite(wet)||wet<0||wet>1||!['normal','multiply','screen'].includes(blend))throw Error('Invalid GPU composition controls');
    for(const key of ['width','height','epoch','sequence','sourceId','timestampSeconds'])if(base[key]!==processed[key])throw Error('GPU output frame mismatch');
    if(mask){assertSurface(mask,'mask');for(const key of ['width','height','epoch','sequence'])if(mask[key]!==base[key])throw Error('Stale GPU coverage mask');}
    const output=allocator.frame(base);try{draw(kernel(composeShader),output.value,{base,processed,mask:mask??base},{wet,hasMask:mask?1:0,blend:['normal','multiply','screen'].indexOf(blend)});return output;}catch(error){output.release();throw error;}
  }
  function present(value){
    assertSurface(value,value.format==='coverage-f32'?'mask':'frame');
    if(gl.canvas.width!==value.width||gl.canvas.height!==value.height){gl.canvas.width=value.width;gl.canvas.height=value.height;}
    draw(kernel(presentShader),null,{image:value},{maskView:value.format==='coverage-f32'?1:0,premultiplyCanvas:gl.getContextAttributes().premultipliedAlpha?1:0});return gl.canvas;
  }
  function read(value,destination,region){
    const kind=value.format==='coverage-f32'?'mask':value.format==='scalar-f32'?'scalar-field':value.format==='vector4-f32'?'vector-field':'frame';
    assertSurface(value,kind);
    gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,value.storage.handle,0);
    const area=region??{x:0,y:0,width:value.width,height:value.height};
    if(![area.x,area.y,area.width,area.height].every(Number.isSafeInteger)||area.x<0||area.y<0||area.width<1||area.height<1||area.x+area.width>value.width||area.y+area.height>value.height)throw Error('Invalid GPU readback region');
    const isMask=['mask','scalar-field'].includes(kind),length=area.width*area.height*(isMask?1:4),data=destination??new Float32Array(length);
    if(!(data instanceof Float32Array)||data.length!==length)throw Error('Invalid GPU readback destination');
    gl.readPixels(area.x,area.y,area.width,area.height,isMask?gl.RED:gl.RGBA,gl.FLOAT,data);
    if(gl.getError()!==gl.NO_ERROR)throw Error('Explicit GPU readback failed');return data;
  }
  function dispose(){
    if(disposed)return;disposed=true;
    for(const lease of [...leases])lease.release();
    for(const program of programs.values())gl.deleteProgram(program);programs.clear();gl.deleteFramebuffer(framebuffer);gl.deleteVertexArray(vao);
    gl.canvas.removeEventListener('webglcontextlost',onLost);
  }
  return {version:1,deviceId,gl,allocator,kernel,draw,uploadSrgb,uploadFrame,composite,present,read,
    assertFrame:value=>assertSurface(value,'frame'),assertMask:value=>assertSurface(value,'mask'),dispose,
    assertField:value=>assertSurface(value,value.format==='vector4-f32'?'vector-field':'scalar-field'),
    get unavailable(){return disposed||lost||gl.isContextLost();}};
}
