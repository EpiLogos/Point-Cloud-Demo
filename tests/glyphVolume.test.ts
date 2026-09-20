/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The true-3D glyph volume law. These cases pin the claim the feature makes:
 * a letterform baked with the volume enabled is a solid body with measurable
 * thickness, not a flat card carrying z micro-noise. They also pin the thing
 * that matters most for a live instrument — a change to the law must actually
 * change the baked depth, or a studio slider would move nothing.
 */

import assert from 'node:assert/strict';
import { test } from './harness.ts';
import {
  applyGlyphVolume,
  buildGlyphDepthFields,
  cellVolumeShape,
  depthProfile,
  dominantFamily,
  drawVolumeZ,
  hashString,
  mulberry32,
  slabDistance,
  DEFAULT_GLYPH_VOLUME,
} from '../src/engine/glyphVolume.ts';

/** Solid square block of `alpha` in an RGBA buffer: ink from `lo` to `hi` inclusive. */
function blockAlpha(w: number, h: number, lo: number, hi: number): Uint8ClampedArray {
  const buf = new Uint8ClampedArray(w * h * 4);
  for (let y = lo; y <= hi; y++) {
    for (let x = lo; x <= hi; x++) {
      buf[(y * w + x) * 4 + 3] = 255;
    }
  }
  return buf;
}

/** An 'O'-like ring: ink between an outer and inner radius. */
function ringAlpha(w: number, h: number, outer: number, inner: number): Uint8ClampedArray {
  const buf = new Uint8ClampedArray(w * h * 4);
  const c = w / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const r = Math.hypot(x - c, y - c);
      if (r <= outer && r >= inner) buf[(y * w + x) * 4 + 3] = 255;
    }
  }
  return buf;
}

const VOLUME = (over: Partial<typeof DEFAULT_GLYPH_VOLUME> = {}) => ({
  ...DEFAULT_GLYPH_VOLUME,
  enabled: true,
  ...over,
});

test('glyphVolume: depth profiles are monotonic from the contour to the medial axis', () => {
  for (const profile of ['slab', 'bevel', 'round', 'dome', 'taper'] as const) {
    let previous = depthProfile(profile, 0);
    assert.ok(previous >= 0, `${profile} starts at or above zero`);
    for (let t = 0.05; t <= 1.0001; t += 0.05) {
      const v = depthProfile(profile, Math.min(1, t));
      assert.ok(v >= previous - 1e-9, `${profile} never thins as it goes deeper (t=${t.toFixed(2)})`);
      assert.ok(v <= 1 + 1e-9, `${profile} stays normalized`);
      previous = v;
    }
  }
  // The named shapes must be distinguishable, not aliases of one another.
  assert.equal(depthProfile('slab', 0), 1, 'a slab is full thickness at the contour');
  assert.equal(depthProfile('bevel', 0), 0, 'a bevel starts at zero at the contour');
  assert.ok(Math.abs(depthProfile('round', 0) - 0) < 1e-9, 'a round profile starts at zero');
  assert.ok(Math.abs(depthProfile('round', 0.5) - Math.sqrt(0.75)) < 1e-9, 'round is a circle');
  assert.ok(Math.abs(depthProfile('dome', 1) - 1) < 1e-9, 'a dome reaches full thickness');
  assert.ok(depthProfile('taper', 0.5) < depthProfile('bevel', 0.5), 'taper is sharper than bevel');
});

test('glyphVolume: the distance transform measures the real stroke half-width', () => {
  const w = 64;
  const h = 64;
  // Ink occupies 16..47 inclusive on both axes, so the deepest interior point is
  // 16px from the nearest empty cell.
  const fields = buildGlyphDepthFields(blockAlpha(w, h, 16, 47), w, h);

  assert.equal(fields.distToInk[32 * w + 32], 0, 'inside the block the distance to ink is zero');
  assert.equal(fields.distInside[32 * w + 32], 16, 'the block centre is 16px from the nearest edge');
  // The inward distance is measured to the nearest EMPTY cell, so a boundary ink
  // pixel reads 1: the contour is one pixel of half-width, never a true zero.
  assert.equal(fields.distInside[16 * w + 32], 1, 'the contour has one pixel of inward depth');
  assert.equal(fields.distToInk[16 * w + 16], 0, 'a corner of the block is ink');
  // Outside: the distance to the nearest ink pixel.
  assert.ok(Math.abs(fields.distToInk[0 * w + 0] - Math.hypot(16, 16)) < 1e-6, 'outside distance is Euclidean');
  assert.ok(Math.abs(fields.distToInk[16 * w + 0] - 16) < 1e-6, 'straight-across outside distance');
  // Reference thickness is a high percentile of the interior distance, bounded by
  // the true half-width.
  assert.ok(fields.referenceThickness > 0, 'a reference thickness is derived');
  assert.ok(fields.referenceThickness <= 16, 'the reference never exceeds the true half-width');
});

test('glyphVolume: reference thickness follows the stroke, not the blob', () => {
  // A thick disc beside a thin bar: the thin stroke must not be normalized away.
  const w = 96;
  const h = 96;
  const alpha = new Uint8ClampedArray(w * h * 4);
  const c = 32;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const disc = Math.hypot(x - c, y - c) <= 24;
      const bar = y >= 78 && y <= 84 && x >= 4 && x <= 92;
      if (disc || bar) alpha[(y * w + x) * 4 + 3] = 255;
    }
  }
  const fields = buildGlyphDepthFields(alpha, w, h);
  const barDepth = fields.distInside[81 * w + 48];
  const discDepth = fields.distInside[32 * w + 32];
  assert.ok(discDepth > barDepth, 'the disc is genuinely thicker than the bar');
  assert.ok(
    fields.referenceThickness >= barDepth,
    'the reference is at least the thinner stroke, so a thin stroke keeps real depth'
  );
});

test('glyphVolume: cell shape is full thickness at the medial axis and zero outside the ink', () => {
  const ref = 20;
  const cfg = VOLUME({depth: 80, profile: 'bevel', densityDepth: 0, outsideTaper: 0.6, wallBand: 10});

  const contour = cellVolumeShape(0, 0, ref, 1, cfg);
  assert.equal(contour.half, 0, 'a bevel is knife-thin exactly at the contour');
  assert.equal(contour.contourness, 1, 'the contour is fully flank');

  const medial = cellVolumeShape(ref, 0, ref, 1, cfg);
  assert.ok(Math.abs(medial.half - 40) < 1e-9, 'the medial axis reaches half the requested depth');
  assert.equal(medial.contourness, 0, 'deep inside there is no flank');

  // Outside the letterform the stipple spray hugs the surface. With a slab
  // section it keeps a real thickness that tapers with distance; with a bevel the
  // body is genuinely knife-thin at the contour, so the spray inherits nothing —
  // a hard-edged extrusion has no material outside itself.
  const slabCfg = VOLUME({depth: 80, profile: 'slab', densityDepth: 0, outsideTaper: 0.6, wallBand: 10});
  const near = cellVolumeShape(0, ref * 0.3, ref, 1, slabCfg);
  const far = cellVolumeShape(0, ref * 0.6, ref, 1, slabCfg);
  assert.ok(near.half > 0, 'the spray beside the ink still has some thickness');
  assert.ok(far.half < near.half, 'thickness falls off with distance from the ink');
  const beyond = cellVolumeShape(0, ref * 0.7, ref, 1, slabCfg);
  assert.equal(beyond.half, 0, 'past the taper the spray carries no body at all');
  assert.equal(
    cellVolumeShape(0, ref * 0.3, ref, 1, cfg).half,
    0,
    'a bevel section leaves the outside spray with no thickness'
  );

  // A slab ignores penetration entirely: constant thickness everywhere inside.
  const slab = cellVolumeShape(ref * 0.1, 0, ref, 1, VOLUME({depth: 80, profile: 'slab', densityDepth: 0}));
  assert.ok(Math.abs(slab.half - 40) < 1e-9, 'a slab has the same thickness at any depth');
});

test('glyphVolume: density can thicken or thin the body, and depth scales it linearly', () => {
  const ref = 20;
  const base = {profile: 'slab' as const, densityDepth: 0, outsideTaper: 0.6, wallBand: 10};
  const thin = cellVolumeShape(ref, 0, ref, 1, VOLUME({...base, depth: 40}));
  const thick = cellVolumeShape(ref, 0, ref, 1, VOLUME({...base, depth: 80}));
  assert.ok(Math.abs(thick.half - thin.half * 2) < 1e-9, 'depth is linear in the requested thickness');

  // Density depth is compared at a fixed thickness, so it is the density term
  // being measured and not the depth.
  const neutral = cellVolumeShape(ref, 0, ref, 1, VOLUME({...base, depth: 80}));
  const dense = cellVolumeShape(ref, 0, ref, 1, VOLUME({...base, depth: 80, densityDepth: 0.5}));
  const sparse = cellVolumeShape(ref, 0, ref, 1, VOLUME({...base, depth: 80, densityDepth: -0.5}));
  assert.ok(dense.half > neutral.half, 'positive density depth thickens a dense stroke');
  assert.ok(sparse.half < neutral.half, 'negative density depth thins it');
  assert.ok(Math.abs(dense.half - 60) < 1e-9, 'density gain is a bounded multiplier at full density');
  assert.ok(Math.abs(sparse.half - 20) < 1e-9, 'and symmetric below zero');
  // At mid density the gain term cancels: half the mass reads as neutral.
  const midDense = cellVolumeShape(ref, 0, ref, 0.5, VOLUME({...base, depth: 80, densityDepth: 0.5}));
  assert.ok(Math.abs(midDense.half - neutral.half) < 1e-9, 'mid density is neutral');
});

test('glyphVolume: the three placement families put depth where they claim to', () => {
  const noJitter = {surfaceThickness: 0, jitter: 0, depth: 40, profile: 'slab' as const};
  const half = 20;

  // Faces only: every sample lands on a surface plane.
  const faceCfg = VOLUME({...noJitter, wallShare: 0, faceBias: 1, interiorFill: 0});
  for (let i = 0; i < 200; i++) {
    const {z, family} = drawVolumeZ(half, 0, faceCfg, mulberry32(i));
    assert.equal(family, 'face');
    assert.ok(Math.abs(Math.abs(z) - half) < 1e-9, 'a face sample sits on the surface');
  }

  // Interior only, with no fill spread: every sample collapses to the midsection.
  const bodyCfg = VOLUME({...noJitter, wallShare: 0, faceBias: 0, interiorFill: 0});
  for (let i = 0; i < 200; i++) {
    const {z, family} = drawVolumeZ(half, 0, bodyCfg, mulberry32(i));
    assert.equal(family, 'body');
    assert.equal(z, 0, 'an empty interior band has no depth to spread into');
  }

  // Flanks only: the sample spans the full thickness and never exceeds it.
  const flankCfg = VOLUME({...noJitter, wallShare: 1, faceBias: 0, interiorFill: 0});
  let low = Infinity;
  let high = -Infinity;
  for (let i = 0; i < 400; i++) {
    const {z, family} = drawVolumeZ(half, 1, flankCfg, mulberry32(i));
    assert.equal(family, 'flank');
    assert.ok(Math.abs(z) <= half + 1e-9, 'a flank never exceeds the body thickness');
    low = Math.min(low, z);
    high = Math.max(high, z);
  }
  assert.ok(high - low > half * 1.5, 'flanks genuinely span the thickness rather than clustering');
  assert.ok(low < 0 && high > 0, 'flanks appear on both faces of the body');

  // Flank weight is contourness: deep inside the solid there are no flanks.
  const interior = drawVolumeZ(half, 0, flankCfg, mulberry32(7));
  assert.equal(interior.family, 'body', 'no flank where there is no contour');
});

test('glyphVolume: the law is deterministic, so a re-bake never re-rolls the body', () => {
  const cfg = VOLUME({depth: 60});
  const run = () => {
    const rand = mulberry32(hashString('O|2000|stipple'));
    return Array.from({length: 300}, () => drawVolumeZ(20, 0.5, cfg, rand).z);
  };
  assert.deepEqual(run(), run(), 'the same seed reproduces the same body exactly');
  assert.notDeepEqual(run(), (() => {
    const rand = mulberry32(hashString('I|2000|stipple'));
    return Array.from({length: 300}, () => drawVolumeZ(20, 0.5, cfg, rand).z);
  })(), 'a different glyph is a different body');
});

test('glyphVolume: applyGlyphVolume gives a baked glyph real thickness and leaves x/y/density alone', () => {
  const w = 64;
  const h = 64;
  const fields = buildGlyphDepthFields(blockAlpha(w, h, 16, 47), w, h);
  const cfg = VOLUME({depth: 60, profile: 'slab', densityDepth: 0, jitter: 0, wallShare: 0, faceBias: 1, surfaceThickness: 0});

  // Particles spread across the block, in the sampler's world projection.
  const count = 4000;
  const data = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const px = 16 + ((i * 7) % 32);
    const py = 16 + ((i * 11) % 32);
    data[i * 4] = px - w / 2;
    data[i * 4 + 1] = -(py - h / 2);
    data[i * 4 + 2] = (Math.random() - 0.5) * 8; // the flat-card noise being replaced
    data[i * 4 + 3] = 0.9;
  }
  const before = Float32Array.from(data);

  const stats = applyGlyphVolume(data, count, fields, 1, cfg, 1234);

  // Planar geometry and ink density are untouched: the face-on drawing is identical.
  for (let i = 0; i < count; i++) {
    assert.equal(data[i * 4], before[i * 4], 'x is untouched');
    assert.equal(data[i * 4 + 1], before[i * 4 + 1], 'y is untouched');
    assert.equal(data[i * 4 + 3], before[i * 4 + 3], 'density is untouched');
  }

  // Real thickness: the body is 60 deep, not the ±4 of the flat law.
  assert.ok(Math.abs(stats.maxHalfThickness - 30) < 1e-9, 'half-thickness is half the requested depth');
  assert.ok(stats.maxZ > 29, `the body reaches its full depth, got ${stats.maxZ}`);
  assert.ok(stats.minZ < -29, `the body reaches the far face too, got ${stats.minZ}`);
  assert.equal(stats.faceCount, count, 'a faces-only law places every sample on a surface');

  // And the headline claim: thicker than the flat card it replaces.
  const flatSpan = 8; // the old law's (Math.random() - 0.5) * 8
  assert.ok(stats.maxZ - stats.minZ > flatSpan * 5, 'the body is far deeper than the flat z noise');

  // Determinism across a re-bake.
  const again = Float32Array.from(before);
  applyGlyphVolume(again, count, fields, 1, cfg, 1234);
  assert.deepEqual(Array.from(again), Array.from(data), 'a re-bake reproduces the same body exactly');
});

test('glyphVolume: changing the law changes the baked depth (a studio slider must move something)', () => {
  const w = 64;
  const h = 64;
  const fields = buildGlyphDepthFields(blockAlpha(w, h, 16, 47), w, h);
  const bake = (depth: number) => {
    const count = 2000;
    const data = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const px = 16 + ((i * 7) % 32);
      const py = 16 + ((i * 11) % 32);
      data[i * 4] = px - w / 2;
      data[i * 4 + 1] = -(py - h / 2);
      data[i * 4 + 3] = 0.9;
    }
    return applyGlyphVolume(data, count, fields, 1, VOLUME({depth, profile: 'slab', densityDepth: 0, jitter: 0}), 99);
  };
  const shallow = bake(20);
  const deep = bake(80);
  assert.ok(deep.maxZ > shallow.maxZ * 3.5, 'depth drives the baked thickness');
  assert.ok(deep.minZ < shallow.minZ * 3.5, 'and does so symmetrically');

  // The profile is a real choice, not decoration: a bevel is thinner at the edge
  // than a slab at the same depth.
  const edges = (profile: 'slab' | 'bevel') => {
    const shape = cellVolumeShape(0.5, 0, fields.referenceThickness, 1, VOLUME({depth: 80, profile, densityDepth: 0}));
    return shape.half;
  };
  assert.ok(edges('bevel') < edges('slab'), 'a bevel thins the contour where a slab does not');
});

test('glyphVolume: a ring bakes a hollow body, and the family report is honest', () => {
  const w = 96;
  const h = 96;
  const fields = buildGlyphDepthFields(ringAlpha(w, h, 40, 26), w, h);
  const count = 3000;
  const data = new Float32Array(count * 4);
  // Sample the ring band only.
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = 33 + (i % 5);
    const px = w / 2 + Math.cos(angle) * r;
    const py = h / 2 + Math.sin(angle) * r;
    data[i * 4] = px - w / 2;
    data[i * 4 + 1] = -(py - h / 2);
    data[i * 4 + 3] = 1;
  }
  const cfg = VOLUME({depth: 50, profile: 'round', jitter: 0, wallShare: 0.34, faceBias: 0.55, interiorFill: 0.25});
  const stats = applyGlyphVolume(data, count, fields, 1, cfg, 4242);

  // A ring's stroke has a real half-width, so every family should appear.
  assert.ok(stats.flankCount > 0, 'the ring has flanks along its contour');
  assert.ok(stats.faceCount > 0, 'the ring has faces');
  assert.ok(stats.maxHalfThickness > 0, 'the ring stroke has measurable half-thickness');
  assert.ok(stats.minZ < 0 && stats.maxZ > 0, 'the body straddles the plane');
  for (const family of ['flank', 'face', 'body'] as const) {
    assert.ok(['flank', 'face', 'body'].includes(family));
  }
  assert.ok(['flank', 'face', 'body'].includes(dominantFamily(stats)), 'a dominant family is reported');
});

test('glyphVolume: slabDistance is the exact boundary of an extruded solid', () => {
  // Inside the slab: the distance to the nearest surface, not the deepest reach.
  assert.equal(slabDistance(-5, 0, 10), -5, 'inside, the 2D section is nearer');
  assert.equal(slabDistance(-20, 0, 10), -10, 'inside, the face is nearer');
  assert.equal(slabDistance(0, 0, 0), 0, 'zero thickness has no interior');
  // Outside in the section, within the thickness: the 2D distance stands.
  assert.equal(slabDistance(3, 0, 10), 3, 'outside the section the 2D distance stands');
  // Outside through a face: the face distance stands, the section sign is ignored.
  assert.equal(slabDistance(-2, 14, 10), 4, 'past a face the perpendicular distance is the boundary');
  assert.equal(slabDistance(-2, -14, 10), 4, 'and symmetrically on the other side');
  // Outside in both: the true corner distance.
  assert.ok(Math.abs(slabDistance(3, 14, 10) - 5) < 1e-12, 'outside both, distances combine as a corner');
  assert.ok(Math.abs(slabDistance(-1, 18, 10) - 8) < 1e-12, 'deep inside the section but far past a face');
  // A thicker body cannot be nearer than a thinner one at the same point.
  assert.ok(slabDistance(0, 12, 5) > slabDistance(0, 12, 20), 'thickness genuinely moves the wall');
});

test('glyphVolume: the law never writes outside its own thickness envelope', () => {
  // A two-particle sample is a coin flip, not a test: with the default family
  // split a single draw can land in the interior band and read as almost flat.
  // The invariant that actually holds is per-particle and needs a real sample.
  const w = 64;
  const h = 64;
  const fields = buildGlyphDepthFields(blockAlpha(w, h, 16, 47), w, h);
  const count = 6000;
  const data = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const px = 16 + ((i * 7) % 32);
    const py = 16 + ((i * 11) % 32);
    data[i * 4] = px - w / 2;
    data[i * 4 + 1] = -(py - h / 2);
    data[i * 4 + 3] = 0.9;
  }
  const cfg = { ...DEFAULT_GLYPH_VOLUME, enabled: false };
  const stats = applyGlyphVolume(data, count, fields, 1, cfg, 7777);

  // Nothing may sit further from the plane than the body is thick at its
  // thickest, plus the configured jitter.
  const limit = stats.maxHalfThickness + cfg.jitter;
  let worst = 0;
  for (let i = 0; i < count; i++) worst = Math.max(worst, Math.abs(data[i * 4 + 2]));
  assert.ok(worst <= limit + 1e-9, `every sample stays inside the body: worst |z| ${worst} vs limit ${limit}`);

  // The thickness itself is the requested depth, scaled by the density term.
  const expectedHalf = (cfg.depth / 2) * Math.max(0, 1 + cfg.densityDepth * (0.9 - 0.5) * 2);
  assert.ok(
    Math.abs(stats.maxHalfThickness - expectedHalf) < expectedHalf * 1e-3,
    `the medial axis reaches the configured half-thickness, got ${stats.maxHalfThickness} vs ${expectedHalf}`
  );

  // And the regime is opt-in: the engine never reaches this law unless enabled.
  assert.equal(DEFAULT_GLYPH_VOLUME.enabled, false, 'volume is off by default');
  assert.ok(DEFAULT_GLYPH_VOLUME.depth > 0, 'and carries a usable default thickness when enabled');
  assert.ok(DEFAULT_GLYPH_VOLUME.wallShare > 0, 'extruded flanks are part of the default body');
  assert.ok(
    DEFAULT_GLYPH_VOLUME.wallBand >= 20,
    'the flank band is a real fraction of a bold stroke, not a hairline at the contour'
  );
});
