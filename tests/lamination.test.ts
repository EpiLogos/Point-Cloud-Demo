/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Depth lamination — the sequence's spatial dual. A laminated formation renders
 * every link simultaneously as one depth layer of a single laminated body: the
 * partition is subdivided across the layers, each layer bakes A=B (the sequence
 * clock composes in space, not time), authored link z is a layer depth (never a
 * glide offset), and the collision wall is the union solid of the stack.
 */

import assert from 'node:assert/strict';
import { test } from './harness.ts';
import { EntityRuntime } from '../src/engine/entityRuntime.ts';
import { GlyphSampler } from '../src/engine/GlyphSampler.ts';
import {
  makeFormation,
  makeLink,
  DEFAULT_SEQUENCE,
  DEFAULT_COMPOSITION,
} from '../src/engine/fieldModel.ts';
import { resolveEntityPose } from '../src/engine/entityPose.ts';
import { SDF_DISTANCE_SCALE } from '../src/engine/sdfField.ts';

const runtime = () => new EntityRuntime({ setVolume: () => false } as unknown as GlyphSampler);

/** A flat candidate pool: a small square patch of `density`, distinct per layer via `side`. */
function patch(side: number, density = 1) {
  const pool = [];
  for (let j = 0; j < side; j++) for (let i = 0; i < side; i++) pool.push({ x: i - side / 2, y: j - side / 2, density });
  return pool;
}

type LinkSpec = [Parameters<typeof makeLink>[0], Parameters<typeof makeLink>[1]];

function laminated(links: LinkSpec[], span = 240, pools = [8, 8, 8]) {
  const rt = runtime();
  rt.allocate(3000, 50, 60);
  const entity = makeFormation({
    sequence: { ...DEFAULT_SEQUENCE, links: [], laminate: { span } },
  });
  entity.sequence.links = links.map(([shape, pos], i) => makeLink(shape, pos));
  rt.layout([entity]);
  entity.sequence.links.forEach((link, i) => {
    rt.setCustomCandidates(entity.id + ':' + link.id, patch(pools[i % pools.length]));
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

test('lamination: three links bake as three distinct depth bands', () => {
  const { rt } = laminated([
    [{ kind: 'glyph', text: 'A' }, undefined],
    [{ kind: 'glyph', text: 'B' }, undefined],
    [{ kind: 'glyph', text: 'C' }, undefined],
  ]);
  const zs = zOf(rt);
  const bands = new Set(zs.map((z) => z.toFixed(1)));
  assert.equal(bands.size, 3, `three layers, three bands — got ${[...bands].join(', ')}`);
  // Even spread across the 240 span: slot centres at −80, 0, +80.
  for (const expected of [-80, 0, 80]) {
    assert.ok(bands.has(expected.toFixed(1)), `band at ${expected} present`);
  }
});

test('lamination: the allocation subdivides evenly across the layers', () => {
  const { rt } = laminated([
    [{ kind: 'glyph', text: 'A' }, undefined],
    [{ kind: 'glyph', text: 'B' }, undefined],
    [{ kind: 'glyph', text: 'C' }, undefined],
  ]);
  const counts = new Map<number, number>();
  for (const z of zOf(rt)) counts.set(z, (counts.get(z) ?? 0) + 1);
  const sizes = [...counts.values()].sort((a, b) => b - a);
  assert.equal(sizes.length, 3);
  assert.ok(sizes[0] - sizes[2] <= 1, `even subdivision — ${sizes.join('/')}`);
});

test('lamination: authored link z overrides the even spread, and layers carry A=B', () => {
  const { rt, entity } = laminated([
    [{ kind: 'glyph', text: 'A' }, { z: 55 }],
    [{ kind: 'glyph', text: 'B' }, undefined],
  ], 240, [8, 8]);
  const zs = zOf(rt);
  const bands = new Set(zs.map((z) => z.toFixed(1)));
  assert.ok(bands.has('55.0'), `authored depth 55 honoured — bands: ${[...bands].join(', ')}`);
  const za = zOf(rt, 'A');
  const zb = zOf(rt, 'B');
  for (let i = 0; i < za.length; i++) assert.equal(za[i], zb[i], `A=B at ${i} — a laminated layer is clock-inert`);
  void entity;
});

test('lamination: the collision wall is the union solid spanning the lamination', () => {
  const { rt } = laminated([
    [{ kind: 'glyph', text: 'A' }, undefined],
    [{ kind: 'glyph', text: 'B' }, undefined],
  ], 240, [8, 8]);
  // The union tile's thickness channel carries the span: hz = span/2 · scale.
  const expected = (240 / 2) * 0.56 / SDF_DISTANCE_SCALE;
  const tile = rt.collisionTexture!.image.data as Float32Array;
  let found = 0;
  for (let i = 0; i < tile.length; i += 4) {
    if (Math.abs(tile[i + 1] - Math.min(3, expected)) < 1e-4) found++;
  }
  assert.ok(found > 20, `thickness envelope ≈ ${expected.toFixed(2)} stamped (${found} cells)`);
});

test('lamination: editing the span or layer depths re-bakes the stack', () => {
  const { rt, entity } = laminated([
    [{ kind: 'glyph', text: 'A' }, undefined],
    [{ kind: 'glyph', text: 'B' }, undefined],
  ], 240, [8, 8]);
  const zs240 = zOf(rt);
  entity.sequence.laminate = { span: 480 };
  rt.update([entity], DEFAULT_COMPOSITION, 0, 0, 0, 1);
  const zs480 = zOf(rt);
  const bands480 = new Set(zs480.map((z) => z.toFixed(1)));
  const bands240 = new Set(zs240.map((z) => z.toFixed(1)));
  assert.ok(zs480.some((z, i) => z !== zs240[i]), `the span change re-baked the bands — 240: ${[...bands240].join(', ')} / 480: ${[...bands480].join(', ')}`);
  // Two layers at span 480: slot centres ±120.
  assert.ok(bands480.has('-120.0') && bands480.has('120.0'), `span 480 spreads wider — ${[...bands480].join(', ')}`);
});

test('lamination: link coordinates are layer depths, never glide offsets', () => {
  const entity = makeFormation({
    z: -40,
    sequence: { ...DEFAULT_SEQUENCE, links: [], laminate: { span: 200 } },
  });
  entity.sequence.links = [makeLink({ kind: 'glyph', text: 'A' }, { z: 90 })];
  const pose = resolveEntityPose(entity, 0, 0, 0, 1);
  assert.equal(pose.z, -40, 'the pose stays at the entity centre; the bake owns layer depth');
});
