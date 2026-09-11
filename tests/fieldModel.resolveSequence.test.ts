/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import { test } from './harness.ts';
import { resolveSequence, makeFormation, makeLink, DEFAULT_SEQUENCE, applyEasing } from '../src/engine/fieldModel.ts';
import type { Entity } from '../src/engine/fieldModel.ts';

const linksAB = [makeLink({ kind: 'glyph', text: 'A' }), makeLink({ kind: 'glyph', text: 'B' })];

function timeEntity(overrides: Partial<Entity['sequence']> = {}): Entity {
  return makeFormation({
    id: 'ent_time',
    sequence: {
      ...DEFAULT_SEQUENCE,
      links: linksAB,
      advance: 'time',
      hold: 1,
      transition: 1,
      easing: 'smoothstep',
      order: 'loop',
      jitter: 0,
      rateMul: 1,
      phaseOffset: 0,
      ...overrides,
    },
  });
}

test("resolveSequence 'time': hold=1 transition=1 jitter=0 — mid-hold at t=0.5", () => {
  const e = timeEntity();
  const s = resolveSequence(e, 0.5, 0, 0, 0);
  assert.equal(s.linkIndex, 0);
  assert.equal(s.phase, 'hold');
  assert.equal(s.progress, 0);
});

test("resolveSequence 'time': mid-transition at t=1.5 eases progress 0.5 through applyEasing", () => {
  const e = timeEntity();
  const s = resolveSequence(e, 1.5, 0, 0, 0);
  assert.equal(s.phase, 'transition');
  assert.ok(Math.abs(s.progress - applyEasing(0.5, 'smoothstep')) < 1e-6);
});

test("resolveSequence 'time': t=2.2 has advanced one whole period into the next link (loop)", () => {
  const e = timeEntity();
  const s = resolveSequence(e, 2.2, 0, 0, 0);
  assert.equal(s.linkIndex, 1);
  assert.equal(s.step, 1);
});

test("resolveSequence 'time': rateMul=2 halves the effective period", () => {
  const base = timeEntity();
  const doubled = timeEntity({ rateMul: 2 });
  // simTime=1.1 at rateMul=2 must land on the same state as simTime=2.2 at rateMul=1.
  const sAtDoubleRate = resolveSequence(doubled, 1.1, 0, 0, 0);
  const sAtBaseRate = resolveSequence(base, 2.2, 0, 0, 0);
  assert.deepEqual(sAtDoubleRate, sAtBaseRate);
});

test("resolveSequence 'time': phaseOffset shifts the timeline by whole periods", () => {
  const base = timeEntity();
  const shifted = timeEntity({ phaseOffset: 1 }); // 1 cycle == 1 period == 2s here
  const sShiftedAtZero = resolveSequence(shifted, 0, 0, 0, 0);
  const sBaseAtOnePeriod = resolveSequence(base, 2, 0, 0, 0);
  assert.deepEqual(sShiftedAtZero, sBaseAtOnePeriod);
});

test("resolveSequence 'time': a single-link sequence is static regardless of simTime", () => {
  const e = makeFormation({ id: 'ent_static', sequence: { ...DEFAULT_SEQUENCE, advance: 'time', hold: 1, transition: 1 } });
  const atZero = resolveSequence(e, 0, 0, 0, 0);
  const atLarge = resolveSequence(e, 12345.678, 9, 0.7, 0.3);
  assert.deepEqual(atZero, { linkIndex: 0, nextIndex: 0, progress: 0, phase: 'hold', step: 0, linkCount: 1 });
  assert.deepEqual(atLarge, atZero);
});

// --------------------------------------------------------------- morphCycle

function cycleEntity(overrides: Partial<Entity['sequence']> = {}): Entity {
  return makeFormation({
    id: 'ent_cycle',
    sequence: {
      ...DEFAULT_SEQUENCE,
      links: [makeLink({ kind: 'glyph', text: 'A' }), makeLink({ kind: 'glyph', text: 'B' }), makeLink({ kind: 'glyph', text: 'C' })],
      advance: 'morphCycle',
      easing: 'linear',
      rateMul: 1,
      phaseOffset: 0,
      ...overrides,
    },
  });
}

test("resolveSequence 'morphCycle': drivePhase = 2*PI*k + PI resolves step k, cycleFraction 0.5, holdRatio 0 eased", () => {
  const e = cycleEntity();
  const k = 3;
  const drivePhase = 2 * Math.PI * k + Math.PI;
  const s = resolveSequence(e, 0, drivePhase, 0, 0);
  assert.equal(s.step, k);
  assert.equal(s.phase, 'transition');
  assert.ok(Math.abs(s.progress - applyEasing(0.5, 'linear')) < 1e-6);
});

test("resolveSequence 'morphCycle': holdRatio 0.5 keeps progress 0 for the first half of the cycle", () => {
  const e = cycleEntity();
  const k = 3;
  for (const fracOfCycle of [0, 0.1, 0.25, 0.49]) {
    const drivePhase = 2 * Math.PI * (k + fracOfCycle);
    const s = resolveSequence(e, 0, drivePhase, 0, 0.5);
    assert.equal(s.phase, 'hold', `fracOfCycle=${fracOfCycle}`);
    assert.equal(s.progress, 0, `fracOfCycle=${fracOfCycle}`);
  }
});

// -------------------------------------------------------------------- off

test("resolveSequence 'off': progress is the clamped manual morph value", () => {
  const e = cycleEntity({ advance: 'off' });
  assert.equal(resolveSequence(e, 0, 0, 0.3, 0).progress, 0.3);
  assert.equal(resolveSequence(e, 0, 0, -0.5, 0).progress, 0);
  assert.equal(resolveSequence(e, 0, 0, 1.5, 0).progress, 1);
  const s = resolveSequence(e, 0, 0, 0.3, 0);
  assert.equal(s.linkIndex, 0);
  assert.equal(s.phase, 'transition');
  assert.equal(s.step, 0);
});
