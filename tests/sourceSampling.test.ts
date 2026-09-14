/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import { test } from './harness.ts';
import {
	computeInkField,
	sampleImageSource,
	sampleAlphaSource,
	candidatesFromInkField,
	summarizeAnalysis,
	DEFAULT_SOURCE_THRESHOLD,
} from '../src/engine/sourceSampling.ts';

/** Synthetic RGBA buffer: white paper, painted rectangles in canvas coords (y down). */
function canvas(w: number, h: number, paper: [number, number, number] = [255, 255, 255]) {
	const px = new Uint8ClampedArray(w * h * 4);
	for (let i = 0; i < w * h; i++) {
		px[i * 4] = paper[0];
		px[i * 4 + 1] = paper[1];
		px[i * 4 + 2] = paper[2];
		px[i * 4 + 3] = 255;
	}
	const rect = (x0: number, y0: number, x1: number, y1: number, rgb: [number, number, number], alpha = 255) => {
		for (let y = y0; y < y1; y++) {
			for (let x = x0; x < x1; x++) {
				const i = (y * w + x) * 4;
				px[i] = rgb[0];
				px[i + 1] = rgb[1];
				px[i + 2] = rgb[2];
				px[i + 3] = alpha;
			}
		}
	};
	return { px, w, h, rect };
}

function bounds(candidates: Array<{ x: number; y: number }>) {
	let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
	for (const c of candidates) {
		x0 = Math.min(x0, c.x);
		x1 = Math.max(x1, c.x);
		y0 = Math.min(y0, c.y);
		y1 = Math.max(y1, c.y);
	}
	return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0 };
}

test('dark ink on light paper: auto polarity samples the strokes, not the background', () => {
	const c = canvas(120, 90);
	c.rect(30, 20, 90, 70, [10, 10, 10]);
	const { candidates, analysis } = sampleImageSource(c.px, c.w, c.h, { threshold: 0.3 });
	assert.equal(analysis.polarity, 'darkInk');
	assert.equal(analysis.polarityAuto, true);
	assert.equal(analysis.backgroundIsTransparent, false);
	// Crop hugs the subject with only the small margin, not the full frame.
	assert.ok(analysis.contentPx.w < 70, `content width ${analysis.contentPx.w} should hug the subject`);
	assert.ok(analysis.contentPx.h < 60, `content height ${analysis.contentPx.h} should hug the subject`);
	const b = bounds(candidates);
	assert.ok(b.w > 0 && b.h > 0);
	// Every candidate sits inside the subject region (in stage units the crop maps to ≤400).
	assert.ok(Math.max(Math.abs(b.x0), Math.abs(b.x1)) <= 201);
	assert.ok(candidates.length > 100);
	assert.equal(analysis.fallback, false);
	assert.ok(analysis.coverage > 0.9, `solid square coverage ${analysis.coverage}`);
});

test('light ink on dark paper: auto polarity finds the subject without manual invert', () => {
	const c = canvas(120, 90, [8, 10, 14]);
	c.rect(30, 20, 90, 70, [235, 240, 245]);
	const { candidates, analysis } = sampleImageSource(c.px, c.w, c.h, { threshold: 0.3 });
	assert.equal(analysis.polarity, 'lightInk');
	assert.equal(analysis.fallback, false);
	assert.ok(candidates.length > 100);
	const b = bounds(candidates);
	assert.ok(Math.abs(b.w - b.h) / Math.max(b.w, b.h) < 0.25, 'square subject stays square');
});

test('legacy invert flag forces dark-ink polarity even on a dark frame', () => {
	const c = canvas(80, 80, [10, 10, 10]);
	c.rect(20, 20, 60, 60, [230, 230, 230]);
	const { analysis } = sampleImageSource(c.px, c.w, c.h, { threshold: 0.3, invert: true });
	assert.equal(analysis.polarity, 'darkInk');
	assert.equal(analysis.polarityAuto, false);
	// Forced wrong polarity isolates the frame, not the subject → auto-flip guard
	// or fallback must keep the pool non-empty and say so.
	assert.ok(analysis.fallback || analysis.coverage < 0.5);
});

test('silhouette cutout keeps enclosed regions with the subject', () => {
	const c = canvas(120, 120);
	// Ring: dark frame with a white enclosed interior.
	c.rect(30, 30, 90, 90, [10, 10, 10]);
	c.rect(42, 42, 78, 78, [250, 250, 250]);
	const field = computeInkField(c.px, c.w, c.h, { mode: 'silhouette', threshold: 0.3 });
	const cut = candidatesFromInkField(field, { mode: 'silhouette', threshold: 0.3 });
	// The enclosed interior centre must carry ink (flood fill cannot reach it).
	assert.ok(cut.length > 100);
	const nearCentre = (list: Array<{ x: number; y: number }>) => list.some(p => Math.abs(p.x) < 25 && Math.abs(p.y) < 25);
	assert.ok(nearCentre(cut), 'silhouette fills the enclosed interior');
	// Luminance mode by contrast samples only the frame strokes: no centre points.
	const lum = sampleImageSource(c.px, c.w, c.h, { mode: 'luminance', threshold: 0.3 });
	assert.ok(!nearCentre(lum.candidates), 'luminance mode keeps the interior hollow');
});

test('silhouette leaves the small sealed cells of wireframe art open', () => {
	const c = canvas(120, 120);
	// A mesh of 4px strokes on a 9px pitch: pockets of ~5×5 px must not fill.
	for (let v = 24; v < 96; v += 9) c.rect(v, 24, v + 4, 96, [10, 10, 10]);
	for (let y = 24; y < 96; y += 9) c.rect(24, y, 96, y + 4, [10, 10, 10]);
	const sil = sampleImageSource(c.px, c.w, c.h, { mode: 'silhouette', threshold: 0.3 });
	const lum = sampleImageSource(c.px, c.w, c.h, { mode: 'luminance', threshold: 0.3 });
	assert.ok(sil.analysis.fallback === false);
	assert.ok(
		sil.candidates.length < lum.candidates.length * 1.6,
		`mesh silhouette (${sil.candidates.length}) should stay near the stroke count (${lum.candidates.length})`
	);
});

test('transparent cutouts sample alpha, not composited colour', () => {
	const px = new Uint8ClampedArray(60 * 60 * 4); // fully transparent, black RGB
	const rect = (x0: number, y0: number, x1: number, y1: number) => {
		for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
			const i = (y * 60 + x) * 4;
			px[i] = 255; px[i + 1] = 0; px[i + 2] = 0; px[i + 3] = 255;
		}
	};
	rect(15, 15, 45, 45);
	const { candidates, analysis } = sampleImageSource(px, 60, 60, { threshold: 0.3 });
	assert.equal(analysis.backgroundIsTransparent, true);
	assert.ok(candidates.length > 60);
	const b = bounds(candidates);
	assert.ok(Math.abs(b.w - b.h) / Math.max(b.w, b.h) < 0.2, 'square subject stays square');
});

test('stage mapping is centred with y up', () => {
	const c = canvas(100, 100);
	c.rect(20, 10, 80, 60, [0, 0, 0]); // subject sits high in the frame
	const { candidates } = sampleImageSource(c.px, c.w, c.h, { threshold: 0.3 });
	const b = bounds(candidates);
	assert.ok(Math.abs((b.x0 + b.x1) / 2) < 6, `subject centred horizontally (${(b.x0 + b.x1) / 2})`);
	// Top of the canvas content must map to positive y.
	assert.ok(b.y1 > 0 && b.y0 < 0);
	assert.ok(b.y1 > b.y0);
});

test('empty and uniform frames fall back to a marked visibility ring', () => {
	const blank = canvas(64, 64);
	const { candidates, analysis } = sampleImageSource(blank.px, blank.w, blank.h, { threshold: 0.3 });
	assert.equal(analysis.fallback, true);
	assert.equal(candidates.length, 500);
	const summary = summarizeAnalysis(analysis, 'image');
	assert.match(summary, /no ink detected/);
	assert.ok(summary.includes('source active'), 'status stays capture-compatible');
});

test('threshold auto-recovery rescues an over-tight threshold', () => {
	const c = canvas(120, 90);
	c.rect(40, 25, 80, 65, [90, 90, 90]); // faint ink on white
	const { analysis } = sampleImageSource(c.px, c.w, c.h, { threshold: 0.85 });
	assert.equal(analysis.fallback, false);
	assert.ok(analysis.threshold < 0.85, `recovered threshold ${analysis.threshold}`);
	assert.ok(analysis.candidates > 0);
});

test('alpha source (ASCII drawing) samples drawn marks and reports mode alpha', () => {
	const px = new Uint8ClampedArray(80 * 40 * 4);
	for (let y = 10; y < 30; y++) for (let x = 10; x < 70; x++) {
		const i = (y * 80 + x) * 4;
		px[i] = 255; px[i + 1] = 255; px[i + 2] = 255; px[i + 3] = 255;
	}
	const { candidates, analysis } = sampleAlphaSource(px, 80, 40, {});
	assert.equal(analysis.mode, 'alpha');
	assert.ok(candidates.length > 100);
	const b = bounds(candidates);
	assert.ok(b.w > b.h, 'wide drawing keeps wide aspect');
	const summary = summarizeAnalysis(analysis, 'ascii');
	assert.match(summary, /ASCII source active/);
});

test('analysis stays within declared bounds for pathological inputs', () => {
	const tiny = canvas(6, 6);
	tiny.rect(2, 2, 4, 4, [0, 0, 0]);
	const { analysis } = sampleImageSource(tiny.px, tiny.w, tiny.h, { threshold: DEFAULT_SOURCE_THRESHOLD });
	assert.ok(Number.isFinite(analysis.coverage) && analysis.coverage >= 0 && analysis.coverage <= 1);
	assert.ok(analysis.threshold >= 0.05 && analysis.threshold <= 1);
	assert.ok(analysis.candidates > 0);
});

test('fractional ASCII cell sizes cannot create non-finite source candidates',()=>{
 const w=80,h=90,px=new Uint8ClampedArray(w*h*4);
 for(let y=10;y<80;y++)for(let x=10;x<25;x++){const p=(y*w+x)*4;px[p]=px[p+1]=px[p+2]=px[p+3]=255;}
 const sampled=sampleAlphaSource(px,w,h,{cell:{w:19.2,h:36.8}});
 assert.ok(sampled.candidates.length>0);assert.ok(sampled.candidates.every(p=>[p.x,p.y,p.density].every(Number.isFinite)));
 const empty=sampleAlphaSource(new Uint8ClampedArray(w*h*4),w,h,{cell:{w:19.2,h:36.8}});assert.equal(empty.candidates.length,0);assert.equal(empty.analysis.fallback,true);
});
