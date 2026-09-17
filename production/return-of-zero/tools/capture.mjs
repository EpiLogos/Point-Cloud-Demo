#!/usr/bin/env node
/** Capture covers for Return-of-Zero Expression artifacts through the real engine.
 *
 *  Usage: node tools/capture.mjs <file.journey.json> [more files...]
 *    --port N          server port (default 47901; each concurrent worker uses its own)
 *    --data-dir DIR    scratch PHYSIS_DATA_DIR (default a mktemp dir; keeps libraries disjoint)
 *    --scene-id ID     capture only the named scene (default: first scene)
 *    --all-scenes      capture every scene (written as <slug>.<scene-id>.png)
 *    --out DIR         output directory (default: the artifact's own directory)
 *    --count N         override particle count for draft inspection passes only
 *
 *  Starts the real app server (node server/index.mjs), loads the expression by injecting
 *  window.__JOURNEY__ (the same path the app's own export/standalone path uses), waits for
 *  the engine, then screenshots. Covers are the artifact's visual evidence, not hand-drawn.
 */
import {createRequire} from 'node:module';
import {execFileSync, spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');

const args = process.argv.slice(2);
const opt = {port: 47901, dataDir: null, sceneId: null, allScenes: false, out: null, count: null, files: []};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port') opt.port = parseInt(args[++i], 10);
  else if (args[i] === '--data-dir') opt.dataDir = args[++i];
  else if (args[i] === '--scene-id') opt.sceneId = args[++i];
  else if (args[i] === '--all-scenes') opt.allScenes = true;
  else if (args[i] === '--out') opt.out = args[++i];
  else if (args[i] === '--count') opt.count = parseInt(args[++i], 10);
  else opt.files.push(args[i]);
}
if (!opt.files.length) { console.error('no artifacts given'); process.exit(2); }
opt.dataDir ??= fs.mkdtempSync(path.join(os.tmpdir(), 'roz-capture-'));

const bundled = path.join(here, '.model.validate.mjs');
if (!fs.existsSync(bundled)) {
  execFileSync(path.join(repo, 'node_modules', '.bin', 'esbuild'), [
    path.join(repo, 'field-studies-journeys/src/model.ts'),
    '--bundle', '--format=esm', '--platform=node', `--outfile=${bundled}`,
  ], {stdio: 'pipe'});
}
const {validateJourney} = await import(bundled);

const server = spawn('node', [path.join(repo, 'server/index.mjs')], {
  env: {...process.env, PHYSIS_PORT: String(opt.port), PHYSIS_DATA_DIR: opt.dataDir, PHYSIS_TEST_MODE: '1'},
  stdio: ['ignore', 'pipe', 'pipe'],
});
const baseUrl = `http://127.0.0.1:${opt.port}`;
async function waitHealthy() {
  for (let i = 0; i < 120; i++) {
    try { const r = await fetch(`${baseUrl}/api/health`); if (r.ok) return; } catch {}
    await new Promise(r => setTimeout(r, 500));
    if (server.exitCode !== null) throw new Error(`server exited early (${server.exitCode})`);
  }
  throw new Error('server did not become healthy');
}
try {
  await waitHealthy();
  const {chromium} = require('playwright-core');
  const executablePath = (() => {
    try { return chromium.executablePath(); } catch { return undefined; }
  })();
  const browser = await (require('playwright-core').chromium.launch({
    executablePath,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  }));
  const page = await browser.newPage({viewport: {width: 1280, height: 800}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  for (const file of opt.files) {
    const abs = path.resolve(file);
    const journey = validateJourney(JSON.parse(fs.readFileSync(abs, 'utf8')));
    if (opt.count) for (const s of journey.scenes) s.field.params.count = opt.count;
    const outDir = opt.out ? path.resolve(opt.out) : path.dirname(abs);
    fs.mkdirSync(outDir, {recursive: true});
    const slug = path.basename(abs).replace(/\.journey\.json$/, '');
    await page.addInitScript(doc => { window.__JOURNEY__ = doc; window.__START_PRESENTATION__ = true; }, journey);
    await page.goto(baseUrl + '/');
    await page.waitForFunction(() => !!(window).__FIELD_STUDIES__?.inspect(), null, {timeout: 120000});
    await page.waitForTimeout(4000); // let the medium settle into its authored state
    const scenes = opt.allScenes ? journey.scenes : journey.scenes.filter(s => s.id === (opt.sceneId ?? journey.scenes[0].id));
    for (const s of scenes) {
      if (opt.allScenes) {
        await page.evaluate(id => { const w = (window).__FIELD_STUDIES__; if (w?.openScene) w.openScene(id); }, s.id);
        await page.waitForTimeout(2500);
      }
      const out = path.join(outDir, opt.allScenes ? `${slug}.${s.id}.png` : `${slug}.cover.png`);
      await page.screenshot({path: out});
      console.log(`CAPTURED ${path.relative(repo, out)}  (${journey.name} / ${s.name})`);
    }
    if (errors.length) { console.error(`page errors while capturing ${slug}:`); for (const e of errors) console.error('  ' + e); }
  }
  await browser.close();
  if (errors.length) process.exit(1);
} finally {
  server.kill('SIGTERM');
}
