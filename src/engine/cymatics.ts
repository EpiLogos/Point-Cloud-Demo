/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export type CymaticPlateGeometry = 'square' | 'circular' | 'volumetric3D';
export type CymaticDimension = '2D' | '3D';

export interface ChakraCymaticProfile {
  chakraId: string;
  chakraName: string;
  sanskrit: string;
  frequencyHz: number;
  squareM: number;
  squareN: number;
  squareA: number;
  squareB: number;
  circularM: number; // Azimuthal nodal lines / petal count
  circularN: number; // Radial concentric nodal rings
  volumetricL: number;
  volumetricM: number;
  volumetricN: number;
  symmetryTitle: string;
  description: string;
}

/**
 * The 7 Canonical Chakra Resonant Harmonic Stability Points in Cymatics
 * Derived from Solfeggio acoustic frequencies and their matching geometric nodal symmetries:
 * - Root (Muladhara, 396Hz): 4-Fold Foundation Cross (4 Petals)
 * - Sacral (Svadhisthana, 417Hz): 6-Fold Fluid Hexagonal Ripple (6 Petals)
 * - Solar Plexus (Manipura, 528Hz): 10-Fold Radiant Solar Star (10 Petals)
 * - Heart (Anahata, 639Hz): 12-Fold Shatkona Hexagram Standing Wave (12 Petals)
 * - Throat (Vishuddha, 741Hz): 16-Fold Pure Acoustic Sanctum (16 Petals)
 * - Third Eye (Ajna, 852Hz): Bilateral Dual-Lobe Eye of Intuition (2 Petals)
 * - Crown (Sahasrara, 963Hz): Thousand-Petaled High-Frequency Rosette (Multi-Ring Lattice)
 */
export const CHAKRA_CYMATIC_PROFILES: ChakraCymaticProfile[] = [
  {
    chakraId: 'muladhara',
    chakraName: 'Muladhara (Root)',
    sanskrit: 'मूलाधार',
    frequencyHz: 396,
    squareM: 2,
    squareN: 2,
    squareA: 1.0,
    squareB: 1.0,
    circularM: 2,
    circularN: 1,
    volumetricL: 2,
    volumetricM: 2,
    volumetricN: 1,
    symmetryTitle: '4-Fold Foundation Nodal Cross',
    description: 'Fundamental low-frequency standing wave forming a steadfast 4-petal quadrant nodal lattice.',
  },
  {
    chakraId: 'svadhisthana',
    chakraName: 'Svadhisthana (Sacral)',
    sanskrit: 'स्वाधिष्ठान',
    frequencyHz: 417,
    squareM: 2,
    squareN: 3,
    squareA: 1.0,
    squareB: 1.0,
    circularM: 3,
    circularN: 1,
    volumetricL: 2,
    volumetricM: 3,
    volumetricN: 1,
    symmetryTitle: '6-Fold Fluid Hexagonal Ripple',
    description: 'Fluid undulating acoustic wave producing 6 crescent nodal sectors and rhythmic water ripples.',
  },
  {
    chakraId: 'manipura',
    chakraName: 'Manipura (Solar Plexus)',
    sanskrit: 'मणिपूर',
    frequencyHz: 528,
    squareM: 3,
    squareN: 5,
    squareA: 1.0,
    squareB: 1.0,
    circularM: 5,
    circularN: 1,
    volumetricL: 3,
    volumetricM: 3,
    volumetricN: 2,
    symmetryTitle: '10-Fold Radiant Solar Star',
    description: 'Kinetic transformation frequency forming a 10-ray solar starburst and dense central focal diamond.',
  },
  {
    chakraId: 'anahata',
    chakraName: 'Anahata (Heart)',
    sanskrit: 'अनाहत',
    frequencyHz: 639,
    squareM: 4,
    squareN: 4,
    squareA: 1.0,
    squareB: 1.0,
    circularM: 6,
    circularN: 2,
    volumetricL: 3,
    volumetricM: 3,
    volumetricN: 3,
    symmetryTitle: '12-Fold Shatkona Hexagram Standing Wave',
    description: 'Perfect harmonic balance: interlaced upward and downward standing wave triangles forming a 12-petaled hexagram.',
  },
  {
    chakraId: 'vishuddha',
    chakraName: 'Vishuddha (Throat)',
    sanskrit: 'विशुद्ध',
    frequencyHz: 741,
    squareM: 4,
    squareN: 6,
    squareA: 1.0,
    squareB: 1.0,
    circularM: 8,
    circularN: 2,
    volumetricL: 4,
    volumetricM: 4,
    volumetricN: 2,
    symmetryTitle: '16-Fold Pure Acoustic Sanctum',
    description: 'Etheric purification mode with 16 acoustic petal nodal lobes around concentric resonance rings.',
  },
  {
    chakraId: 'ajna',
    chakraName: 'Ajna (Third Eye)',
    sanskrit: 'आज्ञा',
    frequencyHz: 852,
    squareM: 1,
    squareN: 5,
    squareA: 1.25,
    squareB: 0.75,
    circularM: 1,
    circularN: 3,
    volumetricL: 2,
    volumetricM: 1,
    volumetricN: 4,
    symmetryTitle: 'Bilateral Dual-Lobe Eye of Gnosis',
    description: 'Bilateral standing wave geometry forming 2 wide lateral winged nodal lobes centered on an intense focal Bindu.',
  },
  {
    chakraId: 'sahasrara',
    chakraName: 'Sahasrara (Crown)',
    sanskrit: 'सहस्रार',
    frequencyHz: 963,
    squareM: 6,
    squareN: 8,
    squareA: 1.0,
    squareB: 1.0,
    circularM: 12,
    circularN: 3,
    volumetricL: 5,
    volumetricM: 5,
    volumetricN: 4,
    symmetryTitle: 'Thousand-Petaled Celestial Rosette',
    description: 'Ultra-high frequency multi-ring complex harmonic with kaleidoscopic fractal nodal intersections.',
  },
];

export interface HarmonicSpectrumState {
  frequencyHz: number;
  coherence: number; // 0.0 (maximum chaos) to 1.0 (crystallized lock)
  isLocked: boolean; // true if within resonance lock bandwidth
  lockStrength: number; // 0.0 to 1.0
  chaosTurbulence: number; // In-between turbulent agitation factor
  nearestProfile: ChakraCymaticProfile;
  detuneHz: number; // Signed distance in Hz to nearest harmonic
  statusLabel: 'Resonance Lock' | 'Harmonic Transition' | 'Chaotic In-Between';
  effectiveM: number;
  effectiveN: number;
  effectiveL: number;
  squareA: number;
  squareB: number;
}

/**
 * Evaluates continuous acoustic frequency against the harmonic spectrum
 * Calculates physical resonance lock coherence and in-between chaotic agitation.
 */
export function evalHarmonicSpectrum(
  frequencyHz: number,
  dampingQ: number = 4.5
): HarmonicSpectrumState {
  const f = Math.max(300, Math.min(1050, frequencyHz));

  // Find the two surrounding harmonic nodes
  let bestDist = Infinity;
  let nearestIdx = 0;

  for (let i = 0; i < CHAKRA_CYMATIC_PROFILES.length; i++) {
    const dist = Math.abs(f - CHAKRA_CYMATIC_PROFILES[i].frequencyHz);
    if (dist < bestDist) {
      bestDist = dist;
      nearestIdx = i;
    }
  }

  const nearest = CHAKRA_CYMATIC_PROFILES[nearestIdx];
  const detune = f - nearest.frequencyHz;

  // Gaussian resonance lock basin width determined by Q-factor
  // High Q = sharper resonance peaks; lower Q = broader lock basins
  const sigma = 55.0 / Math.max(1.0, dampingQ);
  const coherence = Math.exp(- (detune * detune) / (2.0 * sigma * sigma));
  const isLocked = coherence >= 0.70;
  const lockStrength = Math.max(0.0, Math.min(1.0, (coherence - 0.15) / 0.85));

  // Chaotic turbulence peaks in between harmonic stability points
  // When coherence is low, chaotic fluttering of grains is maximal
  const chaosTurbulence = Math.pow(1.0 - coherence, 1.4);

  let statusLabel: 'Resonance Lock' | 'Harmonic Transition' | 'Chaotic In-Between';
  if (isLocked) {
    statusLabel = 'Resonance Lock';
  } else if (coherence > 0.28) {
    statusLabel = 'Harmonic Transition';
  } else {
    statusLabel = 'Chaotic In-Between';
  }

  // Determine continuous fractional modal numbers (m, n, l) across the spectrum
  let effectiveM = nearest.squareM;
  let effectiveN = nearest.squareN;
  let effectiveL = nearest.volumetricL;
  let squareA = nearest.squareA;
  let squareB = nearest.squareB;

  // Smooth interpolation between adjacent modes when transitioning
  let nextIdx = nearestIdx;
  if (detune > 0 && nearestIdx < CHAKRA_CYMATIC_PROFILES.length - 1) {
    nextIdx = nearestIdx + 1;
  } else if (detune < 0 && nearestIdx > 0) {
    nextIdx = nearestIdx - 1;
  }

  if (nextIdx !== nearestIdx) {
    const other = CHAKRA_CYMATIC_PROFILES[nextIdx];
    const range = Math.abs(other.frequencyHz - nearest.frequencyHz);
    const alpha = Math.min(1.0, Math.max(0.0, Math.abs(detune) / Math.max(1, range)));
    // Non-linear easing: hold near stability point, rapidly traverse in-between chaos
    const t = alpha * alpha * (3.0 - 2.0 * alpha);

    effectiveM = nearest.squareM * (1.0 - t) + other.squareM * t;
    effectiveN = nearest.squareN * (1.0 - t) + other.squareN * t;
    effectiveL = nearest.volumetricL * (1.0 - t) + other.volumetricL * t;
    squareA = nearest.squareA * (1.0 - t) + other.squareA * t;
    squareB = nearest.squareB * (1.0 - t) + other.squareB * t;
  }

  return {
    frequencyHz: f,
    coherence,
    isLocked,
    lockStrength,
    chaosTurbulence,
    nearestProfile: nearest,
    detuneHz: detune,
    statusLabel,
    effectiveM,
    effectiveN,
    effectiveL,
    squareA,
    squareB,
  };
}

/**
 * Evaluates the 2D Square Chladni Wave Equation:
 *   ψ(x, y) = a * cos(n * π * x) * cos(m * π * y) - b * cos(m * π * x) * cos(n * π * y)
 * Inputs: x, y in normalized space [-1, 1]
 * Nodal lines (where sand settles) are the zeros: ψ(x, y) = 0
 */
export function evalChladniSquare(
  x: number,
  y: number,
  m: number,
  n: number,
  a: number = 1.0,
  b: number = 1.0
): number {
  const pi = Math.PI;
  return (
    a * Math.cos(n * pi * x) * Math.cos(m * pi * y) -
    b * Math.cos(m * pi * x) * Math.cos(n * pi * y)
  );
}

/**
 * Evaluates the Circular Plate / Membrane Cymatic Wave Equation:
 *   ψ(r, θ) = cos(n * π * r) * cos(m * θ) - 0.28 * sin((m + n) * π * r)
 * Inputs: r in [0, 1], theta in [0, 2π]
 */
export function evalChladniCircular(
  r: number,
  theta: number,
  m: number,
  n: number
): number {
  const pi = Math.PI;
  // Radial standing wave with azimuthal nodal diameters
  const radial = Math.cos(n * pi * r);
  const azimuthal = Math.cos(m * theta);
  const overtone = 0.22 * Math.sin((m + n) * pi * r);
  return radial * azimuthal - overtone;
}

/**
 * Evaluates 3D Volumetric Cymatics (Acoustic Levitation & 3D Standing Wave Cavities):
 *   Ψ(x, y, z) = cos(l*π*x) * cos(m*π*y) * cos(n*π*z) - cos(m*π*x) * cos(n*π*y) * cos(l*π*z)
 * Inputs: x, y, z in [-1, 1]
 * Nodal surfaces (zero-vibration 3D cages) are the roots: Ψ(x, y, z) = 0
 */
export function evalChladni3D(
  x: number,
  y: number,
  z: number,
  l: number,
  m: number,
  n: number
): number {
  const pi = Math.PI;
  return (
    Math.cos(l * pi * x) * Math.cos(m * pi * y) * Math.cos(n * pi * z) -
    Math.cos(m * pi * x) * Math.cos(n * pi * y) * Math.cos(l * pi * z)
  );
}

/**
 * Renders a physics-accurate 2D Chladni plate onto a canvas.
 * Sand particles accumulate where vibration amplitude |ψ| is near zero.
 * The accumulation density follows an inverted Gaussian: density = exp(-|ψ|^2 / 2σ^2)
 */
export function renderChladniPlate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  plateType: CymaticPlateGeometry,
  m: number,
  n: number,
  a: number = 1.0,
  b: number = 1.0,
  coherence: number = 1.0,
  chaosIntensity: number = 1.0,
  timeOffset: number = 0.0
) {
  ctx.clearRect(0, 0, width, height);

  const imgData = ctx.createImageData(width, height);
  const pixels = imgData.data;

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.44;

  // Sharpness of nodal accumulation line
  // At high coherence: very crisp thin nodal lines
  // In chaotic state: wide, blurred, noisy dispersals
  const sigma = 0.08 + (1.0 - coherence) * 0.22;
  const noiseScale = (1.0 - coherence) * chaosIntensity * 0.45;

  const isCirc = plateType === 'circular';

  // Compute grid step of 2 pixels for high performance while retaining crisp detail
  const step = 2;
  for (let py = 0; py < height; py += step) {
    const ny = (py - cy) / radius;
    for (let px = 0; px < width; px += step) {
      const nx = (px - cx) / radius;
      const r = Math.sqrt(nx * nx + ny * ny);

      // Plate boundary masks
      if (isCirc) {
        if (r > 1.02) continue;
      } else {
        if (Math.abs(nx) > 1.02 || Math.abs(ny) > 1.02) continue;
      }

      // Add flutter perturbation during chaotic in-between states
      let perturb = 0;
      if (noiseScale > 0.001) {
        perturb =
          noiseScale *
          (Math.sin(nx * 14.0 + ny * 12.0 + timeOffset * 3.5) * 0.5 +
            Math.cos(nx * 22.0 - ny * 18.0 + timeOffset * 2.8) * 0.5);
      }

      let psi = 0;
      if (isCirc) {
        const theta = Math.atan2(ny, nx);
        psi = evalChladniCircular(r, theta, Math.round(m), Math.round(n)) + perturb;
      } else {
        psi = evalChladniSquare(nx, ny, m, n, a, b) + perturb;
      }

      const absPsi = Math.abs(psi);
      // Nodal lines occur where |ψ| is near 0
      const density = Math.exp(- (absPsi * absPsi) / (2.0 * sigma * sigma));

      if (density > 0.04) {
        const val = Math.min(255, Math.floor(density * 255));
        // Fill step x step block
        for (let dy = 0; dy < step && py + dy < height; dy++) {
          for (let dx = 0; dx < step && px + dx < width; dx++) {
            const idx = ((py + dy) * width + (px + dx)) * 4;
            pixels[idx + 0] = val;
            pixels[idx + 1] = val;
            pixels[idx + 2] = val;
            pixels[idx + 3] = val;
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Draw plate physical boundary ring/rim
  ctx.save();
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 + coherence * 0.35})`;
  ctx.lineWidth = 2.0;
  if (isCirc) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.strokeRect(cx - radius, cy - radius, radius * 2, radius * 2);
  }
  ctx.restore();
}

/**
 * Samples 3D Volumetric Nodal Points directly from the 3D Standing Wave Helmholtz Eigenmodes.
 * Particles settle strictly on 3D zero-potential nodal surfaces: Ψ(x, y, z) = 0.
 */
export function sampleVolumetric3DNodalPoints(
  particleCount: number,
  l: number,
  m: number,
  n: number,
  coherence: number = 1.0,
  chaosIntensity: number = 1.0,
  radius: number = 240
): Array<{ x: number; y: number; z: number; density: number }> {
  const points: Array<{ x: number; y: number; z: number; density: number }> = [];
  const sigma = 0.09 + (1.0 - coherence) * 0.25;
  const chaosAmp = (1.0 - coherence) * chaosIntensity * 0.35;

  let attempts = 0;
  const maxAttempts = particleCount * 25;

  while (points.length < particleCount && attempts < maxAttempts) {
    attempts++;

    // Random point within unit sphere
    const u = Math.random();
    const costheta = Math.random() * 2 - 1;
    const phi = Math.random() * Math.PI * 2;
    const r = Math.cbrt(u);
    const sintheta = Math.sqrt(1 - costheta * costheta);

    const nx = r * sintheta * Math.cos(phi);
    const ny = r * sintheta * Math.sin(phi);
    const nz = r * costheta;

    let perturb = 0;
    if (chaosAmp > 0.001) {
      perturb = (Math.random() - 0.5) * chaosAmp;
    }

    const psi = evalChladni3D(nx, ny, nz, l, m, n) + perturb;
    const absPsi = Math.abs(psi);
    const prob = Math.exp(- (absPsi * absPsi) / (2.0 * sigma * sigma));

    if (Math.random() < prob) {
      points.push({
        x: nx * radius,
        y: ny * radius,
        z: nz * radius,
        density: Math.min(1.0, prob * 1.2),
      });
    }
  }

  // If under-sampled due to high modal complexity, fill remainder on spherical nodal shells
  while (points.length < particleCount) {
    const ang1 = Math.random() * Math.PI * 2;
    const ang2 = (Math.random() - 0.5) * Math.PI;
    const rad = radius * (0.35 + Math.random() * 0.65);
    points.push({
      x: Math.cos(ang1) * Math.cos(ang2) * rad,
      y: Math.sin(ang2) * rad,
      z: Math.sin(ang1) * Math.cos(ang2) * rad,
      density: 0.7,
    });
  }

  return points;
}
