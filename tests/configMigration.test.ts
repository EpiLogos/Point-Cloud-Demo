/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import { test } from './harness.ts';
import { migrateConfig, migrateSnapshot, createSnapshot, CONFIG_SCHEMA_VERSION } from '../src/engine/configMigration.ts';

test('CONFIG_SCHEMA_VERSION is 4', () => {
  assert.equal(CONFIG_SCHEMA_VERSION, 4);
});

test('migrateSnapshot: a v0 legacy snapshot migrates to schemaVersion 4 with angle converted from radians to degrees', () => {
  const rawV0 = {
    name: 'legacy',
    config: {
      glyph: ['A', 'B'],
      color: { angle: 0.785 }, // radians in a pre-v2 snapshot
      chaining: { enabled: true, chain: ['▲', '■', '⬟'], mode: 'loop' },
      interaction: {
        placedPoints: [{ id: 'p1', x: 1, y: 2, z: 3, radius: 50, strength: 1, mode: 'repel', active: true }],
      },
    },
    // no schemaVersion field at all — legacy unversioned snapshot
  };

  const snap = migrateSnapshot(rawV0, 0);
  assert.ok(snap);
  assert.equal(snap!.schemaVersion, 4);
  assert.ok(Math.abs(snap!.config.color!.angle - 44.98) < 0.01, `expected ~44.98deg, got ${snap!.config.color!.angle}`);

  // chaining migrated into entities
  assert.ok(Array.isArray(snap!.config.entities));
  const main = snap!.config.entities!.find((e) => e.id === 'ent_main');
  assert.ok(main, 'expected the chain-derived ent_main formation');
  assert.deepEqual(
    main!.sequence.links.map((l) => l.shape.text),
    ['▲', '■', '⬟']
  );

  // pin from placedPoints also present
  const pin = snap!.config.entities!.find((e) => e.kind === 'pin');
  assert.ok(pin, 'expected a pin entity migrated from placedPoints');

  assert.ok(snap!.config.composition, 'composition must be present after migration');
  assert.ok(snap!.config.cymatics, 'cymatics must be present after migration');
  assert.deepEqual(snap!.config.automations, []);
});

test('migrateSnapshot: an angle already in degrees (>= v2) is left unchanged', () => {
  const raw = { schemaVersion: 2, config: { color: { angle: 120 } } };
  const snap = migrateSnapshot(raw, 0);
  assert.equal(snap!.config.color!.angle, 120);
});

test('migrateConfig / createSnapshot / migrateSnapshot: a v4 snapshot round-trips through JSON', () => {
  const base = migrateConfig({});
  const snapshot = createSnapshot('roundtrip', base);
  assert.equal(snapshot.schemaVersion, CONFIG_SCHEMA_VERSION);

  const throughJson = JSON.parse(JSON.stringify(snapshot));
  const migratedBack = migrateSnapshot(throughJson, 0);
  assert.ok(migratedBack);

  assert.deepEqual(migratedBack!.config.entities, base.entities);
  assert.deepEqual(migratedBack!.config.composition, base.composition);
  assert.deepEqual(migratedBack!.config.cymatics, base.cymatics);

  // normaliseEntity must preserve ids across the round trip (not regenerate them)
  assert.deepEqual(
    migratedBack!.config.entities!.map((e) => e.id),
    base.entities!.map((e) => e.id)
  );
});

test('migrateConfig: pins/sequence survive a round trip through a v4 snapshot with custom entities', () => {
  const base = migrateConfig({});
  const customized = {
    ...base,
    entities: [
      ...(base.entities || []),
      {
        id: 'ent_extra',
        name: 'Extra',
        kind: 'formation' as const,
        enabled: true,
        x: 12,
        y: -34,
        z: 0,
        scale: 1,
        share: 2,
        shape: { kind: 'glyph' as const, text: 'Q' },
        sequence: { ...base.entities![0].sequence, links: [] },
        forces: { mode: 'attract' as const, strength: 3, radius: 250, spin: 0 },
        tint: '#abcdef',
        tintWeight: 0.4,
      },
    ],
  };

  const snapshot = createSnapshot('with-extra', customized);
  const throughJson = JSON.parse(JSON.stringify(snapshot));
  const migratedBack = migrateSnapshot(throughJson, 0);

  assert.deepEqual(migratedBack!.config.entities, customized.entities);
});
