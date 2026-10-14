// Build and stage the GitHub Pages edition, including its local FFmpeg worker/core.
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const site=path.resolve(import.meta.dirname,'..');
const project=path.resolve(process.argv[2]||path.join(site,'../../datamosh-instrument'));
const destination=path.join(site,'apps/auvimosh'),output=path.join(project,'dist-pages');
const run=args=>execFileSync(process.execPath,args,{cwd:project,stdio:'inherit'});
run(['tools/stage_web_assets.mjs']);
run(['node_modules/typescript/bin/tsc']);
run(['node_modules/vite/bin/vite.js','build','--mode','pages','--outDir','dist-pages']);
await fs.mkdir(destination,{recursive:true});
await fs.cp(output,destination,{recursive:true});
const index=path.join(destination,'index.html');
let html=await fs.readFile(index,'utf8');
html=html.replace('</head>','<link rel="icon" href="../../assets/favicon.png"><meta name="robots" content="noindex,follow"><link rel="canonical" href="https://traversmacmaster.com/products/avm/"></head>');
await fs.writeFile(index,html);
await fs.copyFile(path.join(site,'assets/fonts/ibmplexmono-OFL.txt'),path.join(destination,'FONT-LICENSE.txt'));
async function list(directory,prefix=''){
  const files=[];
  for(const entry of await fs.readdir(directory,{withFileTypes:true})){
    const relative=prefix+entry.name;
    if(entry.isDirectory())files.push(...await list(path.join(directory,entry.name),relative+'/'));
    else files.push(relative);
  }
  return files.sort();
}
const names=await list(output),files=[];
for(const name of names){const bytes=await fs.readFile(path.join(destination,name));files.push({path:name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}
const {version}=JSON.parse(await fs.readFile(path.join(project,'package.json'),'utf8'));
await fs.writeFile(path.join(destination,'build-info.json'),JSON.stringify({app:'AuViMosh',version,target:'GitHub Pages / browser',files},null,2)+'\n');
console.log(`Staged ${files.length} AuViMosh browser files in ${destination}`);
