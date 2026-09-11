/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import { test } from './harness.ts';
import { migrateLegacyFieldConfig, pinsToPlacedPoints, normaliseEntity } from '../src/engine/fieldModel.ts';
import { CANONICAL_CHAKRAS } from '../src/engine/chakraSystem.ts';

test('migrateLegacyFieldConfig (a): legacy glyph A/B + autoMorph builds one 2-link pingpong main formation', () => {
  const { entities } = migrateLegacyFieldConfig({ glyph: ['A', 'B'], autoMorph: true, autoMorphDuration: 4 } as any);
  assert.equal(entities.length, 1);
  const main = entities[0];
  assert.equal(main.id, 'ent_main');
  assert.equal(main.sequence.links.length, 2);
  assert.equal(main.sequence.links[0].shape.text, 'A');
  assert.equal(main.sequence.links[1].shape.text, 'B');
  assert.equal(main.sequence.advance, 'time');
  assert.equal(main.sequence.order, 'pingpong');
});

test('migrateLegacyFieldConfig (a): autoMorph === false disables advance', () => {
  const { entities } = migrateLegacyFieldConfig({ glyph: ['A', 'B'], autoMorph: false } as any);
  assert.equal(entities[0].sequence.advance, 'off');
});

test('migrateLegacyFieldConfig (b): legacy chaining builds links from the chain array', () => {
  const { entities } = migrateLegacyFieldConfig({
    chaining: {
      enabled: true,
      chain: ['▲', '■', '⬟'],
      mode: 'loop',
      stepHoldDuration: 1,
      transitionDuration: 2.2,
      easing: 'smoothstep',
      timingJitter: 0,
      disperseImpulse: 0.6,
    },
  } as any);
  assert.equal(entities.length, 1);
  const main = entities[0];
  assert.equal(main.id, 'ent_main');
  assert.deepEqual(
    main.sequence.links.map((l) => l.shape.text),
    ['▲', '■', '⬟']
  );
  assert.equal(main.sequence.advance, 'time');
  assert.equal(main.sequence.order, 'loop');
});

test("migrateLegacyFieldConfig (b): chaining.advance === 'morphCycle' carries through", () => {
  const { entities } = migrateLegacyFieldConfig({
    chaining: { enabled: true, chain: ['▲', '■', '⬟'], mode: 'loop', advance: 'morphCycle' },
  } as any);
  assert.equal(entities[0].sequence.advance, 'morphCycle');
});

test('migrateLegacyFieldConfig (c): legacy spatialChakra (7 canonical nodes, sequentialMorph, cymatics) builds 7 stationed formations', () => {
  const { entities, composition, cymatics } = migrateLegacyFieldConfig({
    spatialChakra: {
      enabled: true,
      nodes: CANONICAL_CHAKRAS,
      playbackMode: 'sequentialMorph',
      geometryMode: 'cymatics',
    },
  } as any);

  assert.equal(entities.length, 7);
  // CANONICAL_CHAKRAS is listed Crown -> Root; stationIndex is the reverse: Root=0 .. Crown=6.
  assert.equal(entities[0].chakraId, 'sahasrara'); // Crown
  assert.equal(entities[0].stationIndex, 6);
  assert.equal(entities[6].chakraId, 'muladhara'); // Root
  assert.equal(entities[6].stationIndex, 0);
  // stationIndex descends monotonically from Crown(6) to Root(0)
  assert.deepEqual(
    entities.map((e) => e.stationIndex),
    [6, 5, 4, 3, 2, 1, 0]
  );

  assert.equal(composition.orchestration.mode, 'focus');
  assert.equal(cymatics.enabled, true);
  assert.equal(cymatics.dominance, 1);
});

test('migrateLegacyFieldConfig (d): placedPoints become pin entities preserving id/x/y/z/radius/strength/mode', () => {
  const pins = [{ id: 'pin_1', name: 'P1', x: 10, y: 20, z: 30, radius: 100, strength: 2, mode: 'attract' as const, active: true }];
  const { entities } = migrateLegacyFieldConfig({ interaction: { placedPoints: pins } } as any);
  const pinEntities = entities.filter((e) => e.kind === 'pin');
  assert.equal(pinEntities.length, 1);
  const p = pinEntities[0];
  assert.equal(p.id, 'pin_1');
  assert.equal(p.x, 10);
  assert.equal(p.y, 20);
  assert.equal(p.z, 30);
  assert.equal(p.forces.radius, 100);
  assert.equal(p.forces.strength, 2);
  assert.equal(p.forces.mode, 'attract');
});

test('migrateLegacyFieldConfig (e): a config that already has entities is normalised, not re-derived', () => {
  const custom = [normaliseEntity({ id: 'custom1', kind: 'formation', name: 'Custom' })];
  const { entities } = migrateLegacyFieldConfig({
    entities: custom,
    glyph: ['X', 'Y'], // would derive ent_main if entities were ignored
    chaining: { enabled: true, chain: ['Z'] }, // would also derive ent_main if entities were ignored
  } as any);
  assert.equal(entities.length, 1);
  assert.equal(entities[0].id, 'custom1');
  assert.equal(entities[0].name, 'Custom');
});

test('migrateLegacyFieldConfig (f): pinsToPlacedPoints round-trips the pins built from placedPoints', () => {
  const pins = [{ id: 'pin_1', name: 'P1', x: 10, y: 20, z: 30, radius: 100, strength: 2, mode: 'attract' as const, active: true }];
  const { entities } = migrateLegacyFieldConfig({ interaction: { placedPoints: pins } } as any);
  const roundTripped = pinsToPlacedPoints(entities);
  assert.equal(roundTripped.length, 1);
  assert.equal(roundTripped[0].id, 'pin_1');
  assert.equal(roundTripped[0].x, 10);
  assert.equal(roundTripped[0].y, 20);
  assert.equal(roundTripped[0].z, 30);
  assert.equal(roundTripped[0].radius, 100);
  assert.equal(roundTripped[0].strength, 2);
  assert.equal(roundTripped[0].mode, 'attract');
  assert.equal(roundTripped[0].active, true);
});
