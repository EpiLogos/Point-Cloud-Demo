/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import { test } from './harness.ts';
import { resolveFocus, DEFAULT_COMPOSITION, applyEasing } from '../src/engine/fieldModel.ts';
import type { Composition } from '../src/engine/fieldModel.ts';

function comp(overrides: Partial<Composition['orchestration']>): Composition {
  return { ...DEFAULT_COMPOSITION, orchestration: { ...DEFAULT_COMPOSITION.orchestration, ...overrides } };
}

test('resolveFocus: parallel orchestration mode resolves to null', () => {
  assert.equal(resolveFocus(3, comp({ mode: 'parallel' }), 5), null);
});

test('resolveFocus: zero entities resolves to null even in focus mode', () => {
  assert.equal(resolveFocus(0, comp({ mode: 'focus' }), 5), null);
});

test('resolveFocus: dwell=1 glide=1 count=3 listed — t=0.5 mid-dwell on index 0', () => {
  const c = comp({ mode: 'focus', order: 'listed', dwell: 1, glide: 1 });
  const s = resolveFocus(3, c, 0.5);
  assert.ok(s);
  assert.equal(s!.index, 0);
  assert.equal(s!.blend, 0);
});

test('resolveFocus: dwell=1 glide=1 count=3 listed — t=1.5 mid-glide, blend = smoothstep(0.5)', () => {
  const c = comp({ mode: 'focus', order: 'listed', dwell: 1, glide: 1 });
  const s = resolveFocus(3, c, 1.5);
  assert.ok(s);
  const smoothstep05 = 0.5 * 0.5 * (3 - 2 * 0.5);
  assert.ok(Math.abs(s!.blend - smoothstep05) < 1e-9);
});

test('resolveFocus: dwell=1 glide=1 count=3 listed — t=2.5 has moved on to index 1', () => {
  const c = comp({ mode: 'focus', order: 'listed', dwell: 1, glide: 1 });
  const s = resolveFocus(3, c, 2.5);
  assert.ok(s);
  assert.equal(s!.index, 1);
});

test('resolveFocus: reverse order maps step 0 to the last index (0 -> count-1)', () => {
  const c = comp({ mode: 'focus', order: 'reverse', dwell: 1, glide: 1 });
  const s = resolveFocus(3, c, 0.5);
  assert.ok(s);
  assert.equal(s!.index, 2);
});

test('resolveFocus: pingpong order never jumps directly from the last index to the first', () => {
  const c = comp({ mode: 'focus', order: 'pingpong', dwell: 0.1, glide: 0.1 });
  const count = 3;
  let prevIndex = -1;
  let sawDirectWrap = false;
  const period = 0.2;
  for (let step = 0; step < 60; step++) {
    // sample well inside the dwell phase of each period so index is unambiguous
    const t = step * period + period * 0.05;
    const s = resolveFocus(count, c, t);
    assert.ok(s);
    if (prevIndex === count - 1 && s!.index === 0) sawDirectWrap = true;
    prevIndex = s!.index;
  }
  assert.equal(sawDirectWrap, false, 'pingpong must visit the middle index between the last and first');
});
