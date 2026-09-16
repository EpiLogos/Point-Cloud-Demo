/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The true-3D body law is one law for every planar object type. Letterforms
 * had it first; these cases pin the claim that image masks, ASCII drawings,
 * primitives and cymatic plates now extrude through the same measured
 * distance transform — and that with the law off, nothing changes.
 */

import assert from 'node:assert/strict';
import { test } from './harness.ts';
import {
  buildDepthFieldsFromMask,
  buildGlyphDepthFields,
  DEFAULT_GLYPH_VOLUME,
} from '../src/engine/glyphVolume.ts';
import { sampleImageSource, sampleAlphaSource } from '../src/engine/sourceSampling.ts';
import { EntityRuntime } from '../src/engine/entityRuntime.ts';
import { GlyphSampler } from '../src/engine/GlyphSampler.ts';
import { makeFormation, DEFAULT_COMPOSITION, DEFAULT_SEQUENCE } from '../src/engine/fieldModel.ts';
import type { GlyphVolumeConfig } from '../src/engine/types.ts';

const VOLUME: GlyphVolumeConfig = { ...DEFAULT_GLYPH_VOLUME, enabled: true, depth: 90 };

function maxOf(candidates: Array<{ hz?: number }>): number {
  return candidates.reduce((m, c) => Math.max(m, c.hz ?? 0), 0);
}

/** Synthetic RGBA buffer: white paper, one solid dark rectangle (canvas coords, y down). */
function paperWithRect(w: number, h: number, x0: number, y0: number, x1: number, y1: number) {
  const px = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    px[i * 4] = 255; px[i * 4 + 1] = 255; px[i * 4 + 2] = 255; px[i * 4 + 3] = 255;
  }
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4;
      px[i] = 10; px[i + 1] = 10; px[i + 2] = 10; px[i + 3] = 255;
    }
  }
  return { px, w, h };
}

test('sourceVolume: image candidates carry a measured body under the law', () => {
  // The rectangle is deep enough that its middle sits beyond the 42px wall
  // band, so a genuine interior (cw ≈ 0) exists beside the contour band.
  const img = paperWithRect(300, 240, 60, 50, 240, 190);
  const { candidates } = sampleImageSource(img.px, img.w, img.h, { threshold: 0.3, volume: VOLUME });
  assert.ok(candidates.length > 2000, `expected a dense pool, got ${candidates.length}`);
  for (const c of candidates) {
    assert.ok(c.hz !== undefined && c.cw !== undefined, 'every candidate carries (hz, cw)');
    assert.ok(c.hz! >= 0, 'half-thickness is never negative');
  }
  const contour = candidates.filter((c) => c.cw! > 0.9);
  const interior = candidates.filter((c) => c.cw! < 0.1);
  assert.ok(contour.length > 0, 'the contour band exists');
  assert.ok(interior.length > 0, 'the interior exists');
  const maxHz = maxOf(candidates);
  // depth=90 · ½ · densityGain(1 + 0.35) at the medial axis, profile-capped.
  assert.ok(maxHz > 30, `the body reaches real thickness (max ${maxHz.toFixed(1)})`);
  assert.ok(maxHz <= 90 * 0.5 * 1.35 + 1e-6, `thickness respects the law bound (${maxHz.toFixed(1)})`);
});

test('sourceVolume: with the law off, image candidates stay flat', () => {
  const img = paperWithRect(300, 240, 60, 50, 240, 190);
  const { candidates } = sampleImageSource(img.px, img.w, img.h, { threshold: 0.3 });
  assert.ok(candidates.length > 0);
  assert.ok(candidates.every((c) => c.hz === undefined && c.cw === undefined), 'no thickness keys leak when disabled');
});

test('sourceVolume: ASCII cell candidates carry the drawing\'s body', () => {
  const px = new Uint8ClampedArray(160 * 80 * 4);
  for (let y = 15; y < 65; y++) for (let x = 20; x < 140; x++) {
    const i = (y * 160 + x) * 4;
    px[i] = 255; px[i + 1] = 255; px[i + 2] = 255; px[i + 3] = 255;
  }
  const { candidates } = sampleAlphaSource(px, 160, 80, { cell: { w: 8, h: 10 }, volume: VOLUME });
  assert.ok(candidates.length > 100, `expected the quadrant lattice, got ${candidates.length}`);
  assert.ok(candidates.every((c) => c.hz !== undefined && c.cw !== undefined), 'typed marks extrude');
  const maxHz = maxOf(candidates);
  assert.ok(maxHz > 30, `the drawn stroke carries thickness (max ${maxHz.toFixed(1)})`);
});

test('sourceVolume: the mask builder and the RGBA builder measure the same solid', () => {
  const w = 64, h = 64, lo = 16, hi = 48;
  const rgba = new Uint8ClampedArray(w * h * 4);
  const mask = new Uint8Array(w * h);
  for (let y = lo; y <= hi; y++) {
    for (let x = lo; x <= hi; x++) {
      rgba[(y * w + x) * 4 + 3] = 255;
      mask[y * w + x] = 1;
    }
  }
  const fromRgba = buildGlyphDepthFields(rgba, w, h);
  const fromMask = buildDepthFieldsFromMask(mask, w, h);
  assert.equal(fromMask.referenceThickness, fromRgba.referenceThickness);
  for (let i = 0; i < w * h; i++) {
    assert.ok(Math.abs(fromMask.distInside[i] - fromRgba.distInside[i]) < 1e-5);
    assert.ok(Math.abs(fromMask.distToInk[i] - fromRgba.distToInk[i]) < 1e-5);
  }
});

test('sourceVolume: a baked image formation spans real depth, and stays flat with the law off', () => {
  const img = paperWithRect(300, 240, 60, 50, 240, 190);
  const bake = (volume: GlyphVolumeConfig | undefined) => {
    const runtime = new EntityRuntime({ setVolume: () => false } as unknown as GlyphSampler);
    runtime.setVolume(volume);
    runtime.allocate(1024, 32, 32);
    const entity = makeFormation({
      sequence: { ...DEFAULT_SEQUENCE, links: [] },
    });
    runtime.layout([entity]);
    runtime.setCustomCandidates(entity.id, sampleImageSource(img.px, img.w, img.h, { threshold: 0.3, volume }).candidates);
    runtime.update([entity], DEFAULT_COMPOSITION, 0, 0, 0, 1);
    const data = runtime.textureA!.image.data as Float32Array;
    let maxAbsZ = 0;
    let moved = 0;
    for (let i = 0; i < 1024; i++) {
      const z = data[i * 4 + 2];
      maxAbsZ = Math.max(maxAbsZ, Math.abs(z));
      if (z !== 0) moved++;
    }
    return { maxAbsZ, moved };
  };

  const solid = bake(VOLUME);
  assert.ok(solid.maxAbsZ > 5, `the baked body has depth (max |z| ${solid.maxAbsZ.toFixed(1)})`);
  assert.ok(solid.moved > 1024 * 0.5, `most particles leave the plane (${solid.moved}/1024)`);

  const flat = bake(undefined);
  assert.equal(flat.maxAbsZ, 0, 'with the law off the bake is exactly planar');
  assert.equal(flat.moved, 0);
});
