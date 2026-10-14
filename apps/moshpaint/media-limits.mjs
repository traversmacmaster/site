export const SOURCE_PIXELS=32*1024*1024,PROJECT_PIXELS=64*1024*1024;
export function checkDimensions(width,height,used=0){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>16384||height>16384||width*height>SOURCE_PIXELS)throw Error('Source exceeds the 32-megapixel / 16,384-pixel dimension safety limit.');
  if(used+width*height>PROJECT_PIXELS)throw Error('Source wells exceed the 64-megapixel decoded-image budget. Remove a source before adding another.');
}
// Read only fixed PNG/GIF headers. Other formats are checked immediately after decode.
export function headerDimensions(bytes){
  const b=bytes,v=new DataView(b.buffer,b.byteOffset,b.byteLength);
  if(b.length>=24&&[137,80,78,71,13,10,26,10].every((n,i)=>b[i]===n)&&String.fromCharCode(...b.subarray(12,16))==='IHDR')return {width:v.getUint32(16),height:v.getUint32(20)};
  if(b.length>=10&&['GIF87a','GIF89a'].includes(String.fromCharCode(...b.subarray(0,6))))return {width:v.getUint16(6,true),height:v.getUint16(8,true)};
  return null;
}
export function preflightDataURL(data,used=0){
  const comma=data.indexOf(',');if(comma<0||!data.slice(0,comma).endsWith(';base64'))return;
  const prefix=atob(data.slice(comma+1,comma+1+64));const dims=headerDimensions(Uint8Array.from(prefix,c=>c.charCodeAt(0)));
  if(dims)checkDimensions(dims.width,dims.height,used);return dims;
}
