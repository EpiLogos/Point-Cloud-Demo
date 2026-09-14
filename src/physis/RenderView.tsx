import { useLayoutEffect, useRef } from 'react';
import { PointCloudField, DEFAULT_CONFIG } from '../engine/PointCloudField';
import type { Status } from './api';
export default function RenderView() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    document.documentElement.style.background = 'transparent';
    document.body.style.background = 'transparent';
    let engine: PointCloudField | null = null;
    let sceneId: string | null | undefined;
    let limit = 0;
    canvas.current!.dataset.phase = 'connecting';
    const events = new EventSource('/api/events');
    events.onopen = () => { if(canvas.current) canvas.current.dataset.phase = 'connected'; };
    events.onerror = () => { if(canvas.current) canvas.current.dataset.phase = 'connection-error'; };
    events.onmessage = event => {
      try {
        canvas.current!.dataset.phase = 'initializing';
        const state: Status = JSON.parse(event.data);
        const config = state.scene?.config || DEFAULT_CONFIG;
        if (!engine || sceneId !== state.sceneId || limit !== state.particleLimit) {
          engine?.destroy();
          engine = new PointCloudField(canvas.current!, {...config, particleCount:Math.min(config.particleCount || 100000,state.particleLimit),interaction:{...config.interaction,strength:0}});
          sceneId = state.sceneId; limit = state.particleLimit;
          const camera = state.scene?.camera;
          if (camera) { engine.setCameraOrbit(camera.pitch, camera.yaw); engine.setCameraPan(camera.panX,camera.panY); engine.setCameraZoom(camera.zoom); }
          canvas.current!.dataset.phase = 'initialized';
          console.log('PHYSIS_ENGINE_INITIALIZED');
          let ready = false;
          engine.onFrame(() => { if(!ready) { ready=true; canvas.current!.dataset.phase = 'rendering'; console.log('PHYSIS_ENGINE_READY'); window.dispatchEvent(new Event('physis-ready')); } });
        }
        engine.setQuality(state.fps,state.pixelRatio);
        canvas.current!.style.opacity=String(state.opacity);
      } catch(error) { canvas.current!.dataset.phase = 'error: '+String(error); console.error('Physis renderer:',error); }
    };
    return () => {events.close();engine?.destroy();};
  },[]);
  return <canvas ref={canvas} style={{position:'fixed',inset:0,width:'100vw',height:'100vh',background:'transparent',pointerEvents:'none'}} />;
}
