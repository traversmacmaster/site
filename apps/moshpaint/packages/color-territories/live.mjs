// Live selection only. HSV saturation is computed in sRGB; luminance in linear Rec.709.
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const fields = new Set(['id','hue','saturation','luminance','tolerance','boundarySoftness','feather','smoothingSeconds','invert']);
function settings(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k=>!fields.has(k))) throw Error('Invalid territory fields');
  const s = {hue:[0,360],saturation:[0,1],luminance:[0,1],tolerance:0,boundarySoftness:0,feather:0,smoothingSeconds:0,invert:false,...value};
  const range = (v,max,wrap=false) => Array.isArray(v) && v.length===2 && v.every(n=>Number.isFinite(n)&&n>=0&&n<=max) && (wrap||v[0]<=v[1]);
  if (typeof s.id!=='string'||!s.id||s.id.length>128||!range(s.hue,360,true)||!range(s.saturation,1)||!range(s.luminance,1)||
      typeof s.invert!=='boolean'||!Number.isFinite(s.tolerance)||s.tolerance<0||s.tolerance>60||
      !Number.isFinite(s.boundarySoftness)||s.boundarySoftness<0||s.boundarySoftness>1||
      !Number.isInteger(s.feather)||s.feather<0||s.feather>16||!Number.isFinite(s.smoothingSeconds)||s.smoothingSeconds<0||s.smoothingSeconds>2) throw Error('Invalid territory parameters');
  return {...s,hue:[...s.hue],saturation:[...s.saturation],luminance:[...s.luminance]};
}
function selections(values,maxRegions) {
  if(!Array.isArray(values)||values.length>maxRegions)throw Error('Invalid territory count');
  const result=values.map(settings);
  if(new Set(result.map(s=>s.id)).size!==result.length)throw Error('Duplicate territory ID');
  return result;
}
export function territoryPreset(values) {
  return {format:'color-territories',version:1,selections:selections(values,64)};
}
export function restoreTerritoryPreset(preset) {
  if(preset?.format!=='color-territories'||preset.version!==1)throw Error('Unsupported territory preset');
  return selections(preset.selections,64);
}
function validate(input,maxPixels) {
  if(!input||!Number.isSafeInteger(input.width)||!Number.isSafeInteger(input.height)||input.width<1||input.height<1||
      input.width*input.height>maxPixels||input.format!=='linear-srgb-premultiplied-rgba'||input.origin!=='top-left'||
      !Number.isSafeInteger(input.epoch)||input.epoch<0||!Number.isSafeInteger(input.sequence)||input.sequence<0||
      !Number.isFinite(input.timestampSeconds)||typeof input.sourceId!=='string'||!input.sourceId||
      input.storage?.kind!=='cpu'||!(input.storage.data instanceof Float32Array)||input.storage.data.length!==input.width*input.height*4) throw Error('Invalid CPU territory input or pixel limit exceeded');
  const d=input.storage.data;
  for(let i=0;i<d.length;i+=4){const a=d[i+3];if(!Number.isFinite(a)||a<0||a>1)throw Error('Invalid input alpha');
    for(let c=0;c<3;c++)if(!Number.isFinite(d[i+c])||d[i+c]<0||d[i+c]>a)throw Error('Invalid input color');}
}
const srgb = v=>v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055;
const coverage = (distance,softness)=>distance<=0?1:softness===0?0:clamp(1-distance/softness,0,1);
const distanceToRange = (v,range)=>Math.max(range[0]-v,v-range[1],0);
function hueDistance(h,range) {
  if(range[0]===0&&range[1]===360)return 0;
  const a=range[0]%360,b=range[1]%360;
  if(a<=b ? h>=a&&h<=b : h>=a||h<=b)return 0;
  const da=Math.abs(h-a),db=Math.abs(h-b);
  return Math.min(da,360-da,db,360-db);
}
function feather(data,scratch,w,h,r,signal) {
  // Separable box feather, clamped image edges. No unbudgeted image-sized arrays.
  for(let y=0;y<h;y++){
    signal.throwIfAborted();let sum=0;
    for(let dx=-r;dx<=r;dx++)sum+=data[y*w+clamp(dx,0,w-1)];
    for(let x=0;x<w;x++){scratch[y*w+x]=sum/(r*2+1);sum+=data[y*w+clamp(x+r+1,0,w-1)]-data[y*w+clamp(x-r,0,w-1)];}
  }
  for(let x=0;x<w;x++){
    let sum=0;for(let dy=-r;dy<=r;dy++)sum+=scratch[clamp(dy,0,h-1)*w+x];
    for(let y=0;y<h;y++){data[y*w+x]=clamp(sum/(r*2+1),0,1);sum+=scratch[clamp(y+r+1,0,h-1)*w+x]-scratch[clamp(y-r,0,h-1)*w+x];}
  }
}
export function createRangeTerritories({allocator,maxRegions=16,maxPixels=512*512}) {
  if(!allocator?.mask||!Number.isInteger(maxRegions)||maxRegions<1||maxRegions>64||!Number.isSafeInteger(maxPixels)||maxPixels<1)throw Error('Invalid range territory configuration');
  let disposed=false,busy=false,state=new Map(),last;
  const clear=()=>{for(const value of state.values())value.lease.release();state.clear();last=undefined;};
  return {
    async evaluate(input,values,signal) {
      if(disposed||busy)throw Error('Territory service unavailable or busy');
      validate(input,maxPixels);const config=selections(values,maxRegions);signal.throwIfAborted();busy=true;
      const output=[],next=new Map();let scratch;
      try {
        const continuous=last&&last.sourceId===input.sourceId&&last.epoch===input.epoch&&last.width===input.width&&last.height===input.height&&
          input.sequence>last.sequence&&input.timestampSeconds>=last.timestampSeconds;
        const dt=continuous?input.timestampSeconds-last.timestampSeconds:0;
        const template=id=>({id,width:input.width,height:input.height,format:'coverage-f32',origin:'top-left',epoch:input.epoch,sequence:input.sequence});
        for(const s of config){
          signal.throwIfAborted();const lease=allocator.mask(template(s.id));output.push(lease);
          const d=lease.value.storage.data,pixels=input.storage.data;
          for(let y=0;y<input.height;y++){
            signal.throwIfAborted();
            for(let x=0;x<input.width;x++){
              const p=y*input.width+x,i=p*4,a=pixels[i+3];if(a===0)continue;
              const r=srgb(pixels[i]/a),g=srgb(pixels[i+1]/a),b=srgb(pixels[i+2]/a),hi=Math.max(r,g,b),lo=Math.min(r,g,b),delta=hi-lo;
              let hue=delta===0?0:hi===r?60*((g-b)/delta%6):hi===g?60*((b-r)/delta+2):60*((r-g)/delta+4);hue=(hue+360)%360;
              const saturation=hi===0?0:delta/hi,luminance=(.2126*pixels[i]+.7152*pixels[i+1]+.0722*pixels[i+2])/a;
              // Achromatic pixels have no hue; only full-hue selections include them.
              const achromatic=delta<1e-6&&!(s.hue[0]===0&&s.hue[1]===360);
              const h=achromatic?0:coverage(hueDistance(hue,s.hue)-s.tolerance,s.boundarySoftness*30);
              const sat=coverage(distanceToRange(saturation,s.saturation),s.boundarySoftness*.25);
              const lum=coverage(distanceToRange(luminance,s.luminance),s.boundarySoftness*.25);
              const selected=Math.min(h,sat,lum);d[p]=s.invert?1-selected:selected;
            }
          }
          if(s.feather){scratch??=allocator.mask(template('$scratch'));feather(d,scratch.value.storage.data,input.width,input.height,s.feather,signal);}
          const signature=JSON.stringify(s),previous=continuous?state.get(s.id):undefined;
          const blend=s.smoothingSeconds>0&&previous?.signature===signature?1-Math.exp(-dt/s.smoothingSeconds):1;
          for(let p=0;p<d.length;p++){
            if(previous&&blend<1)d[p]=previous.lease.value.storage.data[p]+blend*(d[p]-previous.lease.value.storage.data[p]);
            if(pixels[p*4+3]===0)d[p]=0;
          }
          if(s.smoothingSeconds>0){const history=allocator.mask(template(s.id));history.value.storage.data.set(d);next.set(s.id,{signature,lease:history});}
        }
        signal.throwIfAborted();
        for(const value of state.values())value.lease.release();state=next;
        last={sourceId:input.sourceId,epoch:input.epoch,width:input.width,height:input.height,sequence:input.sequence,timestampSeconds:input.timestampSeconds};
        return {masks:output,regionIds:config.map(s=>s.id)};
      } catch(error){for(const lease of output)lease.release();for(const value of next.values())value.lease.release();throw error;}
      finally{scratch?.release();busy=false;}
    },
    routes(assignments){
      if(disposed||!Array.isArray(assignments)||assignments.length>256||assignments.some(a=>!a||typeof a.regionId!=='string'||!a.regionId||typeof a.nodeId!=='string'||!a.nodeId))throw Error('Invalid territory routes');
      return assignments.map(({regionId,nodeId})=>Object.freeze({regionId,nodeId}));
    },
    reset(){if(busy)throw Error('Selection busy');clear();},
    dispose(){if(busy)throw Error('Selection busy');clear();disposed=true;},
  };
}
