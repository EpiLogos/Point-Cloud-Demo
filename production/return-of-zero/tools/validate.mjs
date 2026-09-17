#!/usr/bin/env node
/** Validate Return-of-Zero Expression artifacts against the real authoring schema.
 *  Usage: node tools/validate.mjs <file.journey.json> [more files...]
 *  Uses the actual field-studies-journeys model (validateJourney), bundled once with esbuild.
 */
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../../..');
const bundled = path.join(here, '.model.validate.mjs');

async function loadModel() {
  if (!fs.existsSync(bundled)) {
    const esbuild = path.join(repo, 'node_modules', '.bin', 'esbuild');
    execFileSync(esbuild, [
      path.join(repo, 'field-studies-journeys/src/model.ts'),
      '--bundle', '--format=esm', '--platform=node', `--outfile=${bundled}`,
    ], {stdio: 'inherit'});
  }
  return import(bundled);
}

const {validateJourney} = await loadModel();
let failed = 0;
for (const arg of process.argv.slice(2)) {
  const file = path.resolve(arg);
  try {
    const j = validateJourney(JSON.parse(fs.readFileSync(file, 'utf8')));
    const scenes = j.scenes.map(s => s.id).join(',');
    console.log(`VALID  ${path.relative(repo, file)}  scenes=${j.scenes.length} [${scenes}]`);
  } catch (e) {
    failed++;
    console.error(`INVALID ${path.relative(repo, file)}: ${e.message}`);
  }
}
if (failed) { console.error(`${failed} invalid artifact(s)`); process.exit(1); }
console.log('all artifacts valid');
