/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import { test } from './harness.ts';
import { CymaticResonator, RESONATOR_STATION_COUNT } from '../src/engine/cymaticResonator.ts';

test('CymaticResonator: exposes 7 stations with ascending frequencies and distinct (m,n) shapes', () => {
  const r = new CymaticResonator();
  const stations = r.getStations();
  assert.equal(stations.length, RESONATOR_STATION_COUNT);
  assert.equal(stations.length, 7);

  for (let i = 1; i < stations.length; i++) {
    assert.ok(stations[i].frequencyHz > stations[i - 1].frequencyHz, `stations must be ascending in frequency at index ${i}`);
  }

  const seen = new Set<string>();
  for (const s of stations) {
    const key = s.m <= s.n ? `${s.m}_${s.n}` : `${s.n}_${s.m}`;
    assert.ok(!seen.has(key), `station (m,n) shapes must be mutually distinct, duplicate at ${key}`);
    seen.add(key);
  }
});

test('CymaticResonator: driving at a station frequency for 6s locks onto it with rising coherence', () => {
  const r = new CymaticResonator();
  const stations = r.getStations();
  const stationIndex = 0;
  const freq = stations[stationIndex].frequencyHz;
  const dt = 1 / 60;

  let firstTelemetry = r.step(dt, freq);
  let lastTelemetry = firstTelemetry;
  for (let i = 1; i < 360; i++) {
    lastTelemetry = r.step(dt, freq);
  }

  assert.equal(lastTelemetry.nearestStationIndex, stationIndex);
  assert.equal(lastTelemetry.isLocked, true);
  assert.ok(
    lastTelemetry.coherence > firstTelemetry.coherence,
    `coherence should rise toward lock (first=${firstTelemetry.coherence}, last=${lastTelemetry.coherence})`
  );
});

test('CymaticResonator: envelopes are never reset between steps — energy persists immediately after a detune', () => {
  const r = new CymaticResonator();
  const stations = r.getStations();
  const dt = 1 / 60;
  const stationFreq = stations[0].frequencyHz;

  // warm up at the station frequency
  for (let i = 0; i < 60; i++) r.step(dt, stationFreq);

  const sumAbs = () => {
    let s = 0;
    for (let i = 0; i < r.re.length; i++) s += Math.abs(r.re[i]) + Math.abs(r.im[i]);
    return s;
  };
  const before = sumAbs();
  assert.ok(before > 0, 'envelope energy must have built up while driven');

  // a single detuned step must not reset the envelopes to zero
  r.step(dt, stationFreq * 1.3);
  const after = sumAbs();
  assert.ok(after > 0, 'envelope magnitude must remain nonzero immediately after a detune (no reset)');
});

test('CymaticResonator: detuning 30% then returning to the station reproduces the same dominant (m,n)', () => {
  const r = new CymaticResonator();
  const stations = r.getStations();
  const stationFreq = stations[0].frequencyHz;
  const dt = 1 / 60;

  let telemetry = r.step(dt, stationFreq);
  for (let i = 1; i < 360; i++) telemetry = r.step(dt, stationFreq); // 6s locked
  const dominantBefore = { m: telemetry.dominantM, n: telemetry.dominantN };

  const detuneFreq = stationFreq * 1.3;
  for (let i = 0; i < 120; i++) r.step(dt, detuneFreq); // 2s detuned

  for (let i = 0; i < 360; i++) telemetry = r.step(dt, stationFreq); // 6s back on-station
  const dominantAfter = { m: telemetry.dominantM, n: telemetry.dominantN };

  assert.deepEqual(dominantAfter, dominantBefore);
});

test('CymaticResonator.sweepFrequency: continuous across the cycle and visits all 7 station frequencies', () => {
  const r = new CymaticResonator();
  const stations = r.getStations();
  const freqs = stations.map((s) => s.frequencyHz);
  const band = Math.max(...freqs) - Math.min(...freqs);
  const opts = { glideS: 1, dwellS: 0.5, direction: 'ascent' as const };
  const cycle = freqs.length * (opts.glideS + opts.dwellS);
  const dt = 1 / 60;

  let maxDelta = 0;
  let prev = r.sweepFrequency(0, opts);
  const visited = new Set<number>();
  const tolerance = 0.01;

  for (let t = dt; t <= cycle + 1e-9; t += dt) {
    const f = r.sweepFrequency(t, opts);
    maxDelta = Math.max(maxDelta, Math.abs(f - prev));
    prev = f;
    for (const sf of freqs) {
      if (Math.abs(f - sf) < tolerance) visited.add(sf);
    }
  }

  assert.ok(maxDelta < band * 0.05, `max frame-to-frame jump (${maxDelta}) must stay below 5% of the band (${band * 0.05})`);
  assert.equal(visited.size, freqs.length, 'sweep must visit every station frequency during one full cycle');
});
