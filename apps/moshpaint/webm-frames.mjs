// Video-only WebM, following https://www.webmproject.org/docs/container/.
// Millisecond cluster timecodes plus DefaultDuration retain the requested cadence.
const concat=parts=>{const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;};
const uint=(value,width=0)=>{let n=BigInt(value),bytes=[];do{bytes.unshift(Number(n&255n));n>>=8n;}while(n);while(bytes.length<width)bytes.unshift(0);return Uint8Array.from(bytes);};
const size=value=>{let width=1;while(BigInt(value)>=(1n<<BigInt(width*7))-1n)width++;return uint(BigInt(value)|(1n<<BigInt(width*7)),width);};
const element=(id,data)=>concat([uint(id),size(data.length),data]);
const number=(id,n,width=0)=>element(id,uint(n,width));
const text=(id,s)=>element(id,new TextEncoder().encode(s));
const master=(id,children)=>element(id,concat(children));
const float=(id,n)=>{const data=new Uint8Array(8);new DataView(data.buffer).setFloat64(0,n);return element(id,data);};
export function muxWebM(packets,{width,height,fps,frames,codec='V_VP8'}){
  if(!packets.length||packets.length!==frames||!packets[0].key)throw Error('Encoder did not deliver every requested video frame.');
  const header=master(0x1a45dfa3,[number(0x4286,1),number(0x42f7,1),number(0x42f2,4),number(0x42f3,8),text(0x4282,'webm'),number(0x4287,2),number(0x4285,2)]);
  const info=master(0x1549a966,[number(0x2ad7b1,1000000),text(0x4d80,'MoshPaint'),text(0x5741,'MoshPaint'),float(0x4489,frames/fps*1000)]);
  const tracks=master(0x1654ae6b,[master(0xae,[number(0xd7,1),number(0x73c5,1),number(0x83,1),number(0x9c,0),text(0x86,codec),number(0x23e383,Math.round(1e9/fps)),master(0xe0,[number(0xb0,width),number(0xba,height)])])]);
  const clusters=[],cues=[];let blocks=[],start=0,offset=0,previous=-1;
  const finishCluster=()=>{if(!blocks.length)return;const cluster=master(0x1f43b675,[number(0xe7,start),...blocks]);clusters.push(cluster);offset+=cluster.length;blocks=[];};
  for(const packet of packets){const time=Math.round(packet.timestamp/1000);if(time<=previous)throw Error('Video timestamps must increase.');previous=time;if(packet.key||time-start>30000){finishCluster();start=time;if(packet.key)cues.push({time,offset});}const relative=time-start;blocks.push(element(0xa3,concat([Uint8Array.of(0x81,(relative>>8)&255,relative&255,packet.key?0x80:0),packet.data])));}
  finishCluster();
  const seek=(id,position)=>master(0x4dbb,[element(0x53ab,uint(id)),number(0x53ac,position,8)]);
  const seekHead=(infoAt,tracksAt,cuesAt)=>master(0x114d9b74,[seek(0x1549a966,infoAt),seek(0x1654ae6b,tracksAt),seek(0x1c53bb6b,cuesAt)]);
  const seekLength=seekHead(0,0,0).length,clusterAt=seekLength+info.length+tracks.length;
  const cueData=master(0x1c53bb6b,cues.map(c=>master(0xbb,[number(0xb3,c.time),master(0xb7,[number(0xf7,1),number(0xf1,clusterAt+c.offset)])])));
  return concat([header,master(0x18538067,[seekHead(seekLength,seekLength+info.length,clusterAt+offset),info,tracks,...clusters,cueData])]);
}

export async function createFrameEncoder(options){
  if(typeof VideoEncoder==='undefined'||typeof VideoFrame==='undefined')return null;
  // VP8 has broad playback support and no out-of-order B frames.
  const config={codec:'vp8',width:options.width,height:options.height,framerate:options.fps,bitrate:Math.max(2000000,Math.min(40000000,Math.round(options.width*options.height*options.fps*.16))),latencyMode:'quality'};
  if(!(await VideoEncoder.isConfigSupported(config)).supported)return null;
  const packets=[];let failure=null,count=0,bytes=0;
  const encoder=new VideoEncoder({output(chunk){const data=new Uint8Array(chunk.byteLength);chunk.copyTo(data);bytes+=data.length;if(bytes>512*1024*1024){failure=Error('Video exceeds the 512 MB browser export budget. Reduce output size or duration.');return;}packets.push({data,timestamp:chunk.timestamp,key:chunk.type==='key'});},error(e){failure=e;}});encoder.configure(config);
  const check=()=>{if(failure)throw failure;if(encoder.state==='closed')throw Error('Export cancelled.');};
  return {async frame(canvas){check();if(count>=options.frames)throw Error('Too many export frames.');const timestamp=Math.round(count*1e6/options.fps),duration=Math.round((count+1)*1e6/options.fps)-timestamp,frame=new VideoFrame(canvas,{timestamp,duration,alpha:'discard'});try{encoder.encode(frame,{keyFrame:count%Math.max(1,Math.round(options.fps*2))===0});count++;}finally{frame.close();}if(encoder.encodeQueueSize>=8)await encoder.flush();check();},async finish(){check();if(count!==options.frames)throw Error('Incomplete video export.');await encoder.flush();check();encoder.close();return muxWebM(packets,{...options,codec:'V_VP8'});},abort(){if(encoder.state!=='closed')encoder.close();packets.length=0;}};
}
