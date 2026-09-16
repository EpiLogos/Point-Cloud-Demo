/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Lamination — the spatial composition of an object. An entity's layers are
 * its makeup in depth: the particle allocation is subdivided across the
 * layers, each layer draws its own shape or loaded source at its own depth
 * with its own measured thickness, and the whole layered body bakes A=B — one
 * static object the sequence then transforms as a whole. Layers are object
 * composition, parallel to the sequence's temporal one; neither gates the
 * other.
 */

import assert from 'node:assert/strict';
import { test } from './harness.ts';
import { EntityRuntime } from '../src/engine/entityRuntime.ts';
import { GlyphSampler } from '../src/engine/GlyphSampler.ts';
import {
  makeFormation,
  makeLink,
  makeLayer,
  DEFAULT_SEQUENCE,
  DEFAULT_COMPOSITION,
} from '../src/engine/fieldModel.ts';
import { SDF_DISTANCE_SCALE } from '../src/engine/sdfField.ts';

const runtime = () => new EntityRuntime({ setVolume: () => false } as unknown as GlyphSampler);

/** A flat candidate pool: a square patch, sized per layer via `side`. */
function patch(side: number, density = 1) {
  const pool = [];
  for (let j = 0; j < side; j++) for (let i = 0; i < side; i++) pool.push({ x: i - side / 2, y: j - side / 2, density });
  return pool;
}

function laminated(layers: Array<{ z: number; scale?: number }>, pools = [8, 8, 8]) {
  const rt = runtime();
  rt.allocate(3000, 50, 60);
  const entity = makeFormation({});
  entity.layers = layers.map(({ z, scale }) => makeLayer(z, { kind: 'glyph', text: 'O' }, scale !== undefined ? { scale } : {}));
  rt.layout([entity]);
  entity.layers.forEach((layer, i) => {
    rt.setCustomCandidates(entity.id + ':' + layer.id, patch(pools[i % pools.length]));
  });
  rt.update([entity], DEFAULT_COMPOSITION, 0, 0, 0, 1);
  return { rt, entity };
}

const zOf = (rt: EntityRuntime, which: 'A' | 'B' = 'A') => {
  const data = (which === 'A' ? rt.textureA! : rt.textureB!).image.data as Float32Array;
  const out: number[] = [];
  for (let i = 0; i < 3000; i++) out.push(data[i * 4 + 2]);
  return out;
};

test('layers: three layers bake as three distinct depth bands', () => {
  const { rt } = laminated([{ z: -120 }, { z: 0 }, { z: 120 }]);
  const zs = zOf(rt);
  const bands = new Set(zs.map((z) => z.toFixed(1)));
  assert.equal(bands.size, 3, `three layers, three bands — got ${[...bands].join(', ')}`);
  for (const expected of [-120, 0, 120]) {
    assert.ok(bands.has(expected.toFixed(1)), `band at ${expected} present`);
  }
});

test('layers: the allocation subdivides evenly across the layers', () => {
  const { rt } = laminated([{ z: -120 }, { z: 0 }, { z: 120 }]);
  const counts = new Map<number, number>();
  for (const z of zOf(rt)) counts.set(z, (counts.get(z) ?? 0) + 1);
  const sizes = [...counts.values()].sort((a, b) => b - a);
  assert.equal(sizes.length, 3);
  assert.ok(sizes[0] - sizes[2] <= 1, `even subdivision — ${sizes.join('/')}`);
});

test('layers: each layer bakes A=B — one body the clock does not touch', () => {
  const { rt } = laminated([{ z: 55 }, { z: -55 }]);
  const za = zOf(rt, 'A');
  const zb = zOf(rt, 'B');
  for (let i = 0; i < za.length; i++) assert.equal(za[i], zb[i], `A=B at ${i}`);
  const bands = new Set(za.map((z) => z.toFixed(1)));
  assert.ok(bands.has('55.0') && bands.has('-55.0'), `authored depths honoured — ${[...bands].join(', ')}`);
});

test('layers: layer scale multiplies the pool in-plane and in thickness', () => {
  const { rt, entity } = laminated([{ z: 0, scale: 2 }, { z: 120 }], [8, 8]);
  const data = rt.textureA!.image.data as Float32Array;
  // Layer 0 occupies the first half of the partition: its x spread is doubled.
  const half = 1500;
  const xInLayer0: number[] = [];
  for (let i = 0; i < half; i++) xInLayer0.push(data[i * 4]);
  const spread0 = Math.max(...xInLayer0) - Math.min(...xInLayer0);
  // Unscaled patch span is 7 units; at BASE_SCALE 0.56 and layer scale 2 → 7.84.
  assert.ok(Math.abs(spread0 - 7 * 2 * 0.56) < 0.2, `scaled layer spans twice the base patch (${spread0.toFixed(2)} ≠ ${(7 * 2 * 0.56).toFixed(2)})`);
  void entity;
});

test('layers: the collision wall is the union solid spanning the stack', () => {
  const { rt } = laminated([{ z: -200 }, { z: 200 }]);
  // The union tile's thickness channel carries the reach: 200 · scale / 100.
  const expected = (200 * 0.56) / SDF_DISTANCE_SCALE;
  const tile = rt.collisionTexture!.image.data as Float32Array;
  let found = 0;
  for (let i = 0; i < tile.length; i += 4) {
    if (Math.abs(tile[i + 1] - Math.min(3, expected)) < 1e-4) found++;
  }
  assert.ok(found > 20, `thickness envelope ≈ ${expected.toFixed(2)} stamped (${found} cells)`);
});

test('layers: editing depths or scales re-bakes the stack', () => {
  const { rt, entity } = laminated([{ z: -120 }, { z: 120 }]);
  const zsBefore = zOf(rt);
  entity.layers![1].z = 240;
  rt.update([entity], DEFAULT_COMPOSITION, 0, 0, 0, 1);
  const zsAfter = zOf(rt);
  const before = new Set(zsBefore.map((z) => z.toFixed(1)));
  const after = new Set(zsAfter.map((z) => z.toFixed(1)));
  assert.ok(zsAfter.some((z, i) => z !== zsBefore[i]), 'the depth change re-baked the bands');
  assert.ok(after.has('240.0') && !before.has('240.0'), `new band present — ${[...after].join(', ')}`);
});

test('layers: a layered body still sequences — states transform the whole stack', () => {
  const { rt, entity } = laminated([{ z: -120 }, { z: 120 }]);
  // The layered bake is A=B: a state's progress cannot reshuffle the layers,
  // and the ordinary uniforms (placement/size/tint) carry the whole body.
  entity.sequence = { ...DEFAULT_SEQUENCE, links: [makeLink({ kind: 'glyph', text: 'O' })] };
  rt.update([entity], DEFAULT_COMPOSITION, 0.5, 0, 0, 1);
  const zs = zOf(rt);
  const bands = new Set(zs.map((z) => z.toFixed(1)));
  assert.ok(bands.has('-120.0') && bands.has('120.0'), 'the layered body persists under a running sequence');
});
