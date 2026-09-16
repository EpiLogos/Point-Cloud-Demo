import assert from 'node:assert/strict';
import { test } from './harness.ts';
import {
	measureInkBox,
	inkAspect,
	fittedSize,
	HEURISTIC_FACTORS,
} from '../src/engine/glyphMetrics.ts';

test('measureInkBox (node heuristic) returns a finite positive box', () => {
	const box = measureInkBox('A');
	for (const v of [box.width, box.height]) {
		assert.ok(Number.isFinite(v) && v > 0, `expected finite positive, got ${v}`);
	}
});

test('measureInkBox: OPEN is wider than O', () => {
	const o = measureInkBox('O');
	const open = measureInkBox('OPEN');
	assert.ok(open.width > o.width, `OPEN width ${open.width} should exceed O width ${o.width}`);
});

test('measureInkBox: empty and whitespace-only text fall back to O', () => {
	const o = measureInkBox('O');
	assert.deepEqual(measureInkBox(''), o);
	assert.deepEqual(measureInkBox('   '), o);
	assert.deepEqual(measureInkBox(' \n\t \r\n '), o);
});

test('measureInkBox: newlines collapse to spaces before measuring', () => {
	assert.deepEqual(measureInkBox('A\nB'), measureInkBox('A B'));
});

test('measureInkBox node heuristic follows the exported factors', () => {
	const { baseFontSize, inkHeight, singleCharWidth, advancePerChar } = HEURISTIC_FACTORS;
	const single = measureInkBox('W');
	assert.ok(Math.abs(single.width - singleCharWidth * baseFontSize) < 1e-9);
	assert.ok(Math.abs(single.height - inkHeight * baseFontSize) < 1e-9);
	const run = measureInkBox('WWW');
	assert.ok(Math.abs(run.width - 3 * advancePerChar * baseFontSize) < 1e-9);
});

test('measureInkBox accepts fontFamily/fontWeight arguments', () => {
	// Optional args are part of the API; in the node heuristic path they do not alter the box.
	assert.deepEqual(measureInkBox('O', 'Georgia', 400), measureInkBox('O'));
});

test('measureInkBox runs without any DOM global (node test env)', () => {
	assert.equal(typeof (globalThis as { document?: unknown }).document, 'undefined');
	let box: { width: number; height: number } | undefined;
	assert.doesNotThrow(() => {
		box = measureInkBox('Q');
	}, 'measureInkBox must guard for a missing document/canvas');
	assert.ok(box);
	assert.ok(box.width > 0 && box.height > 0);
});

test('inkAspect is width over height with a degenerate-input floor', () => {
	assert.ok(Math.abs(inkAspect({ width: 4, height: 2 }) - 2) < 1e-12);
	assert.ok(inkAspect({ width: 0, height: 5 }) >= 1e-3);
	assert.ok(inkAspect({ width: 6, height: 0 }) >= 1e-3);
	assert.ok(Number.isFinite(inkAspect({ width: NaN, height: 1 })));
});

test('fittedSize: matched prior aspect yields exactly the next glyph aspect', () => {
	// Box aspect 4/5 = 0.8 equals prevGlyphAspect, so stretch is 1.
	const out = fittedSize({ x: 4, y: 5 }, 0.8, 1.6);
	assert.ok(Math.abs(out.x / out.y - 1.6) < 1e-9, `got aspect ${out.x / out.y}`);
});

test('fittedSize: area is preserved when no clamping applies', () => {
	const box = { x: 3, y: 2 };
	const out = fittedSize(box, 1.5, 0.75);
	assert.ok(Math.abs(out.x * out.y - box.x * box.y) < 1e-9, `got area ${out.x * out.y}`);
});

test('fittedSize: the author\'s deliberate stretch survives the swap', () => {
	// Box stretched 2x wide vs the prior glyph (aspect 2 vs 1) stays 2x wide.
	const out = fittedSize({ x: 4, y: 2 }, 1, 0.5);
	assert.ok(Math.abs(out.x / out.y - 0.5 * 2) < 1e-9, `got aspect ${out.x / out.y}`);
});

test('fittedSize: unknown prior glyph (null) treats the box aspect as the truth', () => {
	const out = fittedSize({ x: 2, y: 3 }, null, 2);
	assert.ok(Math.abs(out.x / out.y - 2) < 1e-9, `got aspect ${out.x / out.y}`);
	assert.ok(Math.abs(out.x * out.y - 6) < 1e-9, 'null prior still preserves area');
});

test('fittedSize: huge areas clamp within bounds with the larger axis pinned to clampMax', () => {
	const out = fittedSize({ x: 1000, y: 1000 }, 1, 1, 0.01, 4);
	assert.ok(out.x >= 0.01 && out.x <= 4 + 1e-12 && out.y >= 0.01 && out.y <= 4 + 1e-12);
	assert.ok(Math.abs(out.x / out.y - 1) < 1e-9, 'square survives the uniform clamp');
	assert.ok(Math.abs(out.x - 4) < 1e-9, `larger axis should sit on clampMax, got ${out.x}`);
});

test('fittedSize: tiny areas clamp within bounds with the smaller axis lifted to clampMin', () => {
	const out = fittedSize({ x: 0.000001, y: 0.000001 }, 1, 1, 0.01, 4);
	assert.ok(out.x >= 0.01 - 1e-12 && out.x <= 4 && out.y >= 0.01 - 1e-12 && out.y <= 4);
	assert.ok(Math.abs(out.x / out.y - 1) < 1e-9, 'square survives the uniform clamp');
	assert.ok(Math.abs(out.x - 0.01) < 1e-9, `smaller axis should sit on clampMin, got ${out.x}`);
});

test('fittedSize: aspect beyond the clamp window degrades with both axes in bounds', () => {
	// Requested aspect 1e4 cannot fit inside [0.01, 4] (limit 400): pin the axes.
	const out = fittedSize({ x: 100, y: 0.01 }, 1, 10000, 0.01, 4);
	assert.ok(out.x >= 0.01 && out.x <= 4 && out.y >= 0.01 && out.y <= 4);
	assert.ok(Math.abs(out.x - 4) < 1e-9, `larger axis should stay pinned to clampMax, got ${out.x}`);
});

test('fittedSize never returns non-finite or non-positive axes', () => {
	const boxes = [{ x: 3, y: 2 }, { x: 0, y: 0 }, { x: NaN, y: 2 }, { x: 1, y: Infinity }];
	const prevs: Array<number | null> = [1.5, null, 0, -3, NaN];
	const nexts = [0.4, 0, NaN, Infinity];
	for (const box of boxes) {
		for (const prev of prevs) {
			for (const next of nexts) {
				const out = fittedSize(box, prev, next);
				for (const v of [out.x, out.y]) {
					assert.ok(Number.isFinite(v) && v > 0, `expected finite positive, got ${v}`);
					assert.ok(v >= 0.01 - 1e-12 && v <= 4 + 1e-12, `axis ${v} outside the default clamp window`);
				}
			}
		}
	}
});
