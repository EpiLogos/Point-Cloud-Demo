#!/usr/bin/env node
/**
 * Extracts saved point-cloud snapshots from Zen / Firefox localStorage (LSNG sqlite stores)
 * and writes them to snapshots-export.json for import via File ▸ Import Snapshot Library.
 *
 *   node scripts/extract-zen-snapshots.mjs [profileRoot] [outFile]
 *
 * Defaults: ~/Library/Application Support/zen/Profiles  →  ./snapshots-export.json
 * Requires the `sqlite3` CLI (ships with macOS). Zen can stay open: the store is copied first.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, copyFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir, homedir } from 'node:os';

const KEY = 'typographic_pointcloud_saved_states';
const root = process.argv[2] || join(homedir(), 'Library/Application Support/zen/Profiles');
const out = process.argv[3] || 'snapshots-export.json';

function walk(dir, depth = 0, acc = []) {
  if (depth > 7) return acc;
  let entries = [];
  try { entries = readdirSync(dir); } catch { return acc; }
  for (const e of entries) {
    const p = join(dir, e);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) walk(p, depth + 1, acc);
    else if (e === 'data.sqlite' && p.includes('/ls/')) acc.push(p);
  }
  return acc;
}

// Minimal Snappy (raw block format) decompressor
function snappyUncompress(buf) {
  let pos = 0, len = 0, shift = 0;
  for (;;) { const b = buf[pos++]; len |= (b & 0x7f) << shift; if (!(b & 0x80)) break; shift += 7; }
  const outBuf = Buffer.alloc(len); let op = 0;
  while (pos < buf.length) {
    const tag = buf[pos++]; const type = tag & 3;
    if (type === 0) {
      let l = (tag >> 2) + 1;
      if (l > 60) { const n = l - 60; l = 0; for (let i = 0; i < n; i++) l |= buf[pos + i] << (8 * i); l += 1; pos += n; }
      buf.copy(outBuf, op, pos, pos + l); op += l; pos += l;
    } else {
      let l, off;
      if (type === 1) { l = ((tag >> 2) & 7) + 4; off = ((tag >> 5) << 8) | buf[pos++]; }
      else if (type === 2) { l = (tag >> 2) + 1; off = buf[pos] | (buf[pos + 1] << 8); pos += 2; }
      else { l = (tag >> 2) + 1; off = buf.readUInt32LE(pos); pos += 4; }
      for (let i = 0; i < l; i++) { outBuf[op] = outBuf[op - off]; op++; }
    }
  }
  return outBuf;
}

function decodeValue(hex, compression) {
  let buf = Buffer.from(hex, 'hex');
  if (compression === 1) buf = snappyUncompress(buf);
  let text = buf.toString('utf8');
  if (!/^\s*[\[{]/.test(text)) text = buf.toString('utf16le');
  return text;
}

const stores = walk(root);
if (stores.length === 0) { console.error('No localStorage stores found under', root); process.exit(1); }

const tmp = mkdtempSync(join(tmpdir(), 'zen-ls-'));
const found = [];
for (const store of stores) {
  const copy = join(tmp, 'copy-' + found.length + '.sqlite');
  try { copyFileSync(store, copy); } catch { continue; }
  let rows;
  try {
    const json = execFileSync('sqlite3', ['-json', copy, `select key, compression_type as c, hex(value) as v from data where key='${KEY}';`], { encoding: 'utf8' });
    rows = json.trim() ? JSON.parse(json) : [];
  } catch (e) { continue; }
  for (const r of rows) {
    try {
      const text = decodeValue(r.v, Number(r.c));
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed) ? parsed : [];
      const origin = store.split('/storage/default/')[1]?.split('/')[0] ?? store;
      console.log(`✓ ${list.length} snapshot(s) in ${origin}`);
      for (const s of list) found.push({ ...s, _origin: origin });
    } catch (e) { console.warn('Could not decode a store:', store, e.message); }
  }
}

// De-duplicate by id (keep the newest timestamp)
const byId = new Map();
for (const s of found) { const prev = byId.get(s.id); if (!prev || (s.timestamp || 0) > (prev.timestamp || 0)) byId.set(s.id, s); }
const result = Array.from(byId.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
writeFileSync(out, JSON.stringify(result, null, 2));
console.log(`\nWrote ${result.length} snapshot(s) to ${out}. Import them with File ▸ Import Snapshot Library…`);
