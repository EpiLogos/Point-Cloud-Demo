/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import { test } from './harness.ts';
import { layoutPartitions, makeFormation, makePin, MAX_FORMATIONS } from '../src/engine/fieldModel.ts';

function assertContiguousCoverage(parts: { start: number; end: number }[], particleCount: number) {
  let cursor = 0;
  for (const p of parts) {
    assert.equal(p.start, cursor, `partition should start where the previous one ended (start=${p.start}, expected ${cursor})`);
    assert.ok(p.end >= p.start, 'partition end must be >= start');
    cursor = p.end;
  }
  assert.equal(cursor, particleCount, `partitions must cover exactly particleCount (covered ${cursor}, expected ${particleCount})`);
}

test('layoutPartitions: shares produce contiguous non-overlapping ranges covering exactly particleCount', () => {
  const entities = [
    makeFormation({ id: 'a', share: 1 }),
    makeFormation({ id: 'b', share: 1 }),
    makeFormation({ id: 'c', share: 2 }),
  ];
  const particleCount = 1000;
  const parts = layoutPartitions(entities, particleCount);
  assert.equal(parts.length, 3);
  assertContiguousCoverage(parts, particleCount);
  // shares 1:1:2 of 1000 -> 250, 250, 500 (last absorbs any rounding remainder)
  assert.equal(parts[0].end - parts[0].start, 250);
  assert.equal(parts[1].end - parts[1].start, 250);
  assert.equal(parts[2].end - parts[2].start, 500);
  assert.deepEqual(
    parts.map((p) => p.entityId),
    ['a', 'b', 'c']
  );
});

test('layoutPartitions: disabled formations and pin entities are excluded from the partition', () => {
  const entities = [
    makeFormation({ id: 'enabled1', share: 1, enabled: true }),
    makeFormation({ id: 'disabled', share: 1, enabled: false }),
    makePin({ id: 'pin1', share: 1, enabled: true }),
    makeFormation({ id: 'enabled2', share: 1, enabled: true }),
  ];
  const particleCount = 400;
  const parts = layoutPartitions(entities, particleCount);
  assert.deepEqual(
    parts.map((p) => p.entityId),
    ['enabled1', 'enabled2']
  );
  assertContiguousCoverage(parts, particleCount);
  assert.equal(parts[0].end - parts[0].start, 200);
  assert.equal(parts[1].end - parts[1].start, 200);
});

test('layoutPartitions: more than MAX_FORMATIONS enabled formations are capped', () => {
  const entities = Array.from({ length: MAX_FORMATIONS + 5 }, (_, i) => makeFormation({ id: `f${i}`, share: 1 }));
  const particleCount = 2000;
  const parts = layoutPartitions(entities, particleCount);
  assert.equal(parts.length, MAX_FORMATIONS, 'must cap at MAX_FORMATIONS partitions');
  assert.deepEqual(
    parts.map((p) => p.entityId),
    entities.slice(0, MAX_FORMATIONS).map((e) => e.id)
  );
  assertContiguousCoverage(parts, particleCount);
});

test('layoutPartitions: a single enabled formation receives the entire particle range', () => {
  const entities = [makeFormation({ id: 'solo', share: 1 })];
  const particleCount = 12345;
  const parts = layoutPartitions(entities, particleCount);
  assert.equal(parts.length, 1);
  assert.equal(parts[0].start, 0);
  assert.equal(parts[0].end, particleCount);
});

test('layoutPartitions: no enabled formations yields an empty layout', () => {
  const entities = [makeFormation({ id: 'off', enabled: false }), makePin({ id: 'pin' })];
  assert.deepEqual(layoutPartitions(entities, 1000), []);
});
