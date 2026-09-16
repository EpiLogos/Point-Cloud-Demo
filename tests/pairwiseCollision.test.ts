/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import { test } from './harness.ts';
import { migrateConfig, migrateSnapshot, createSnapshot } from '../src/engine/configMigration.ts';
import { DEFAULT_CONFIG, DEFAULT_PAIRWISE_CONFIG } from '../src/engine/PointCloudField.ts';
import { PARAM_REGISTRY, getParamDef, PARAM_GROUPS } from '../src/engine/paramRegistry.ts';
import {
  bitonicSchedule,
  cellCenter,
  cellGridDims,
  cellKeyToCoords,
  compareExchangePass,
  executeSortSchedule,
  nextPowerOfTwo,
  PAIRWISE_MAX_CELLS_PER_SIDE,
  PAIRWISE_MAX_PARTICLES,
  PAIRWISE_MAX_SORT_SIDE,
  sortSideForParticleTexSide,
  worldToCell,
} from '../src/engine/pairwiseSchedule.ts';

// ---------------------------------------------------------------- migration

test('pairwise migration: an old config without the section gains disabled defaults', () => {
  const migrated = migrateConfig({ glyph: 'O', particleCount: 4096 });
  assert.ok(migrated.pairwise, 'pairwise section must be present after migration');
  assert.equal(migrated.pairwise!.enabled, false);
  assert.deepEqual(migrated.pairwise, { ...DEFAULT_PAIRWISE_CONFIG, enabled: false });
  assert.equal(migrated.pairwise!.radius, 2.2);
  assert.equal(migrated.pairwise!.stiffness, 1);
  assert.equal(migrated.pairwise!.restitution, 0.12);
  assert.equal(migrated.pairwise!.viscosity, 0.06);
  assert.equal(migrated.pairwise!.extent, 1400);
});

test('pairwise migration: explicit values survive and enabled is coerced to a real boolean', () => {
  const migrated = migrateConfig({ pairwise: { enabled: true, radius: 30 } as any });
  assert.equal(migrated.pairwise!.enabled, true);
  assert.equal(migrated.pairwise!.radius, 30);
  assert.equal(migrated.pairwise!.stiffness, 1, 'untouched numerics keep engine defaults');
  const off = migrateConfig({ pairwise: { enabled: false, extent: 900 } as any });
  assert.equal(off.pairwise!.enabled, false);
  assert.equal(off.pairwise!.extent, 900);
});

test('pairwise migration: the section round-trips through a v5 snapshot JSON', () => {
  const base = migrateConfig({ pairwise: { enabled: true, radius: 22, viscosity: 0.55 } as any });
  const throughJson = JSON.parse(JSON.stringify(createSnapshot('pw', base)));
  const back = migrateSnapshot(throughJson, 0)!;
  assert.deepEqual(back.config.pairwise, base.pairwise);
});

// ---------------------------------------------------------------- registry

test('pairwise registry: every numeric param is registered in the Pairwise group', () => {
  for (const [path, min, max] of [
    ['pairwise.radius', 2, 80],
    ['pairwise.stiffness', 0, 10],
    ['pairwise.restitution', 0, 1],
    ['pairwise.viscosity', 0, 1],
    ['pairwise.extent', 200, 5000],
  ] as const) {
    const def = getParamDef(path);
    assert.ok(def, `${path} must be registered`);
    assert.equal(def.group, 'Pairwise');
    assert.equal(def.min, min, `${path} soft min`);
    assert.equal(def.max, max, `${path} soft max`);
    assert.ok(PARAM_GROUPS.includes('Pairwise'));
    assert.ok(PARAM_REGISTRY.filter((p) => p.path === path).length === 1, `${path} registered exactly once`);
  }
});

test('pairwise registry: default config values sit inside the soft slider range', () => {
  for (const key of ['radius', 'stiffness', 'restitution', 'viscosity', 'extent'] as const) {
    const def = getParamDef(`pairwise.${key}`)!;
    const value = DEFAULT_CONFIG.pairwise![key]!;
    assert.ok(value >= def.min && value <= def.max, `pairwise.${key}=${value} outside soft range`);
    assert.ok(Number.isFinite(value));
  }
});

// ---------------------------------------------------------------- bitonic schedule

/** Deterministic shuffle so failures reproduce. */
function seededShuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let s = seed >>> 0;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

test('pairwise schedule: executing the bitonic network sorts a shuffled 16-element array', () => {
  const side = 4; // n = side * side = 16 texels
  const n = side * side;
  const schedule = bitonicSchedule(side);
  assert.equal(schedule.length, (4 * 5) / 2, 'log2(16) stages worth of compare-exchange passes');
  for (let seed = 1; seed <= 6; seed++) {
    // One shuffle drives both arrays so (key, id) pairs are bound before sorting.
    const keys = seededShuffle(Array.from({ length: n }, (_, i) => i * 3 + 1), seed);
    const ids = seededShuffle(Array.from({ length: n }, (_, i) => 1000 + i), seed);
    executeSortSchedule(keys, ids, side);
    for (let i = 1; i < n; i++) assert.ok(keys[i - 1] <= keys[i], `seed ${seed}: not sorted at ${i}`);
    assert.deepEqual([...ids].sort((a, b) => a - b), Array.from({ length: n }, (_, i) => 1000 + i), 'ids are a permutation');
    for (let i = 0; i < n; i++) assert.equal(keys[i], (ids[i] - 1000) * 3 + 1, 'pair binding broken');
  }
});

test('pairwise schedule: a 64-element sort with duplicate keys keeps (key, id) pairs together', () => {
  const side = 8; // n = 64
  const n = side * side;
  const elems = seededShuffle(Array.from({ length: n }, (_, i) => ({ key: Math.floor(i / 4), id: i })), 99); // heavy duplicates
  const keys = elems.map((e) => e.key);
  const ids = elems.map((e) => e.id);
  executeSortSchedule(keys, ids, side);
  for (let i = 1; i < n; i++) assert.ok(keys[i - 1] <= keys[i]);
  for (let i = 0; i < n; i++) assert.equal(keys[i], Math.floor(ids[i] / 4), 'pair binding broken');
});

test('pairwise schedule: compareExchangePass matches a parallel reference evaluation', () => {
  const keys = [5, 1, 4, 2];
  const ids = [0, 1, 2, 3];
  // partner=1, block=2: pair (0,1) ascending swaps, pair (2,3) descending keeps.
  compareExchangePass(keys, ids, 1, 2);
  assert.deepEqual(keys, [1, 5, 4, 2]);
  // partner=2, block=4: pairs (0,2) and (1,3) ascending.
  compareExchangePass(keys, ids, 2, 4);
  assert.deepEqual(keys, [1, 2, 4, 5]);
  // partner=1, block=4: whole array in one ascending block; already ordered.
  compareExchangePass(keys, ids, 1, 4);
  assert.deepEqual(keys, [1, 2, 4, 5]);
});

test('pairwise schedule: 256-particle texture needs 136 passes and the pass sizes cap correctly', () => {
  assert.equal(bitonicSchedule(256).length, 136); // 16 stages: 16*17/2
  assert.equal(sortSideForParticleTexSide(249), 256, '62k particles -> 249 texel side -> padded 256');
  assert.equal(sortSideForParticleTexSide(256), 256);
  assert.equal(sortSideForParticleTexSide(PAIRWISE_MAX_SORT_SIDE), PAIRWISE_MAX_SORT_SIDE);
  assert.equal(sortSideForParticleTexSide(PAIRWISE_MAX_SORT_SIDE + 1), null, 'above the cap the system must disable');
  assert.equal(PAIRWISE_MAX_PARTICLES, PAIRWISE_MAX_SORT_SIDE * PAIRWISE_MAX_SORT_SIDE);
  assert.equal(nextPowerOfTwo(1), 1);
  assert.equal(nextPowerOfTwo(250), 256);
});

// ---------------------------------------------------------------- cell math

test('pairwise cells: world coordinates clamp to the grid and keys round-trip', () => {
  const grid = cellGridDims(1400, 14);
  assert.equal(grid.cellsX, 200);
  assert.equal(grid.cellsY, 200);
  assert.equal(grid.cellSize, 14);

  const { key, cx, cy } = worldToCell(10, -10, 1400, grid);
  assert.deepEqual(cellKeyToCoords(key, grid), { cx, cy });
  assert.deepEqual(worldToCell(1e9, 1e9, 1400, grid), { cx: 199, cy: 199, key: 199 * 200 + 199 }, 'far out of range clamps to the last cell');
  assert.deepEqual(worldToCell(-1e9, -1e9, 1400, grid), { cx: 0, cy: 0, key: 0 });
  // Every key in the grid round-trips and stays an exact integer <= 2**24.
  for (let cy = 0; cy < grid.cellsY; cy += 7) {
    for (let cx = 0; cx < grid.cellsX; cx += 11) {
      const k = cy * grid.cellsX + cx;
      assert.ok(k <= 2 ** 24);
      assert.deepEqual(cellKeyToCoords(k, grid), { cx, cy });
    }
  }
});

test('pairwise cells: cell size never drops below the interaction radius and the grid stays capped', () => {
  // Tiny radius at a huge extent would be 5000 cells per axis without the cap.
  const capped = cellGridDims(5000, 2);
  assert.ok(capped.cellsX <= PAIRWISE_MAX_CELLS_PER_SIDE);
  assert.ok(capped.cellSize >= 2, 'cells at least the interaction radius keep the 3x3 neighbourhood correct');
  const normal = cellGridDims(1400, 14);
  const centre = cellCenter(worldToCell(0, 0, 1400, normal).key, 1400, normal);
  assert.ok(Math.abs(centre.x) <= normal.cellSize && Math.abs(centre.y) <= normal.cellSize);
});

test('pairwise cells: keys of a 3x3 neighbourhood cover every cell within radius h', () => {
  // With cellSize >= h, any particle within h of a centre cell lies in the 3x3 block.
  const grid = cellGridDims(1400, 14);
  const h = 14;
  const centre = { cx: 100, cy: 100 };
  const keys = new Set<number>();
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = centre.cx + dx;
      const cy = centre.cy + dy;
      if (cx < 0 || cy < 0 || cx >= grid.cellsX || cy >= grid.cellsY) continue;
      keys.add(cy * grid.cellsX + cx);
    }
  }
  const centreWorld = cellCenter(centre.cy * grid.cellsX + centre.cx, 1400, grid);
  for (let ang = 0; ang < 64; ang++) {
    const x = centreWorld.x + h * 0.999 * Math.cos((ang / 64) * Math.PI * 2);
    const y = centreWorld.y + h * 0.999 * Math.sin((ang / 64) * Math.PI * 2);
    assert.ok(keys.has(worldToCell(x, y, 1400, grid).key), `offset ${ang} must land in the 3x3 neighbourhood`);
  }
});
