import {useEffect,useRef,useState} from 'react';
import type {PointCloudField} from '../engine/PointCloudField';
import type {PointCloudConfig} from '../engine/types';
import {api,upload,type Scene,type Status} from './api';
import {captureImage,recordVideo} from './capture';
import './studio.css';
export default function StudioTools({engine,config,onLoad,hidden}:{engine:PointCloudField|null;config:PointCloudConfig;onLoad:(config:PointCloudConfig)=>void;hidden:boolean}) {
  const [expanded,setExpanded]=useState(false),[name,setName]=useState('My scene'),[scenes,setScenes]=useState<Scene[]>([]),[media,setMedia]=useState<any[]>([]);
  const [status,setStatus]=useState<Status|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[recording,setRecording]=useState(false);
  const [duration,setDuration]=useState(15),[transparent,setTransparent]=useState(false);
  const stop=useRef<(()=>void)|null>(null);
  const reload=async()=>{const [s,m]=await Promise.all([api<Scene[]>('/api/scenes'),api('/api/media')]);setScenes(s);setMedia(m);};
  useEffect(()=>{void reload().catch(e=>setMessage(e.message));const events=new EventSource('/api/events');events.onmessage=e=>setStatus(JSON.parse(e.data));return()=>{events.close();stop.current?.();};},[]);
  const save=()=>api<Scene>('/api/scenes',{name,config:engine?.config || config,camera:engine?.getCameraState()});
  const action=async(fn:()=>Promise<void>)=>{setBusy(true);setMessage('');try{await fn();await reload();}catch(e){setMessage(e instanceof Error?e.message:String(e));}finally{setBusy(false);setRecording(false);stop.current=null;}};
  const saveScene=()=>action(async()=>{await save();setMessage('Scene saved to your library.');});
  const image=()=>action(async()=>{if(!engine)throw new Error('Renderer is starting');const scene=await save();await upload('images',scene.id,await captureImage(engine,transparent));setMessage('PNG saved to your library.');});
  const video=()=>action(async()=>{if(!engine)throw new Error('Renderer is starting');const scene=await save();const capture=recordVideo(engine,duration);stop.current=capture.stop;setRecording(true);setMessage(`Recording up to ${duration} seconds…`);await upload('videos',scene.id,await capture.result);setMessage('Video saved. It is now available to the screensaver.');});
  const overlay=()=>action(async()=>{const scene=await save();await api('/api/overlay',{sceneId:scene.id,enabled:true});setMessage('Scene sent to the desktop.');});
  return <section className="physis-tools" style={{display:hidden&&!recording?'none':undefined}} aria-label="Physis studio">
    <div className="physis-toolbar">
      <button className="physis-brand" onClick={()=>setExpanded(!expanded)} aria-expanded={expanded}>✧ PHYSIS <span>{expanded?'−':'+'}</span></button>
      <button disabled={busy||!engine} onClick={image} title="Export PNG image">Image</button>
      <button disabled={(busy&&!recording)||!engine} onClick={()=>recording?stop.current?.():video()}>{recording?'Stop':'Record'}</button>
      <button disabled={busy||!engine} onClick={overlay}>To desktop</button>
    </div>
    {expanded&&<div className="physis-panel">
      <label>Scene name<input value={name} onChange={e=>setName(e.target.value)} maxLength={120}/></label>
      <div className="physis-row"><button disabled={busy} onClick={saveScene}>Save scene</button><select aria-label="Load saved scene" value="" disabled={busy} onChange={e=>{const scene=scenes.find(s=>s.id===e.target.value);if(scene){onLoad(scene.config);setName(scene.name);if(scene.camera&&engine){engine.setCameraOrbit(scene.camera.pitch,scene.camera.yaw);engine.setCameraPan(scene.camera.panX,scene.camera.panY);engine.setCameraZoom(scene.camera.zoom);}setMessage(`Loaded ${scene.name}`);}}}><option value="">Load from library…</option>{scenes.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
      <div className="physis-row"><label>Video length<select value={duration} disabled={busy} onChange={e=>setDuration(Number(e.target.value))}>{[5,15,30,60,120].map(n=><option key={n} value={n}>{n} seconds</option>)}</select></label><label className="physis-check"><input type="checkbox" checked={transparent} onChange={e=>setTransparent(e.target.checked)}/>Transparent PNG</label></div>
      <div className="physis-divider"/>
      <div className="physis-row"><strong>Desktop · {status?.error?'error':status?.suspended&&status.enabled?'paused':status?.running?'on':status?.starting?'starting':'off'}</strong><button disabled={busy} onClick={()=>action(async()=>{await api('/api/overlay',{enabled:'toggle'});})}>{status?.enabled?'Turn off':'Turn on'}</button></div>
      <label>Overlay opacity<input aria-label="Overlay opacity" type="range" min="0.05" max="1" step="0.05" value={status?.opacity??.55} onChange={e=>{const opacity=Number(e.target.value);setStatus(s=>s?{...s,opacity}:s);}} onPointerUp={e=>void api('/api/overlay',{opacity:Number(e.currentTarget.value)}).catch(e=>setMessage(e.message))} onKeyUp={e=>void api('/api/overlay',{opacity:Number(e.currentTarget.value)}).catch(e=>setMessage(e.message))}/></label>
      <label>Desktop quality<select value={status?.fps??30} onChange={e=>void api('/api/overlay',Number(e.target.value)===20?{fps:20,particleLimit:50000,pixelRatio:.75}:Number(e.target.value)===30?{fps:30,particleLimit:100000,pixelRatio:1}:{fps:60,particleLimit:200000,pixelRatio:1}).catch(e=>setMessage(e.message))}><option value={20}>Gentle · 20 fps</option><option value={30}>Balanced · 30 fps</option><option value={60}>Fluid · 60 fps</option></select></label>
      {status?.error&&<p role="alert">{status.error}</p>}
      <div className="physis-divider"/>
      <strong>Recent exports</strong>
      <div className="physis-exports">{media.slice(0,8).map(item=><a key={item.id} href={item.url} target="_blank" rel="noreferrer">{item.kind==='images'?'◻ PNG':'▷ Video'} · {item.name}</a>)}{!media.length&&<span>Your images and recordings will appear here.</span>}</div>
      <small className="physis-path">{status?.library}</small>
    </div>}
    {message&&<p className="physis-message" role="status">{message}</p>}
  </section>;
}
