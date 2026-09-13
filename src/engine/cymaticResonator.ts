/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CymaticResonator — a single continuously-driven, damped modal resonator for a square
 * free Chladni plate, evaluated on the CPU in the ENVELOPE domain.
 *
 * Physical model
 * ---------------
 * The plate supports a K x K grid of mode shapes (classic Chladni approximation for a
 * free square plate):
 *
 *   phi_mn(x, y) = cos(m*pi*x/L) * cos(n*pi*y/L) + s * cos(n*pi*x/L) * cos(m*pi*y/L)
 *   s = +1 if (m+n) even, -1 if (m+n) odd,  x, y in [-L/2, L/2]
 *
 * Kirchhoff-plate eigenfrequencies:  f_mn = f0 * (m^2 + n^2)
 *
 * A single point excitation at the drive point couples into every mode with coupling
 * coefficient c_mn = phi_mn(driveX, driveY) — symmetric modes couple strongest, which is
 * genuine plate physics, not a picked shape.
 *
 * REAL-TIME APPROXIMATION (explicitly identified, per the brief): rather than integrating
 * the full wave equation at audio rates, each mode is treated as a damped driven harmonic
 * oscillator and we track its slowly-varying complex envelope A_mn(t) instead of the fast
 * carrier. The steady-state response to a drive frequency f is the standard second-order
 * transfer function
 *
 *   H_mn(f) = driveStrength * c_mn / ((1 - r^2) + i * 2*zeta*r),   r = f / f_mn
 *   zeta = 1 / (2*Q)
 *
 * and the envelope relaxes toward that target with the mode's own physical time constant
 * tau_mn = Q / (pi * f_mn) (clamped to stay visible in real time):
 *
 *   dA/dt = (H_mn(f(t)) - A_mn) / tau_mn
 *
 * Integrated per frame as an exponential blend (unconditionally stable for any dt):
 *
 *   alpha = 1 - exp(-dt / tau_mn);  A += alpha * (H - A)
 *
 * Because this is state (A_mn) that is carried frame to frame, sweeping the drive
 * frequency f(t) continuously detunes and re-tunes every mode's envelope live — nothing is
 * ever reset, reseeded, or swapped for a stored picture. The seven chakral "stations" below
 * are simply the seven most strongly-driven, mutually distinct eigenmodes of this one
 * instrument, picked by an explicit selection rule over the real mode spectrum.
 */

import { CANONICAL_CHAKRAS } from './chakraSystem';

export const RESONATOR_K = 8; // mode grid side (K x K = 64 modes)
export const RESONATOR_MODE_TOTAL = RESONATOR_K * RESONATOR_K;
export const RESONATOR_STATION_COUNT = 7;

export interface ResonatorStation {
  index: number;       // 0 (lowest freq / Root) .. 6 (highest freq / Crown)
  name: string;        // chakra name from CANONICAL_CHAKRAS
  m: number;
  n: number;
  frequencyHz: number;
  color: string;
  modeIndex: number;   // flat index into the 64-mode arrays
}

export interface ResonatorTelemetry {
  frequencyHz: number;
  coherence: number;         // energy share of the single dominant mode (0..1)
  totalEnergy: number;
  dominantM: number;
  dominantN: number;
  dominantModeIndex: number;
  nearestStationIndex: number;
  nearestStationProximity: number; // 1.0 = exactly on station, 0.0 = at lock-band edge or beyond
  isLocked: boolean;               // within +/-4% of a station's eigenfrequency
}

export interface ResonatorParams {
  plateSize: number;     // world px, side L of the square plate (default 700)
  baseFrequency: number; // f0 such that f_mn = f0 * (m^2 + n^2); default tuned for ~80-1100Hz band
  dampingQ: number;      // shared quality factor -> zeta = 1/(2Q), tau = Q/(pi*f_mn)
  driveStrength: number; // excitation amplitude at the drive point
  modeCount: number;     // how many of the 64 modes actively participate (<=64), ranked by coupling
  driveX: number;        // drive point, fraction of L from center (default 0.11)
  driveY: number;        // drive point, fraction of L from center (default 0.07)
}

export const DEFAULT_RESONATOR_PARAMS: ResonatorParams = {
  plateSize: 700,
  baseFrequency: 40,
  dampingQ: 8,
  driveStrength: 1.0,
  modeCount: RESONATOR_MODE_TOTAL,
  driveX: 0.11,
  driveY: 0.07,
};

export type SweepDirection = 'ascent' | 'descent' | 'pingpong';

export interface SweepOptions {
  glideS: number;
  dwellS: number;
  direction: SweepDirection;
}

/** phi_mn(x, y) for the free-square-plate Chladni approximation, x/y already normalized by L. */
function modeShapeNormalized(m: number, n: number, u: number, v: number): number {
  const s = (m + n) % 2 === 0 ? 1 : -1;
  const a = Math.cos(m * Math.PI * u) * Math.cos(n * Math.PI * v);
  const b = Math.cos(n * Math.PI * u) * Math.cos(m * Math.PI * v);
  return a + s * b;
}

/**
 * One continuously-driven damped modal resonator. Call `configure()` when plate/drive
 * parameters change (cheap, O(64)); call `step(dt, frequencyHz)` once per simulation frame.
 * State (the complex envelopes) persists across both calls indefinitely — this is what lets
 * frequency sweeps, dwells, and detunes happen with no reset.
 */
export class CymaticResonator {
  // Per-mode state, flat K*K arrays, i = (m-1)*K + (n-1), m,n in [1..K]
  public re: Float32Array = new Float32Array(RESONATOR_MODE_TOTAL);
  public im: Float32Array = new Float32Array(RESONATOR_MODE_TOTAL);

  private modeM: Int32Array = new Int32Array(RESONATOR_MODE_TOTAL);
  private modeN: Int32Array = new Int32Array(RESONATOR_MODE_TOTAL);
  private modeFreq: Float32Array = new Float32Array(RESONATOR_MODE_TOTAL);
  private modeCoupling: Float32Array = new Float32Array(RESONATOR_MODE_TOTAL);
  private modeActive: Uint8Array = new Uint8Array(RESONATOR_MODE_TOTAL);
  private orderByCoupling: number[] = [];

  public stations: ResonatorStation[] = [];
  public params: ResonatorParams;

  private lastTelemetry: ResonatorTelemetry;

  constructor(params: Partial<ResonatorParams> = {}) {
    this.params = { ...DEFAULT_RESONATOR_PARAMS, ...params };
    for (let m = 1; m <= RESONATOR_K; m++) {
      for (let n = 1; n <= RESONATOR_K; n++) {
        const i = (m - 1) * RESONATOR_K + (n - 1);
        this.modeM[i] = m;
        this.modeN[i] = n;
      }
    }
    this.recompute();
    this.lastTelemetry = {
      frequencyHz: this.params.baseFrequency,
      coherence: 0,
      totalEnergy: 0,
      dominantM: 1,
      dominantN: 1,
      dominantModeIndex: 0,
      nearestStationIndex: 0,
      nearestStationProximity: 0,
      isLocked: false,
    };
  }

  /** Update plate/drive parameters. Envelope state (re/im) is preserved. */
  public configure(next: Partial<ResonatorParams>) {
    this.params = { ...this.params, ...next };
    this.recompute();
  }

  /** Recomputes eigenfrequencies, coupling coefficients, station picks and active-mode ranking. */
  private recompute() {
    const { plateSize: L, baseFrequency: f0, driveX, driveY } = this.params;
    for (let i = 0; i < RESONATOR_MODE_TOTAL; i++) {
      const m = this.modeM[i];
      const n = this.modeN[i];
      this.modeFreq[i] = f0 * (m * m + n * n);
      this.modeCoupling[i] = modeShapeNormalized(m, n, driveX, driveY);
    }

    // Rank all modes by |coupling| descending; the top `modeCount` remain active.
    this.orderByCoupling = Array.from({ length: RESONATOR_MODE_TOTAL }, (_, i) => i).sort(
      (a, b) => Math.abs(this.modeCoupling[b]) - Math.abs(this.modeCoupling[a])
    );
    const activeCount = Math.max(1, Math.min(RESONATOR_MODE_TOTAL, Math.round(this.params.modeCount)));
    this.modeActive.fill(0);
    for (let k = 0; k < activeCount; k++) {
      this.modeActive[this.orderByCoupling[k]] = 1;
    }

    this.stations = this.selectStations(L);
    // Guarantee the modes underlying the seven stations are always active, regardless of modeCount.
    for (const st of this.stations) {
      this.modeActive[st.modeIndex] = 1;
    }
  }

  /**
   * Selects the seven chakral stations: the seven mutually-distinct, most strongly-coupled
   * eigenmodes of THIS instrument, ordered ascending by frequency across the band. Distinct
   * shape = distinct unordered {m,n} pair (on a free square plate, (m,n) and (n,m) are the
   * same nodal pattern up to an overall sign, so only one representative per pair is kept).
   */
  private selectStations(_L: number): ResonatorStation[] {
    const f0 = this.params.baseFrequency;
    // The instrument's working band: f_11 = f0*2 (lowest mode) up to f0*27.5, which with the
    // default f0=40 reproduces the ~80-1100Hz band the physical model is tuned for. Restricting
    // candidates to this band (rather than the full 64-mode spectrum up to f0*128) is what makes
    // the seven stations sit ACROSS the band instead of clustering at its high end.
    const bandLow = f0 * 1.5;
    const bandHigh = f0 * 27.5;

    const seen = new Set<string>();
    const candidates: { modeIndex: number; m: number; n: number; f: number; absC: number }[] = [];
    for (let i = 0; i < RESONATOR_MODE_TOTAL; i++) {
      const m = this.modeM[i];
      const n = this.modeN[i];
      const f = this.modeFreq[i];
      if (f < bandLow || f > bandHigh) continue;
      const key = m <= n ? `${m}_${n}` : `${n}_${m}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidates.push({ modeIndex: i, m, n, f, absC: Math.abs(this.modeCoupling[i]) });
    }
    // Best drive coupling first...
    candidates.sort((a, b) => b.absC - a.absC);
    const chosen = candidates.slice(0, RESONATOR_STATION_COUNT);
    // ...then presented ascending by frequency (Root -> Crown).
    chosen.sort((a, b) => a.f - b.f);

    return chosen.map((c, idx) => {
      // CANONICAL_CHAKRAS is Crown(0) .. Root(6); ascending-frequency station idx 0 = Root.
      const chakra = CANONICAL_CHAKRAS[CANONICAL_CHAKRAS.length - 1 - idx] ?? CANONICAL_CHAKRAS[0];
      return {
        index: idx,
        name: chakra.name,
        m: c.m,
        n: c.n,
        frequencyHz: c.f,
        color: chakra.color,
        modeIndex: c.modeIndex,
      };
    });
  }

  /**
   * Integrates every active mode's envelope one frame forward under a continuous drive at
   * `frequencyHz`, and returns fresh telemetry. Nothing here resets particle-independent
   * state; re/im simply relax toward the new steady state at each mode's own time constant.
   */
  public step(dt: number, frequencyHz: number): ResonatorTelemetry {
    const { dampingQ, driveStrength } = this.params;
    const zeta = 1 / (2 * Math.max(0.05, dampingQ));
    const clampedDt = Math.max(0, Math.min(0.1, dt));

    let totalEnergy = 0;
    let domEnergy = -1;
    let domIndex = 0;

    for (let i = 0; i < RESONATOR_MODE_TOTAL; i++) {
      if (!this.modeActive[i]) {
        // Inactive modes still relax passively toward silence (no drive term).
        const decay = Math.pow(0.98, clampedDt * 60);
        this.re[i] *= decay;
        this.im[i] *= decay;
        continue;
      }
      const fm = this.modeFreq[i];
      const c = this.modeCoupling[i];
      const r = frequencyHz / Math.max(1e-3, fm);

      const denomRe = 1 - r * r;
      const denomIm = 2 * zeta * r;
      const denomMagSq = Math.max(1e-6, denomRe * denomRe + denomIm * denomIm);

      const drive = driveStrength * c;
      const Hre = (drive * denomRe) / denomMagSq;
      const Him = (-drive * denomIm) / denomMagSq;

      const tau = Math.max(0.05, dampingQ / (Math.PI * Math.max(1e-3, fm)));
      const alpha = 1 - Math.exp(-clampedDt / tau);

      this.re[i] += alpha * (Hre - this.re[i]);
      this.im[i] += alpha * (Him - this.im[i]);

      const energy = this.re[i] * this.re[i] + this.im[i] * this.im[i];
      totalEnergy += energy;
      if (energy > domEnergy) {
        domEnergy = energy;
        domIndex = i;
      }
    }

    const coherence = totalEnergy > 1e-9 ? Math.max(0, Math.min(1, domEnergy / totalEnergy)) : 0;

    // Nearest station by relative detuning.
    let nearestIdx = 0;
    let nearestRel = Infinity;
    for (let s = 0; s < this.stations.length; s++) {
      const rel = Math.abs(frequencyHz - this.stations[s].frequencyHz) / this.stations[s].frequencyHz;
      if (rel < nearestRel) {
        nearestRel = rel;
        nearestIdx = s;
      }
    }
    const lockBand = 0.04; // +/-4%
    const proximity = Math.max(0, Math.min(1, 1 - nearestRel / lockBand));

    this.lastTelemetry = {
      frequencyHz,
      coherence,
      totalEnergy,
      dominantM: this.modeM[domIndex],
      dominantN: this.modeN[domIndex],
      dominantModeIndex: domIndex,
      nearestStationIndex: nearestIdx,
      nearestStationProximity: proximity,
      isLocked: nearestRel <= lockBand,
    };
    return this.lastTelemetry;
  }

  public getTelemetry(): ResonatorTelemetry {
    return this.lastTelemetry;
  }

  public getStations(): ResonatorStation[] {
    return this.stations;
  }

  /**
   * Continuous, uninterrupted glide through all seven stations with per-station dwell.
   * `tSeconds` is a monotonically increasing accumulator (NOT reset between calls) so the
   * resonator drive frequency this produces is itself continuous — the caller feeds the
   * result straight into `step()`.
   */
  public sweepFrequency(tSeconds: number, opts: SweepOptions): number {
    const stations = this.stations;
    if (stations.length === 0) return this.params.baseFrequency;
    const freqs = stations.map((s) => s.frequencyHz);

    let waypoints: number[];
    if (opts.direction === 'descent') {
      waypoints = [...freqs].reverse();
    } else if (opts.direction === 'pingpong') {
      const fwd = freqs;
      const back = freqs.slice(1, -1).reverse();
      waypoints = [...fwd, ...back];
    } else {
      waypoints = freqs;
    }

    const dwell = Math.max(0, opts.dwellS);
    const glide = Math.max(0.01, opts.glideS);
    const segment = dwell + glide;
    const cycle = waypoints.length * segment;
    if (cycle <= 0) return waypoints[0];

    const tMod = ((tSeconds % cycle) + cycle) % cycle;
    const segIdx = Math.floor(tMod / segment);
    const segT = tMod - segIdx * segment;

    const from = waypoints[segIdx % waypoints.length];
    const to = waypoints[(segIdx + 1) % waypoints.length];

    if (segT <= dwell) {
      return from;
    }
    const u = Math.min(1, (segT - dwell) / glide);
    const smooth = u * u * (3 - 2 * u);
    return from + (to - from) * smooth;
  }
}
