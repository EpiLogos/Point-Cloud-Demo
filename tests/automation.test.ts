/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import { test } from './harness.ts';
import { readPath, writePath, applyAutomations, evaluateLane, createAutomationRuntime } from '../src/engine/automation.ts';
import { makeFormation } from '../src/engine/fieldModel.ts';
import type { AutomationLane } from '../src/engine/types.ts';

test('readPath: reads a nested dotted path', () => {
  const obj = { a: { b: { c: 42 } } };
  assert.equal(readPath(obj, 'a.b.c'), 42);
  assert.equal(readPath(obj, 'a.b.missing'), undefined);
  assert.equal(readPath(obj, 'x.y.z'), undefined);
});

test('writePath: updates only the targeted entity, structure-sharing everything else', () => {
  const config = {
    entities: [
      makeFormation({ id: 'e0', forces: { mode: 'none', strength: 1, radius: 100, spin: 0 } }),
      makeFormation({ id: 'e1', forces: { mode: 'none', strength: 1, radius: 100, spin: 0 } }),
    ],
  };
  const updated = writePath(config, 'entities.1.forces.strength', 9);

  // entity 0 is untouched by identity (structure sharing)
  assert.equal(updated.entities[0], config.entities[0]);
  // entity 1 was cloned (new identity) because it's on the write path
  assert.notEqual(updated.entities[1], config.entities[1]);
  // the actual value changed
  assert.equal(updated.entities[1].forces.strength, 9);
  // sibling properties of entity 1 not on the path keep their identity
  assert.equal(updated.entities[1].shape, config.entities[1].shape);
  // original config object is untouched
  assert.equal(config.entities[1].forces.strength, 1);
});

test('applyAutomations: an LFO lane on entities.0.x changes the evaluated config but never the base config', () => {
  const config = { entities: [makeFormation({ id: 'e0', x: 0 })] };
  const lane: AutomationLane = {
    id: 'lfo1',
    path: 'entities.0.x',
    enabled: true,
    type: 'lfo',
    waveform: 'sine',
    min: -10,
    max: 10,
    rateHz: 0.25,
    phase: 0,
  };
  const rt = createAutomationRuntime();
  // now=1 -> cycle = 1*0.25 = 0.25 -> sin(0.25 * 2PI) = sin(PI/2) = 1 -> value = -10 + 20*(0.5+0.5*1) = 10
  const { config: evaluated, live } = applyAutomations(config as any, [lane], 1, rt);

  assert.equal(evaluated.entities[0].x, 10);
  assert.equal(config.entities[0].x, 0, 'base config must never be mutated');
  assert.equal(live.length, 1);
  assert.equal(live[0].value, 10);
});

test('applyAutomations: with no lanes, the original config object is returned untouched', () => {
  const config = { entities: [makeFormation({ id: 'e0' })] };
  const rt = createAutomationRuntime();
  const { config: evaluated, live } = applyAutomations(config as any, [], 5, rt);
  assert.equal(evaluated, config);
  assert.deepEqual(live, []);
});

test("evaluateLane: a one-shot lane with loop 'none' reaches `to` after durationS and reports done", () => {
  const lane: AutomationLane = {
    id: 'one1',
    path: 'x',
    enabled: true,
    type: 'oneShot',
    from: 0,
    to: 5,
    durationS: 2,
    easing: 'linear',
    loop: 'none',
    fireToken: 1,
    delayS: 0,
  };
  const rt = createAutomationRuntime();

  // First evaluation establishes the ramp's start time.
  const atStart = evaluateLane(lane, 0, rt);
  assert.ok(atStart);
  assert.equal(atStart!.value, 0);
  assert.equal(atStart!.done, false);

  // Midway.
  const atMid = evaluateLane(lane, 1, rt);
  assert.ok(atMid);
  assert.ok(Math.abs(atMid!.value - 2.5) < 1e-9);
  assert.equal(atMid!.done, false);

  // After durationS has elapsed: value clamps to `to`, done becomes true.
  const atEnd = evaluateLane(lane, 2, rt);
  assert.ok(atEnd);
  assert.equal(atEnd!.value, 5);
  assert.equal(atEnd!.done, true);

  // Stays at `to` / done after durationS too (loop 'none').
  const afterEnd = evaluateLane(lane, 10, rt);
  assert.ok(afterEnd);
  assert.equal(afterEnd!.value, 5);
  assert.equal(afterEnd!.done, true);
});

test('evaluateLane: a disabled lane resolves to null', () => {
  const lane: AutomationLane = { id: 'off1', path: 'x', enabled: false, type: 'lfo' };
  const rt = createAutomationRuntime();
  assert.equal(evaluateLane(lane, 0, rt), null);
});
