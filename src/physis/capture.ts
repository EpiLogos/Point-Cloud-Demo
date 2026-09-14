import type { PointCloudField } from '../engine/PointCloudField';
import type { PointCloudConfig } from '../engine/types';
import { hexToRgb, hexToRgbaStr, isLightHex } from '../engine/colorPalettes';
// Match the editor's CSS atmosphere in pixels; CSS backgrounds are absent from canvas capture.
function paintBackground(ctx: CanvasRenderingContext2D, w: number, h: number, config: PointCloudConfig) {
  const base=config.backgroundColor || config.color?.backgroundColor || (config.colorMode==='blackOnWhite'?'#fafaf9':'#09090b');
  const mode=config.backgroundMode || config.color?.backgroundMode || 'ambientGlow';
  const intensity=config.backgroundGlowIntensity ?? config.color?.backgroundGlowIntensity ?? 0.45;
  const light=isLightHex(base), [r,g,b]=hexToRgb(base);
  const edge=(factor:number)=>`rgb(${Math.floor(r*factor)},${Math.floor(g*factor)},${Math.floor(b*factor)})`;
  ctx.fillStyle=base;ctx.fillRect(0,0,w,h);
  if(mode==='solid')return;
  ctx.save();ctx.translate(w/2,h/2);
  if(mode==='adaptive')ctx.scale(w*0.75,h*0.7);else {const radius=Math.hypot(w/2,h/2);ctx.scale(radius,radius);}
  const gradient=ctx.createRadialGradient(0,0,0,0,0,1);
  const primary=config.color?.primaryColor || (light?'#3b82f6':'#00f0ff');
  const accent=config.color?.accentColor || (light?'#ec4899':'#ff007f');
  if(mode==='vignette') {gradient.addColorStop(0,base);gradient.addColorStop(light?.35:.25,base);gradient.addColorStop(1,edge(light?.88:.35));}
  else if(mode==='adaptive') {gradient.addColorStop(0,hexToRgbaStr(primary,intensity*(light?.12:.22)));gradient.addColorStop(.4,hexToRgbaStr(accent,intensity*(light?.08:.15)));gradient.addColorStop(.75,base);gradient.addColorStop(1,edge(light?.92:.4));}
  else {gradient.addColorStop(0,hexToRgbaStr(primary,intensity*(light?.15:.28)));gradient.addColorStop(.58,base);gradient.addColorStop(1,edge(light?.9:.3));}
  ctx.fillStyle=gradient;ctx.fillRect(-4,-4,8,8);ctx.restore();
}
function compositor(engine:PointCloudField, transparent=false) {
  const canvas=document.createElement('canvas');canvas.width=engine.canvas.width;canvas.height=engine.canvas.height;
  const ctx=canvas.getContext('2d')!;
  const draw=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);if(!transparent)paintBackground(ctx,canvas.width,canvas.height,engine.config);ctx.drawImage(engine.canvas,0,0,canvas.width,canvas.height);};
  return {canvas,draw};
}
export function captureImage(engine:PointCloudField, transparent=false):Promise<Blob> {
  const {canvas,draw}=compositor(engine,transparent);
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{off();reject(new Error('No rendered frame available'));},5000);
    const off=engine.onFrame(()=>{off();clearTimeout(timer);draw();canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Image encoding failed')),'image/png');});
  });
}
export function recordVideo(engine:PointCloudField, seconds:number) {
  if(typeof MediaRecorder==='undefined')throw new Error('Video recording is unavailable in this browser');
  const mimeType=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
  if(!mimeType)throw new Error('This browser cannot record WebM');
  const {canvas,draw}=compositor(engine);
  const stream=canvas.captureStream(30);
  const recorder=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:12000000});
  const chunks:Blob[]=[];
  const off=engine.onFrame(draw);
  let bytes=0;
  let timer:ReturnType<typeof setTimeout>;
  let failure:Error|null=null;
  const stop=()=>{if(recorder.state!=='inactive')recorder.stop();};
  const result=new Promise<Blob>((resolve,reject)=>{
    recorder.ondataavailable=event=>{if(event.data.size){chunks.push(event.data);bytes+=event.data.size;if(bytes>250*1024*1024){failure=new Error('Recording exceeded 250 MB; choose a shorter duration');stop();}}};
    recorder.onerror=()=>{failure=new Error('Video encoding failed');stop();};
    recorder.onstop=()=>{clearTimeout(timer);off();stream.getTracks().forEach(t=>t.stop());failure?reject(failure):resolve(new Blob(chunks,{type:'video/webm'}));};
  });
  try{recorder.start(1000);}catch(error){off();stream.getTracks().forEach(t=>t.stop());throw error;}
  timer=setTimeout(stop,Math.max(1,Math.min(120,seconds))*1000);
  return {stop,result};
}
