// Stage the standalone browser app; commit the resulting apps/moshpaint directory.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const site=path.resolve(import.meta.dirname,'..');
const project=path.resolve(process.argv[2]||path.join(site,'../../MoshPaint-2.0'));
const source=path.join(project,'src'),destination=path.join(site,'apps/moshpaint');
await fs.access(path.join(source,'index.html'));
await fs.mkdir(destination,{recursive:true});
await fs.cp(source,destination,{recursive:true});
const index=path.join(destination,'index.html');
let html=await fs.readFile(index,'utf8');
html=html.replace('</head>','<meta name="robots" content="noindex,follow"><link rel="canonical" href="https://traversmacmaster.com/products/moshpaint/"></head>');
await fs.writeFile(index,html);
async function list(directory,prefix=''){
  const files=[];
  for(const entry of await fs.readdir(directory,{withFileTypes:true})){
    const relative=prefix+entry.name;
    if(entry.isDirectory())files.push(...await list(path.join(directory,entry.name),relative+'/'));
    else files.push(relative);
  }
  return files.sort();
}
const names=await list(source),files=[];
for(const name of names){const bytes=await fs.readFile(path.join(destination,name));files.push({path:name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
const {version}=JSON.parse(await fs.readFile(path.join(project,'package.json'),'utf8'));
await fs.writeFile(path.join(destination,'build-info.json'),JSON.stringify({app:'MoshPaint',version,browserRelease:'living pigment, Color Solidify, camera, Moirefield, depth/forms and timestamped exports',files},null,2)+'\n');
console.log(`Staged ${files.length} MoshPaint browser files in ${destination}`);
