/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import { test } from './harness.ts';
import { orderedIndex } from '../src/engine/fieldModel.ts';

test('orderedIndex: loop sequence for count 4 over 12 steps', () => {
  const count = 4;
  const got = Array.from({ length: 12 }, (_, s) => orderedIndex(s, count, 'loop'));
  assert.deepEqual(got, [0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3]);
});

test('orderedIndex: pingpong sequence for count 4 over 12 steps', () => {
  const count = 4;
  const got = Array.from({ length: 12 }, (_, s) => orderedIndex(s, count, 'pingpong'));
  // period = (count-1)*2 = 6: 0,1,2,3,2,1, 0,1,2,3,2,1, ...
  assert.deepEqual(got, [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1]);
});

test('orderedIndex: random order is deterministic for the same seed', () => {
  const count = 5;
  const seed = 42;
  const a = Array.from({ length: 200 }, (_, s) => orderedIndex(s, count, 'random', seed));
  const b = Array.from({ length: 200 }, (_, s) => orderedIndex(s, count, 'random', seed));
  assert.deepEqual(a, b, 'same (step, count, order, seed) must always produce the same index');
});

test('orderedIndex: random order with a different seed generally diverges from another seed', () => {
  const count = 6;
  const a = Array.from({ length: 50 }, (_, s) => orderedIndex(s, count, 'random', 1));
  const b = Array.from({ length: 50 }, (_, s) => orderedIndex(s, count, 'random', 999));
  assert.notDeepEqual(a, b, 'different seeds should (almost always) diverge');
});

test('orderedIndex: count <= 1 always resolves to index 0', () => {
  assert.equal(orderedIndex(0, 1, 'loop'), 0);
  assert.equal(orderedIndex(50, 1, 'pingpong'), 0);
  assert.equal(orderedIndex(50, 0, 'random', 3), 0);
});

/**
 * SPEC: "random never repeats the same index consecutively over 200 steps."
 *
 * orderedIndex's anti-repeat guard compares the raw hash-derived candidate for
 * step `s` against the RAW hash-derived candidate for step `s - 1`:
 *
 *   let idx = Math.floor(hash01(s + seed) * count);
 *   const prev = s > 0 ? Math.floor(hash01(s - 1 + seed) * count) : -1;
 *   if (idx === prev) idx = (idx + 1) % count;
 *
 * `prev` is NOT the value orderedIndex actually RETURNED for step s-1 — if
 * step s-1's own candidate had itself collided with step s-2 and been bumped
 * by +1, the bump is invisible to step s's guard. So two adjacent *returned*
 * indices can still collide. This is empirically reproducible: for every seed
 * tried (0, 1, 7, 42, 100, 12345) and count in {3,4,5,8}, a consecutive repeat
 * shows up well within the first 200 steps (as early as step 2).
 */
test(
  'orderedIndex: random order never repeats the same index consecutively over 200 steps',
  () => {
    const count = 5;
    const seed = 7;
    let prev = -1;
    for (let s = 0; s < 200; s++) {
      const idx = orderedIndex(s, count, 'random', seed);
      assert.notEqual(idx, prev, `step ${s} repeated the previous index ${prev}`);
      prev = idx;
    }
  }
);
