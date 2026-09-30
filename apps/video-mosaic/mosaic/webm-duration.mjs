// MediaRecorder writes streaming WebM without Duration. Add it to Segment Info
// so downloaded recordings expose a finite duration when reopened in browsers.
function element(bytes,offset){const first=bytes[offset];if(!first)throw Error('Invalid EBML header.');let width=1;while(width<=8&&!(first&(128>>(width-1))))width++;let size=BigInt(first&((128>>(width-1))-1));for(let n=1;n<width;n++)size=size*256n+BigInt(bytes[offset+n]);return{width,value:Number(size),unknown:size===(1n<<BigInt(width*7))-1n};}
function item(bytes,offset){const id=element(bytes,offset);if(id.width>4)throw Error('Invalid EBML ID.');let value=0;for(let n=0;n<id.width;n++)value=value*256+bytes[offset+n];const size=element(bytes,offset+id.width),data=offset+id.width+size.width;return{id:value,offset,idWidth:id.width,size,data,end:size.unknown?bytes.length:data+size.value};}
function sizeBytes(value,width){let n=BigInt(value);if(n>=(1n<<BigInt(width*7))-1n)throw Error('EBML size exceeds original header.');n|=1n<<BigInt(width*7);const out=new Uint8Array(width);for(let i=width-1;i>=0;i--){out[i]=Number(n&255n);n>>=8n;}return out;}
export async function finiteWebm(blob,seconds){
 const bytes=new Uint8Array(await blob.arrayBuffer());let segment,info;
 for(let offset=0;offset<bytes.length;){const e=item(bytes,offset);if(e.id===0x18538067){segment=e;break;}offset=e.end;}
 if(!segment)throw Error('Missing WebM Segment.');
 for(let offset=segment.data;offset<segment.end;){const e=item(bytes,offset);if(e.id===0x1549a966){info=e;break;}if(e.id===0x114d9b74)throw Error('Indexed WebM must not be modified.');offset=e.end;}
 if(!info||info.size.unknown)throw Error('Missing finite WebM Info.');let scale=1000000,duration;
 for(let offset=info.data;offset<info.end;){const e=item(bytes,offset);if(e.id===0x2ad7b1){scale=0;for(let n=e.data;n<e.end;n++)scale=scale*256+bytes[n];}if(e.id===0x4489)duration=e;offset=e.end;}
 if(duration){const view=new DataView(bytes.buffer);if(duration.size.value===8)view.setFloat64(duration.data,seconds*1e9/scale);else if(duration.size.value===4)view.setFloat32(duration.data,seconds*1e9/scale);else throw Error('Invalid WebM Duration.');return new Blob([bytes],{type:blob.type});}
 const addition=new Uint8Array(11);addition.set([0x44,0x89,0x88]);new DataView(addition.buffer).setFloat64(3,seconds*1e9/scale);
 const output=new Uint8Array(bytes.length+11);output.set(bytes.subarray(0,info.end));output.set(addition,info.end);output.set(bytes.subarray(info.end),info.end+11);output.set(sizeBytes(info.size.value+11,info.size.width),info.offset+info.idWidth);
 if(!segment.size.unknown)output.set(sizeBytes(segment.size.value+11,segment.size.width),segment.offset+segment.idWidth);
 return new Blob([output],{type:blob.type});
}
