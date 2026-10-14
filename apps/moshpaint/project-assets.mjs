// Shared compact transport: source data and captured frames cross IPC only once.
// References are used only at known media positions, never interpreted in user text/metadata.
export function packProject(project){
  const assets=[],index=new Map();
  const asset=value=>{if(typeof value!=='string')throw Error('Invalid project media.');let i=index.get(value);if(i===undefined){i=assets.length;index.set(value,i);assets.push(value);}return i;};
  const operation=op=>op.kind==='place'?{...op,image:asset(op.image)}:op.kind==='living-fill'?{...op,mask:asset(op.mask)}:op.kind==='living-control'?{...op,items:op.items.map(item=>({...item,image:asset(item.image)}))}:op.kind==='stroke'?{...op,frames:op.frames.map(asset)}:op.kind==='selection'&&op.action==='time'?{...op,strokes:op.strokes.map(operation)}:op;
  return {moshpaintTransfer:1,project:{...project,sources:project.sources.map(s=>({...s,data:asset(s.data)})),operations:project.operations.map(operation)},assets};
}
export function unpackProject(transfer){
  if(!transfer||transfer.moshpaintTransfer!==1||!Array.isArray(transfer.assets)||transfer.assets.some(a=>typeof a!=='string'))throw Error('Invalid project transfer.');
  const asset=i=>{if(!Number.isInteger(i)||i<0||i>=transfer.assets.length)throw Error('Missing project transfer asset.');return transfer.assets[i];};
  const operation=(op,depth=0)=>{if(depth>1)throw Error('Nested temporal selections are not supported.');return op.kind==='place'?{...op,image:asset(op.image)}:op.kind==='living-fill'?{...op,mask:asset(op.mask)}:op.kind==='living-control'?{...op,items:op.items.map(item=>({...item,image:asset(item.image)}))}:op.kind==='stroke'?{...op,frames:op.frames.map(asset)}:op.kind==='selection'&&op.action==='time'?{...op,strokes:op.strokes.map(s=>operation(s,depth+1))}:op;};
  const p=transfer.project;
  return {...p,sources:p.sources.map(s=>({...s,data:asset(s.data)})),operations:p.operations.map(op=>operation(op))};
}
