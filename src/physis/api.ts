import type { PointCloudConfig, CameraOrbState } from '../engine/types';
export interface Scene { version: number; id: string; name: string; createdAt: string; config: PointCloudConfig; camera?: CameraOrbState; }
export interface Status { enabled: boolean; running: boolean; starting: boolean; suspended: string | null; error: string | null; sceneId: string | null; scene: Scene | null; opacity: number; fps: number; particleLimit: number; pixelRatio: number; library: string; }
export async function api<T = any>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, body === undefined ? {} : {method:'POST', headers:{'Content-Type':'application/json','X-Physis-Client':'1'}, body:JSON.stringify(body)});
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || response.statusText);
  return result;
}
export async function upload(kind: 'images' | 'videos', sceneId: string, blob: Blob) {
  const response = await fetch(`/api/media/${kind}?sceneId=${encodeURIComponent(sceneId)}`, {method:'POST',headers:{'Content-Type':kind==='images'?'image/png':'video/webm','X-Physis-Client':'1'},body:blob});
  const result = await response.json(); if (!response.ok) throw new Error(result.error); return result;
}
