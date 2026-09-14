import express from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {validateJourney} from '../field-studies-journeys/build/model.js';
const exec = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const library = process.env.PHYSIS_DATA_DIR || path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local/share'), 'physis');
const port = Number(process.env.PHYSIS_PORT || 47831);
const app = express();
const wrap = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const atomic = async (file, data) => { const tmp = file + '.' + randomUUID() + '.partial'; try { await fs.writeFile(tmp, data); await fs.rename(tmp, file); } finally { await fs.rm(tmp, {force: true}); } };
for (const dir of ['scenes', 'images', 'videos', 'thumbnails']) await fs.mkdir(path.join(library, dir), { recursive: true });
let state = { enabled: false, sceneId: null, opacity: 0.55, fps: 30, particleLimit: 100000, pixelRatio: 1 };
try { const saved = JSON.parse(await fs.readFile(path.join(library, 'settings.json'), 'utf8')); Object.assign(state, saved, { enabled: false }); } catch {}
let renderer = null, rendererReady = false, error = null, suspended = null, currentScene = null, stopping = false;
const clients = new Map();
const scenePath = id => path.join(library, 'scenes', id + '.json');
const validId = id => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(id);
async function readScene(id) { if (!validId(id)) throw Object.assign(new Error('Invalid scene ID'), {status: 400}); return JSON.parse(await fs.readFile(scenePath(id), 'utf8')); }
if (state.sceneId) { try { currentScene = await readScene(state.sceneId); } catch { state.sceneId = null; } }
function status(includeScene=false) { return { ...state, running: !!renderer && rendererReady, starting: !!renderer && !rendererReady, suspended, error, scene: includeScene?currentScene:currentScene?{id:currentScene.id,name:currentScene.name,version:currentScene.version}:null, library }; }
function broadcast() { for (const [res,includeScene] of clients) res.write(`data: ${JSON.stringify(status(includeScene))}\n\n`); }
async function persist() { await atomic(path.join(library, 'settings.json'), JSON.stringify(state, null, 2)); broadcast(); }
function reconcile() {
  if ((!state.enabled || suspended) && renderer) { const child = renderer; renderer = null; rendererReady = false; child.kill('SIGTERM'); return; }
  if (!state.enabled || suspended || renderer || stopping) return;
  error = null;
  const child = spawn(path.join(root, 'build/physis-overlay'), [`http://127.0.0.1:${port}/render`], { env: { ...process.env, GDK_BACKEND: 'wayland' }, stdio: ['ignore', 'pipe', 'pipe'] });
  renderer = child;
  child.stdout.on('data', data => { process.stdout.write(data); if (data.toString().includes('PHYSIS_ENGINE_READY')) { rendererReady = true; broadcast(); } });
  child.stderr.on('data', data => process.stderr.write(data));
  const failed = message => { if (renderer !== child) return; renderer = null; rendererReady = false; state.enabled = false; error = message; void persist(); };
  child.on('error', err => failed(err.message));
  child.on('exit', (code, signal) => failed(`Renderer stopped (${signal || code})`));
  const watchdog = setTimeout(() => { if (renderer === child && !rendererReady) { failed('Renderer did not initialize WebGL within 20 seconds'); child.kill('SIGTERM'); } }, 20000);
  watchdog.unref(); child.on('exit', () => clearTimeout(watchdog));
}
// Loopback alone is insufficient: reject foreign origins and DNS-rebinding hosts.
app.use((req, res, next) => {
  if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host)) return res.status(403).json({error: 'Invalid host'});
  const origin = req.headers.origin;
  if (origin && ![`http://127.0.0.1:${port}`, `http://localhost:${port}`].includes(origin)) return res.status(403).json({error: 'Invalid origin'});
  if (req.headers['sec-fetch-site'] === 'cross-site') return res.status(403).json({error: 'Cross-site access denied'});
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers['x-physis-client'] !== '1') return res.status(403).json({error: 'Missing Physis client header'});
  next();
});
app.use(express.json({ limit: '32mb' }));
app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'physis', upstreamBranch: 'master', upstreamRevision: '569a9eb' }));
app.get('/api/state', (_req, res) => res.json(status()));
app.get('/api/events', (req, res) => {
  res.set({'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive'}); res.flushHeaders(); const includeScene=req.query.renderer==='1'; clients.set(res,includeScene); res.write(`data: ${JSON.stringify(status(includeScene))}\n\n`);
  const timer = setInterval(() => res.write(': keepalive\n\n'), 15000); req.on('close', () => { clients.delete(res); clearInterval(timer); });
});
app.post('/api/overlay', wrap(async (req, res) => {
  const body = req.body || {};
  const next = {...state};
  const nextScene = body.sceneId !== undefined ? await readScene(body.sceneId) : currentScene;
  if (body.sceneId !== undefined) next.sceneId = nextScene.id;
  for (const [key, min, max] of [['opacity',0.05,1], ['fps',10,60], ['particleLimit',1000,300000], ['pixelRatio',0.5,2]]) {
    if (body[key] !== undefined) { if (!Number.isFinite(body[key]) || body[key] < min || body[key] > max) return res.status(400).json({error: `Invalid ${key}`}); next[key] = body[key]; }
  }
  if (body.enabled === 'toggle') next.enabled = !state.enabled;
  else if (body.enabled !== undefined) { if (typeof body.enabled !== 'boolean') return res.status(400).json({error:'Invalid enabled'}); next.enabled = body.enabled; }
  state = next; currentScene = nextScene;
  await checkDesktop(); reconcile(); await persist(); res.json(status());
}));
app.get('/api/scenes', wrap(async (_req, res) => {
  const names = (await fs.readdir(path.join(library, 'scenes'))).filter(n => n.endsWith('.json'));
  const scenes = await Promise.all(names.map(async n => { try { return JSON.parse(await fs.readFile(path.join(library, 'scenes', n), 'utf8')); } catch { return null; } }));
  res.json(scenes.filter(Boolean).sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
}));
app.post('/api/scenes', wrap(async (req, res) => {
  const {name, config, camera, viewport, expression, sceneIndex = 0} = req.body || {};
  let document = null;
  if (expression !== undefined) {
    try { document = validateJourney(expression); } catch(error) { return res.status(400).json({error:error.message}); }
    if (!Number.isInteger(sceneIndex) || sceneIndex < 0 || sceneIndex >= document.scenes.length) return res.status(400).json({error:'Invalid scene index'});
  } else if (!config || typeof config !== 'object' || Array.isArray(config) || !config.glyph) return res.status(400).json({error:'An expression or legacy configuration is required'});
  if(viewport && (!Number.isFinite(viewport.width)||!Number.isFinite(viewport.height)||viewport.width<=0||viewport.height<=0))return res.status(400).json({error:'Invalid viewport'});
  if(camera && !['yaw','pitch','zoom','panX','panY'].every(k=>Number.isFinite(camera[k])))return res.status(400).json({error:'Invalid camera'});
  const scene = {version:document?2:1, id:randomUUID(), name:String(name || document?.name || 'Untitled scene').slice(0,120), createdAt:new Date().toISOString(), ...(document?{expression:document,sceneIndex}:{config}), camera:camera || null,viewport:viewport || null};
  await atomic(scenePath(scene.id), JSON.stringify(scene,null,2)); res.status(201).json(scene);
}));
app.get('/api/media', wrap(async (_req,res) => {
  const items=[];
  for (const kind of ['images','videos']) for (const name of await fs.readdir(path.join(library,kind))) {
    if (!name.endsWith('.json')) continue;
    try { const item=JSON.parse(await fs.readFile(path.join(library,kind,name),'utf8')); await fs.access(path.join(library,kind,item.filename)); items.push(item); } catch {}
  }
  res.json(items.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));
}));
app.post('/api/media/:kind', express.raw({type:['image/png','video/webm','video/mp4'],limit:'256mb'}), wrap(async (req,res) => {
  const kind=req.params.kind;
  const png=kind==='images' && req.is('image/png'), webm=kind==='videos' && req.is('video/webm'), mp4=kind==='videos' && req.is('video/mp4'), video=webm||mp4;
  if ((!png && !video) || !Buffer.isBuffer(req.body) || req.body.length < 8) return res.status(400).json({error:'Expected PNG, WebM, or MP4'});
  if (png ? !req.body.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : webm ? !req.body.subarray(0,4).equals(Buffer.from([26,69,223,163])) : req.body.subarray(4,8).toString() !== 'ftyp') return res.status(400).json({error:'Invalid media signature'});
  const scene=await readScene(req.query.sceneId);
  let captureSettings=null;
  try { if(req.headers['x-physis-capture'])captureSettings=JSON.parse(decodeURIComponent(req.headers['x-physis-capture'])); } catch {return res.status(400).json({error:'Invalid capture settings'});}
  const id=randomUUID(), filename=`${id}.${png?'png':mp4?'mp4':'webm'}`;
  const item={id,kind,filename,captureSettings,sceneId:scene.id,name:scene.name,createdAt:new Date().toISOString(),url:`/media/${kind}/${filename}`};
  // Publish only complete files. The screensaver enumerates metadata, not partial uploads.
  await atomic(path.join(library,kind,filename),req.body);
  await atomic(path.join(library,kind,id+'.json'),JSON.stringify(item,null,2));
  res.status(201).json(item);
}));
app.use('/media', express.static(library, {dotfiles:'deny', index:false}));
app.get(['/','/index.html'], wrap(async (_req,res) => {const html=await fs.readFile(path.join(root,'dist/index.html'),'utf8');res.type('html').send(html.replace('<head>','<head><meta name="physis-host" content="1">'));}));
app.get('/render', (_req,res) => res.sendFile(path.join(root,'dist/render.html')));
app.use(express.static(path.join(root,'dist')));
app.use((err,_req,res,_next) => { console.error(err.message); res.status(err.status || (err.code==='ENOENT'?404:500)).json({error:err.message}); });
let checking = null;
async function checkDesktop() {
  if (process.env.PHYSIS_TEST_MODE === '1') return;
  if (checking) return checking;
  checking = (async()=> {
    let next = null;
    try {
      const [{stdout:locked},{stdout:windows}] = await Promise.all([
        exec('omarchy-shell',['lock','isLocked'],{timeout:2000}),
        exec('hyprctl',['-j','clients'],{timeout:2000})
      ]);
      if (locked.trim()==='true') next='locked';
      else if (JSON.parse(windows).some(w=>w.class==='org.omarchy.screensaver')) next='screensaver';
    } catch { next='desktop unavailable'; }
    if (next!==suspended) { suspended=next; reconcile(); broadcast(); }
  })().finally(()=>{checking=null;});
  return checking;
}
const poll=setInterval(()=>{if(state.enabled) void checkDesktop();},2000);
const server=app.listen(port,'127.0.0.1',()=>console.log(`Physis ready at http://127.0.0.1:${port}; library: ${library}`));
server.on('error',err=>{console.error(err.message);process.exit(1);});
for (const signal of ['SIGTERM','SIGINT']) process.on(signal,()=>{stopping=true;clearInterval(poll);if(renderer)renderer.kill('SIGTERM');for(const res of clients.keys())res.end();server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),2000).unref();});
