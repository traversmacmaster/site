import {validateProject,migrateProject} from './core.mjs';
import {unpackProject} from './project-assets.mjs';
const limit=384*1024*1024,magic=new Uint8Array([77,79,83,72,80,65,73,78,84,0,1]),ref='$moshAsset';
const encoder=new TextEncoder();
async function collect(stream){const reader=stream.getReader(),parts=[];let size=0;try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit)throw Error('Project exceeds the 384 MB limit.');parts.push(value);}}finally{await reader.cancel();}return new Uint8Array(await new Blob(parts).arrayBuffer());}
function walk(value,visit){let budget=0;function read(v,depth=0){if(depth>64)throw Error('Project nesting exceeds the safety limit.');v=visit(v);budget+=typeof v==='string'?encoder.encode(JSON.stringify(v)).length:24;if(budget>limit)throw Error('Project exceeds the expanded safety limit.');if(Array.isArray(v))return v.map(x=>read(x,depth+1));if(v&&typeof v==='object'){const out={};for(const [key,x]of Object.entries(v)){budget+=encoder.encode(key).length*2+4;Object.defineProperty(out,key,{value:read(x,depth+1),enumerable:true,writable:true,configurable:true});}return out;}return v;}return read(value);}
export async function encodeBrowserProject(input){
 const project=validateProject(migrateProject(input?.moshpaintTransfer===1?unpackProject(input):input)),assets=[],indices=new Map();
 const packed=walk(project,v=>{if(typeof v!=='string'||!/^data:(image|video)\//.test(v))return v;let i=indices.get(v);if(i===undefined){i=assets.length;indices.set(v,i);assets.push(v);}return {[ref]:i};});
 const payload=encoder.encode(JSON.stringify({container:1,project:packed,assets}));if(payload.length>limit)throw Error('Project exceeds the 384 MB limit.');
 const compressed=await collect(new Blob([payload]).stream().pipeThrough(new CompressionStream('gzip')));
 return new Uint8Array(await new Blob([magic,compressed]).arrayBuffer());
}
export async function decodeBrowserProject(bytes){
 bytes=new Uint8Array(bytes);if(bytes.length>limit)throw Error('Project exceeds the 384 MB limit.');let project;
 if(!magic.slice(0,9).every((v,i)=>bytes[i]===v))project=walk(JSON.parse(new TextDecoder().decode(bytes)),v=>v);
 else{if(!magic.every((v,i)=>bytes[i]===v))throw Error('Unsupported MoshPaint container version.');const raw=await collect(new Blob([bytes.slice(magic.length)]).stream().pipeThrough(new DecompressionStream('gzip'))),envelope=JSON.parse(new TextDecoder().decode(raw));if(envelope.container!==1||!Array.isArray(envelope.assets)||envelope.assets.some(v=>typeof v!=='string'||!/^data:(image|video)\//.test(v)))throw Error('Invalid project asset table.');project=walk(envelope.project,v=>{if(v&&typeof v==='object'&&Object.hasOwn(v,ref)){const i=v[ref];if(Object.keys(v).length!==1||!Number.isInteger(i)||i<0||i>=envelope.assets.length)throw Error('Missing project asset.');return envelope.assets[i];}return v;});}
 return validateProject(migrateProject(project));
}
