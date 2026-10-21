import {territoryPreset} from './live.mjs';
const selectionShader=`uniform sampler2D image;uniform vec2 hueRange,saturationRange,luminanceRange;uniform float tolerance,softness,invert;
vec3 toSrgb(vec3 v){return mix(1.055*pow(max(v,vec3(0)),vec3(1./2.4))-.055,v*12.92,lessThanEqual(v,vec3(.0031308)));}
float coverage(float d,float s){return d<=0.?1.:s==0.?0.:clamp(1.-d/s,0.,1.);}
float distanceToRange(float v,vec2 r){return max(max(r.x-v,v-r.y),0.);}
float hueDistance(float h){
if(hueRange.x==0.&&hueRange.y==360.)return 0.;vec2 r=mod(hueRange,360.);
if(r.x<=r.y?(h>=r.x&&h<=r.y):(h>=r.x||h<=r.y))return 0.;vec2 d=abs(vec2(h)-r);return min(min(d.x,360.-d.x),min(d.y,360.-d.y));}
void main(){vec4 p=texelFetch(image,ivec2(gl_FragCoord.xy),0);if(p.a==0.){result=vec4(0);return;}
vec3 rgb=toSrgb(p.rgb/p.a);float hi=max(max(rgb.r,rgb.g),rgb.b),lo=min(min(rgb.r,rgb.g),rgb.b),delta=hi-lo;
float hue=delta==0.?0.:hi==rgb.r?60.*mod((rgb.g-rgb.b)/delta,6.):hi==rgb.g?60.*((rgb.b-rgb.r)/delta+2.):60.*((rgb.r-rgb.g)/delta+4.);hue=mod(hue+360.,360.);
float saturation=hi==0.?0.:delta/hi,luminance=dot(p.rgb,vec3(.2126,.7152,.0722))/p.a;
bool achromatic=delta<.000001&&!(hueRange.x==0.&&hueRange.y==360.);
float h=achromatic?0.:coverage(hueDistance(hue)-tolerance,softness*30.);
float selected=min(h,min(coverage(distanceToRange(saturation,saturationRange),softness*.25),coverage(distanceToRange(luminance,luminanceRange),softness*.25)));
result=vec4(invert>0.?1.-selected:selected);}`;
const featherShader=`uniform sampler2D image;uniform float radius,horizontal;
void main(){ivec2 at=ivec2(gl_FragCoord.xy),size=textureSize(image,0);float sum=0.;
for(int i=-16;i<=16;i++){if(abs(float(i))>radius)continue;ivec2 offset=horizontal>0.?ivec2(i,0):ivec2(0,i);sum+=texelFetch(image,clamp(at+offset,ivec2(0),size-1),0).r;}
result=vec4(clamp(sum/(radius*2.+1.),0.,1.));}`;
const finishShader=`uniform sampler2D image,history,source;uniform float blend;
void main(){ivec2 at=ivec2(gl_FragCoord.xy);float current=texelFetch(image,at,0).r;
float value=blend==1.?current:mix(texelFetch(history,at,0).r,current,blend);result=vec4(texelFetch(source,at,0).a==0.?0.:clamp(value,0.,1.));}`;

export function createGpuTerritories({device,maxRegions=16,maxPixels=1920*1080}) {
  if(!device?.allocator?.mask||!Number.isInteger(maxRegions)||maxRegions<1||maxRegions>64||!Number.isSafeInteger(maxPixels)||maxPixels<1)throw Error('Invalid GPU territory configuration');
  const {allocator}=device,selectKernel=device.kernel(selectionShader),featherKernel=device.kernel(featherShader),finishKernel=device.kernel(finishShader);
  let disposed=false,busy=false,last,state=new Map(),workspace;
  const clear=()=>{for(const entry of state.values())entry.lease.release();state.clear();workspace?.raw.release();workspace?.scratch?.release();workspace=undefined;last=undefined;};
  return {
    async evaluate(input,values,signal){
      if(disposed||busy)throw Error('GPU territory service unavailable or busy');
      device.assertFrame(input);if(input.width*input.height>maxPixels)throw Error('GPU territory pixel limit exceeded');
      const config=territoryPreset(values).selections;if(config.length>maxRegions)throw Error('GPU territory region limit exceeded');
      signal.throwIfAborted();busy=true;
      const masks=[],next=new Map();let raw,scratch;
      try{
        const continuous=last&&['sourceId','epoch','width','height'].every(key=>last[key]===input[key])&&input.sequence>last.sequence&&input.timestampSeconds>=last.timestampSeconds;
        const dt=continuous?input.timestampSeconds-last.timestampSeconds:0;
        const template=id=>({id,width:input.width,height:input.height,format:'coverage-f32',origin:'top-left',epoch:input.epoch,sequence:input.sequence});
        const reusable=workspace&&workspace.width===input.width&&workspace.height===input.height;
        if(config.length)raw=reusable?allocator.retain(workspace.raw):allocator.mask(template('$selection'));
        for(const s of config){
          signal.throwIfAborted();device.draw(selectKernel,raw.value,{image:input},{hueRange:s.hue,saturationRange:s.saturation,luminanceRange:s.luminance,tolerance:s.tolerance,softness:s.boundarySoftness,invert:s.invert?1:0});
          if(s.feather){scratch??=reusable&&workspace.scratch?allocator.retain(workspace.scratch):allocator.mask(template('$feather'));
            device.draw(featherKernel,scratch.value,{image:raw.value},{radius:s.feather,horizontal:1});
            device.draw(featherKernel,raw.value,{image:scratch.value},{radius:s.feather,horizontal:0});}
          const signature=JSON.stringify(s),previous=continuous?state.get(s.id):undefined;
          const blend=s.smoothingSeconds>0&&previous?.signature===signature?1-Math.exp(-dt/s.smoothingSeconds):1;
          const out=allocator.mask(template(s.id));masks.push(out);
          device.draw(finishKernel,out.value,{image:raw.value,history:previous?.lease.value??raw.value,source:input},{blend});
          if(s.smoothingSeconds>0)next.set(s.id,{signature,lease:allocator.retain(out)});
        }
        signal.throwIfAborted();if(device.unavailable)throw Error('GPU context lost during selection');
        const nextWorkspace=raw?{width:input.width,height:input.height,raw:allocator.retain(raw),scratch:scratch?allocator.retain(scratch):undefined}:undefined;
        workspace?.raw.release();workspace?.scratch?.release();workspace=nextWorkspace;
        for(const entry of state.values())entry.lease.release();state=next;
        last={sourceId:input.sourceId,epoch:input.epoch,width:input.width,height:input.height,sequence:input.sequence,timestampSeconds:input.timestampSeconds};
        return {masks,regionIds:config.map(s=>s.id)};
      }catch(error){for(const lease of masks)lease.release();for(const entry of next.values())entry.lease.release();throw error;}
      finally{raw?.release();scratch?.release();busy=false;}
    },
    routes(assignments){if(disposed||!Array.isArray(assignments)||assignments.length>256||assignments.some(a=>!a||typeof a.regionId!=='string'||!a.regionId||typeof a.nodeId!=='string'||!a.nodeId))throw Error('Invalid territory routes');return assignments.map(({regionId,nodeId})=>Object.freeze({regionId,nodeId}));},
    reset(){if(busy)throw Error('GPU selection busy');clear();},
    dispose(){if(busy)throw Error('GPU selection busy');clear();disposed=true;},
  };
}
