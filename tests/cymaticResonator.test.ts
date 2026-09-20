/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert/strict';
import { test } from './harness.ts';
import { CymaticResonator, RESONATOR_STATION_COUNT, resonatorModeIndex3D, RESONATOR_MODE_TOTAL } from '../src/engine/cymaticResonator.ts';

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

// ------------------------------------------------------------------ 3D volumetric cavity

test('CymaticResonator 3D: mode indexing round-trips as i = ((m-1)*4 + (n-1))*4 + (p-1) over all 64 slots', () => {
  const r = new CymaticResonator({ dimension: '3D' });
  const states = r.getModalState();
  assert.equal(states.length, RESONATOR_MODE_TOTAL);

  const seen = new Set<number>();
  for (const s of states) {
    for (const axis of [s.m, s.n, s.p]) {
      assert.ok(axis >= 1 && axis <= 4, `3D mode indices must lie in [1..4], got (${s.m},${s.n},${s.p})`);
    }
    assert.equal(
      resonatorModeIndex3D(s.m, s.n, s.p),
      s.modeIndex,
      `slot ${s.modeIndex} carries (${s.m},${s.n},${s.p}) but the index law disagrees`
    );
    seen.add(s.modeIndex);
  }
  assert.equal(seen.size, RESONATOR_MODE_TOTAL, 'the 3D lattice must fill every slot exactly once');

  // Switching back to the 2D plate restores the original 8x8 table bit for bit.
  const twoDee = new CymaticResonator();
  r.configure({ dimension: '2D' });
  const restored = r.getModalState();
  const original = twoDee.getModalState();
  for (let i = 0; i < RESONATOR_MODE_TOTAL; i++) {
    assert.equal(restored[i].m, original[i].m, `2D table m must be restored at slot ${i}`);
    assert.equal(restored[i].n, original[i].n, `2D table n must be restored at slot ${i}`);
    assert.ok(Math.abs(restored[i].frequencyHz - original[i].frequencyHz) < 1e-9, `2D dispersion must be restored at slot ${i}`);
  }
  assert.equal(r.getStations().length, RESONATOR_STATION_COUNT, '2D station count survives the round trip');
});

test('CymaticResonator 3D: box dispersion f = f0*sqrt(m^2+n^2+p^2), and driving at the fundamental locks onto (1,1,1)', () => {
  const f0 = 40;
  const r = new CymaticResonator({ dimension: '3D', baseFrequency: f0 });
  const states = r.getModalState();

  // The whole spectrum must follow the 3D wave-equation dispersion law, hence be ordered
  // by sqrt(m^2+n^2+p^2): modes near a drive frequency are exactly the low-detuning ones.
  for (const s of states) {
    const expected = f0 * Math.sqrt(s.m * s.m + s.n * s.n + s.p * s.p);
    assert.ok(
      Math.abs(s.frequencyHz - expected) < 1e-4,
      `slot ${s.modeIndex} (${s.m},${s.n},${s.p}) frequency ${s.frequencyHz} must equal f0*sqrt(m^2+n^2+p^2) = ${expected}`
    );
  }

  // Fundamental (1,1,1): unique lowest mode, f = f0*sqrt(3). Driving there for 6s must
  // select it as the dominant mode (the +sqrt(3)-detuned neighbours are far off-resonance).
  const fundamental = f0 * Math.sqrt(3);
  const dt = 1 / 60;
  let telemetry = r.step(dt, fundamental);
  for (let i = 1; i < 360; i++) telemetry = r.step(dt, fundamental);

  assert.equal(telemetry.dominantModeIndex, resonatorModeIndex3D(1, 1, 1), 'the fundamental drive must select the (1,1,1) cavity mode');
  assert.equal(telemetry.dominantP, 1);
  assert.ok(telemetry.dominantM === 1 && telemetry.dominantN === 1);

  // The seven anchors remain the strongly-coupled, mutually-distinct eigenmodes, here over
  // the 3D spectrum, each carrying its depth index and ascending in frequency.
  const stations = r.getStations();
  assert.equal(stations.length, RESONATOR_STATION_COUNT);
  const seen = new Set<string>();
  for (let i = 0; i < stations.length; i++) {
    const s = stations[i];
    assert.ok(s.p !== undefined, '3D stations must carry their depth mode p');
    const key = [s.m, s.n, s.p!].sort((a, b) => a - b).join(':');
    assert.ok(!seen.has(key), `3D station shapes must be mutually distinct, duplicate at ${key}`);
    seen.add(key);
    if (i > 0) assert.ok(s.frequencyHz > stations[i - 1].frequencyHz, '3D stations must ascend in frequency');
  }
});

test('CymaticResonator 3D: envelopes stay bounded and finite under sustained on-resonance drive', () => {
  const f0 = 40;
  const r = new CymaticResonator({ dimension: '3D', baseFrequency: f0 });
  const drive = f0 * Math.sqrt(3); // fundamental: the largest steady-state gain in the spectrum
  const dt = 1 / 60;

  // Analytic ceiling: |A| <= driveStrength * |coupling| / (2*zeta) = Q * driveStrength
  // (couplings are cosine products, so |coupling| <= 1). Add a hair of headroom.
  const bound = r.params.dampingQ * r.params.driveStrength + 1e-3;

  let telemetry = r.step(dt, drive);
  for (let i = 1; i < 600; i++) telemetry = r.step(dt, drive); // 10s on-resonance

  for (let i = 0; i < r.re.length; i++) {
    assert.ok(Number.isFinite(r.re[i]) && Number.isFinite(r.im[i]), `envelope at slot ${i} must stay finite`);
    assert.ok(Math.abs(r.re[i]) <= bound && Math.abs(r.im[i]) <= bound, `envelope at slot ${i} exceeded the analytic ceiling ${bound}`);
  }
  assert.ok(Number.isFinite(telemetry.totalEnergy) && telemetry.totalEnergy > 0, 'total energy must be finite and positive while driven');
});
