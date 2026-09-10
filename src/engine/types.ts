/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PointCloudFluidConfig {
  curlScale: number;       // Noise frequency
  curlSpeed: number;       // Noise temporal rate
  vortexStrength: number;  // Swirl torque between/around glyph centers
  viscosity: number;       // Velocity dissipation rate (damping 0.05 - 1.02)
  returnSpeed: number;     // Snapback spring constant (k) to target coordinates (-5 to 25)
  turbulence: number;      // Overall magnitude of noise perturbation
  dispersion: number;      // Drift / scatter impulse bridging glyphs
}

export interface PointCloudInteractionConfig {
  radius: number;          // Mouse influence radius in world/pixel units
  strength: number;        // Push/pull or velocity advection strength
  mode: 'repel' | 'attract' | 'vortex'; // Interaction mode
}

export interface PointCloudRelationalConfig {
  enabled: boolean;          // Free relational multi-attractor system toggle
  mode?: 'orbital' | 'chaos' | 'nbody'; // Relational physics modality
  attractorCount?: number;    // Number of active dynamic attractors (2 to 6)
  attractorGravity?: number;  // Gravitational pull towards attractors (-20.0 to 30.0)
  orbitSpeed?: number;        // Orbital angular velocity (-10.0 to 10.0)
  orbitRadius?: number;       // Separation / orbital radius (0 to 1200px)
  relationalSpin?: number;    // Vortex swirl torque around attractor bodies (-20.0 to 20.0)
  chaosFactor?: number;       // Non-linear strange attractor turbulence (0 to 15.0)
  wanderSpeed?: number;       // Brownian / Lissajous wandering rate (0 to 10.0)
}

export interface PointCloudConfig {
  glyph: string | string[];           // e.g., ["O", "I"] or "OI" or "✦ ✧"
  particleCount: number;             // Default: 200000 (nearest power texture e.g. 512x512=262144)
  fontFamily?: string;               // Default: system bold sans/serif
  fontWeight?: string | number;      // Default: 900
  colorMode: 'blackOnWhite' | 'whiteOnBlack';
  style: 'stipple' | 'halftone';     // Ink stipple vs matrix halftone
  dotShape?: 'circle' | 'square';    // Crisp circular stipple vs typographic square grid
  particleSize: { min: number; max: number };
  fluid: PointCloudFluidConfig;
  interaction: PointCloudInteractionConfig;
  relational?: PointCloudRelationalConfig;
  morphProgress?: number;            // 0.0 = glyph A, 1.0 = glyph B
  autoMorph?: boolean;               // Ping-pong morphing between glyph A & B
  autoMorphDuration?: number;        // Duration in seconds for full morph cycle
  positioning?: 'fixed' | 'absolute' | 'relative';
  containerClassName?: string;
  debug?: boolean;
}

export interface GlyphSampleData {
  positionsA: Float32Array; // (x, y, z, density) per particle
  positionsB: Float32Array; // (x, y, z, density) per particle for morphing
  width: number;
  height: number;
  textureWidth: number;
  textureHeight: number;
}
