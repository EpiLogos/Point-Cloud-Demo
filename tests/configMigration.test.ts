/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import { test } from './harness.ts';
import { migrateConfig, migrateSnapshot, createSnapshot, CONFIG_SCHEMA_VERSION } from '../src/engine/configMigration.ts';

test('CONFIG_SCHEMA_VERSION is 5', () => {
  assert.equal(CONFIG_SCHEMA_VERSION, 5);
});

test('migrateSnapshot: a v0 legacy snapshot migrates to schemaVersion 5 with angle converted from radians to degrees', () => {
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
  assert.equal(snap!.schemaVersion, 5);
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

test('migrateConfig / createSnapshot / migrateSnapshot: a v5 snapshot round-trips through JSON', () => {
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

test('migrateConfig: pins/sequence survive a round trip through a v5 snapshot with custom entities', () => {
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


test('migrateConfig: v4 chakra identity becomes semantic bindings without enabling new spatial colour', () => {
  const raw:any={
    entities:[{
      id:'ent-heart',name:'Heart',kind:'formation',enabled:true,x:0,y:0,z:0,scale:1,share:1,
      shape:{kind:'yantra',yantraId:'anahata'},sequence:{links:[],advance:'off',hold:1,transition:1,easing:'smoothstep',order:'loop',jitter:0,impulse:0,phaseOffset:0,rateMul:1},
      forces:{mode:'vortex',strength:1,radius:220,spin:.4},tint:'#00ff99',tintWeight:1,chakraId:'anahata',stationIndex:3,
    }],
    composition:{plane:'vertical',orchestration:{mode:'focus',order:'listed',dwell:1,glide:1,followStation:true,focusTintWeight:.3},entityTintWeight:.8},
    cymatics:{enabled:true,engine:'resonator',followFocus:true},
  };
  const migrated=migrateConfig(raw,4);
  assert.equal(migrated.semanticField?.enabled,true);
  const binding=migrated.semanticField!.bindings[0];
  assert.equal(binding.semanticNodeId,'anahata');
  assert.deepEqual(binding.carriers,[{kind:'entity',id:'ent-heart'}]);
  assert.equal(binding.color?.enabled,false,'migration must preserve old partition-tint appearance');
  assert.deepEqual(migrated.resonanceDrive,{kind:'semanticFocus',profileId:'chakra-seven-v1'});
  assert.equal(migrated.entities![0].tint,'#00ff99');
});

test('migrateConfig: explicit v5 semantic colour and resonance drive round-trip unchanged', () => {
  const base=migrateConfig({});
  const semantic={enabled:true,profile:{kind:'chakra' as const,profileId:'chakra-seven-v1'},affinity:{method:'modalProjection' as const,bandwidth:.2},globalColorGain:.7,bindings:[{
    id:'b1',semanticNodeId:'anahata',enabled:true,resonance:{gain:.9},carriers:[{kind:'entity' as const,id:'ent_main'}],
    color:{enabled:true,colorSource:'canonical' as const,gain:.8,radius:{source:'independent' as const,value:180},falloff:'gaussian' as const,metric:'world3d' as const,blend:'weighted' as const,activation:'resonanceAffinity' as const},
  }]};
  const snap=createSnapshot('v5',{...base,semanticField:semantic,resonanceDrive:{kind:'semanticFocus',profileId:'chakra-seven-v1'}});
  const back=migrateSnapshot(JSON.parse(JSON.stringify(snap)),0)!;
  assert.deepEqual(back.config.semanticField,semantic);
  assert.deepEqual(back.config.resonanceDrive,{kind:'semanticFocus',profileId:'chakra-seven-v1'});
});
