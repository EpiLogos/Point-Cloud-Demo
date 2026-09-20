/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import { test } from './harness.ts';
import { migrateConfig, migrateSnapshot, createSnapshot } from '../src/engine/configMigration.ts';
import { DEFAULT_CONFIG } from '../src/engine/PointCloudField.ts';
import { PARAM_REGISTRY, getParamDef } from '../src/engine/paramRegistry.ts';
import { NATIVE_BINDINGS } from '../field-studies-journeys/src/nativeParameters.ts';
import { readPath } from '../src/engine/automation.ts';
import {
  SDF_GRID,
  SDF_EXTENT,
  SDF_DISTANCE_SCALE,
  SDF_ATLAS_ROWS,
  SDF_ATLAS_WIDTH,
  allocateEntitySlot,
  stampCandidateMask,
  chamferSignedDistance,
  buildSdfTile,
  writeSdfTile,
  type SdfCandidate,
} from '../src/engine/sdfField.ts';

const MEDIUM_PARAM_PATHS = [
  'medium.pressure',
  'medium.coupling',
  'medium.persistence',
  'medium.iterations',
  'medium.gridRes',
  'medium.splatGain',
  'medium.extent',
];

const COLLISION_PARAM_PATHS = [
  'collision.restitution',
  'collision.friction',
  'collision.band',
  'collision.strength',
  'collision.integrity',
];

test('collisionSystem: configs without the new sections migrate with medium/collision present but disabled', () => {
  const cfg = migrateConfig({ glyph: ['A', 'B'] });
  assert.ok(cfg.medium, 'medium section must exist after migration');
  assert.equal(cfg.medium!.enabled, false);
  assert.equal(cfg.medium!.pressure, 4);
  assert.equal(cfg.medium!.coupling, 0.8);
  assert.equal(cfg.medium!.persistence, 0.97);
  assert.equal(cfg.medium!.iterations, 4);
  assert.equal(cfg.medium!.gridRes, 192);
  assert.equal(cfg.medium!.splatGain, 1);
  assert.equal(cfg.medium!.extent, 1400);
  assert.equal(cfg.medium!.plane, 'compositionPlane');
  assert.ok(cfg.collision, 'collision section must exist after migration');
  assert.equal(cfg.collision!.enabled, false);
  assert.equal(cfg.collision!.mode, 'obstacle');
  assert.equal(cfg.collision!.restitution, 0.35);
  assert.equal(cfg.collision!.friction, 0.1);
  assert.equal(cfg.collision!.band, 40);
  assert.equal(cfg.collision!.strength, 4);
  assert.equal(cfg.collision!.integrity, 0.5);
});

test('collisionSystem: authored medium/collision survive migration and unknown enum values fall back', () => {
  const cfg = migrateConfig({
    glyph: ['A', 'B'],
    medium: { enabled: true, pressure: 7.5, plane: 'world3d' as const },
    collision: { enabled: true, mode: 'vessel' as const, restitution: 0.6 },
  });
  assert.equal(cfg.medium!.enabled, true);
  assert.equal(cfg.medium!.pressure, 7.5);
  assert.equal(cfg.medium!.plane, 'world3d');
  assert.equal(cfg.medium!.coupling, 0.8, 'untouched fields keep defaults');
  assert.equal(cfg.collision!.enabled, true);
  assert.equal(cfg.collision!.mode, 'vessel');
  assert.equal(cfg.collision!.restitution, 0.6);

  const coerced = migrateConfig({
    glyph: ['A', 'B'],
    medium: { enabled: 'yes' } as any,
    collision: { enabled: 1, mode: 'solid' } as any,
  });
  assert.equal(coerced.medium!.enabled, false, 'enabled is a strict boolean');
  assert.equal(coerced.collision!.enabled, false);
  assert.equal(coerced.collision!.mode, 'obstacle');
  assert.equal(coerced.medium!.plane, 'compositionPlane');
});

test('collisionSystem: medium/collision round-trip through a v5 snapshot', () => {
  const base = migrateConfig({});
  const customized = {
    ...base,
    medium: { ...(base.medium ?? {}), enabled: true, pressure: 9, extent: 2200 },
    collision: { ...(base.collision ?? {}), enabled: true, mode: 'vessel' as const, integrity: 1.5 },
  };
  const snapshot = createSnapshot('collision-roundtrip', customized);
  const back = migrateSnapshot(JSON.parse(JSON.stringify(snapshot)), 0)!;
  assert.deepEqual(back.config.medium, customized.medium);
  assert.deepEqual(back.config.collision, customized.collision);
});

test('collisionSystem: every new registry path resolves and every registry number keeps its native owner', () => {
  for (const path of [...MEDIUM_PARAM_PATHS, ...COLLISION_PARAM_PATHS]) {
    const def = getParamDef(path);
    assert.ok(def, `${path} must be registered`);
    assert.ok(def.min <= def.max && def.hardMin <= def.hardMax, `${path} ranges must be ordered`);
    assert.ok(def.hardMin <= def.min && def.max <= def.hardMax, `${path} soft range inside hard range`);
    // The authored default must be a real number on DEFAULT_CONFIG (binding defaults read it).
    const value = readPath(DEFAULT_CONFIG, path);
    assert.equal(typeof value, 'number', `${path} must default on DEFAULT_CONFIG`);
    assert.ok(Number.isFinite(value), `${path} default must be finite`);
    assert.ok((value as number) >= def.hardMin && (value as number) <= def.hardMax, `${path} default within hard bounds`);
    const binding = NATIVE_BINDINGS.find((b) => b.path === path);
    assert.ok(binding, `${path} must have a native binding`);
    assert.equal(binding.min, def.min, `${path} binding mirrors the soft range (factor 1)`);
    assert.equal(binding.hardMax, def.hardMax, `${path} binding mirrors the hard range`);
    assert.equal(binding.defaultValue, value, `${path} binding default equals the engine default`);
  }
  assert.equal(NATIVE_BINDINGS.length, PARAM_REGISTRY.length, 'one binding per registry entry');
});

test('collisionSystem: entity slots allocate the lowest free row and report exhaustion', () => {
  assert.equal(allocateEntitySlot([]), 0);
  assert.equal(allocateEntitySlot([0, 1, 4]), 2);
  assert.equal(allocateEntitySlot([2, 0, 1]), 3);
  assert.equal(allocateEntitySlot(Array.from({ length: SDF_ATLAS_ROWS }, (_, i) => i)), -1);
});

test('collisionSystem: candidate stamping reproduces a plus-sign mask from the candidate pool', () => {
  // A plus sign in local glyph units: bars of half-width ~3 units crossing at the origin.
  const cands: SdfCandidate[] = [];
  for (let t = -90; t <= 90; t += 3) {
    cands.push({ x: 0, y: t, density: 1 });
    cands.push({ x: t, y: 0, density: 1 });
  }
  const mask = stampCandidateMask(cands, 1);
  const cell = (2 * SDF_EXTENT) / SDF_GRID;
  const toCell = (local: number) => Math.round(local / cell + SDF_GRID / 2);
  assert.equal(mask[toCell(0) * SDF_GRID + toCell(0)], 1, 'centre inside');
  assert.equal(mask[toCell(0) * SDF_GRID + toCell(60)], 1, 'bar interior inside');
  assert.equal(mask[toCell(60) * SDF_GRID + toCell(60)], 0, 'diagonal corner outside');
  assert.equal(mask[toCell(0) * SDF_GRID + toCell(250)], 0, 'beyond the tile extent outside');
});

test('collisionSystem: a plus-sign mask yields negative distances inside strokes and monotone falloff outside', () => {
  const size = 33;
  const mask = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inVertical = x >= 15 && x <= 17 && y >= 4 && y <= 28;
      const inHorizontal = y >= 15 && y <= 17 && x >= 4 && x <= 28;
      if (inVertical || inHorizontal) mask[y * size + x] = 1;
    }
  }
  const d = chamferSignedDistance(mask, size);
  const at = (x: number, y: number) => d[y * size + x];
  assert.ok(at(16, 16) < 0, 'bar crossing is inside');
  assert.ok(at(16, 5) < 0, 'bar arm is inside');
  assert.ok(at(0, 0) > 0, 'far corner is outside');
  // The sign must track the mask everywhere: negative inside, positive outside.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      assert.equal(at(x, y) < 0, mask[y * size + x] > 0.5, `sign mismatch at (${x},${y})`);
    }
  }
  // The bar crossing is the deepest point of the whole shape.
  let minimum = Infinity;
  for (let i = 0; i < d.length; i++) minimum = Math.min(minimum, d[i]);
  assert.equal(at(16, 16), minimum, 'crossing is deeper than the arms');
  // Monotone falloff walking away from the stroke along a row: flat depth inside
  // the uniform bar, then growing outside past the surface.
  let previous = at(16, 16);
  for (let x = 17; x <= 32; x++) {
    assert.ok(at(x, 16) >= previous, `distance must not decrease outward at (${x},16)`);
    previous = at(x, 16);
  }
  assert.ok(at(28, 16) < 0 && at(29, 16) > 0, 'the surface sits exactly at the mask edge');
  assert.ok(at(29, 16) < at(32, 16), 'outside distances grow away from the wall');
});

test('collisionSystem: buildSdfTile encodes R = distance / 100 and G = half-thickness / 100', () => {
  // A dense candidate line (the way glyph pools are sampled) forms a continuous bar.
  const cands: SdfCandidate[] = [];
  for (let t = -60; t <= 60; t += 3) cands.push({ x: t, y: 0, density: 1 });
  const tile = buildSdfTile(cands, 1);
  const cell = (2 * SDF_EXTENT) / SDF_GRID;
  const idx = (lx: number, ly: number) => (Math.round(ly / cell + SDF_GRID / 2) * SDF_GRID + Math.round(lx / cell + SDF_GRID / 2)) * 4;
  const centre = tile[idx(0, 0)];
  assert.ok(centre < 0 && centre > -1, `the bar centre is shallowly inside, got ${centre}`);
  const far = tile[idx(120, 120)];
  assert.ok(far > 0.5, `the far corner is well outside, got ${far}`);
  assert.equal(tile[idx(0, 0) + 3], 1, 'A is 1');
  assert.equal(centre * SDF_DISTANCE_SCALE, centre * 100, 'R is scaled local units');
  // G carries the 3D body thickness. A flat pool (no hz) has none.
  assert.equal(tile[idx(0, 0) + 1], 0, 'G is 0 for a pool with no thickness');
  assert.equal(tile[idx(120, 120) + 1], 0, 'G is 0 outside');

  const empty = buildSdfTile([], 1);
  let minR = Infinity;
  for (let i = 0; i < SDF_GRID * SDF_GRID; i++) minR = Math.min(minR, empty[i * 4]);
  assert.ok(minR > 0, 'an empty candidate pool never produces a boundary');
});

test('collisionSystem: G encodes the 3D body half-thickness so the wall can true a slab', () => {
  // The same bar, now a solid of half-thickness 40 local units. The wall must be
  // able to recover that thickness per cell, which is what turns a 2D silhouette
  // into the boundary of an extruded letterform.
  const cands: SdfCandidate[] = [];
  for (let t = -60; t <= 60; t += 3) cands.push({ x: t, y: 0, density: 1, hz: 40 });
  const tile = buildSdfTile(cands, 1);
  const cell = (2 * SDF_EXTENT) / SDF_GRID;
  const idx = (lx: number, ly: number) => (Math.round(ly / cell + SDF_GRID / 2) * SDF_GRID + Math.round(lx / cell + SDF_GRID / 2)) * 4;
  const g = tile[idx(0, 0) + 1];
  assert.ok(Math.abs(g * SDF_DISTANCE_SCALE - 40) < 1e-6, `G holds the half-thickness in local units, got ${g * SDF_DISTANCE_SCALE}`);
  assert.equal(tile[idx(120, 120) + 1], 0, 'far from the bar there is no body');
  // Scale is applied to the thickness exactly as it is to the stamped coordinates.
  const scaled = buildSdfTile(cands, 0.5);
  assert.ok(Math.abs(scaled[idx(0, 0) + 1] * SDF_DISTANCE_SCALE - 20) < 1e-6, 'G follows the stamp scale');
});

test('collisionSystem: tiles blit into the atlas at the documented slot offsets', () => {
  const atlas = new Float32Array(SDF_ATLAS_WIDTH * (SDF_ATLAS_ROWS * SDF_GRID) * 4);
  const tileA = buildSdfTile([{ x: 0, y: 0, density: 1 }], 1);
  const tileB = buildSdfTile([], 1);
  writeSdfTile(atlas, 3, 0, tileA);
  writeSdfTile(atlas, 3, 1, tileB);
  const rowStart = 3 * SDF_GRID;
  assert.deepEqual(
    atlas.subarray((rowStart * SDF_ATLAS_WIDTH) * 4, (rowStart * SDF_ATLAS_WIDTH) * 4 + 4),
    tileA.subarray(0, 4),
    'A tile lands at column 0 of slot 3'
  );
  const bOffset = ((rowStart + 10) * SDF_ATLAS_WIDTH + SDF_GRID + 10) * 4;
  assert.deepEqual(
    atlas.subarray(bOffset, bOffset + 4),
    tileB.subarray((10 * SDF_GRID + 10) * 4, (10 * SDF_GRID + 10) * 4 + 4),
    'B tile lands at column 1 of slot 3'
  );
});
