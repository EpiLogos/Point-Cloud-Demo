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

export type ChainTraversalMode = 'loop' | 'pingpong' | 'randomWalk' | 'chaos' | 'shuffle';
export type ChainEasing = 'smoothstep' | 'linear' | 'kineticSnap' | 'whip';

export interface PointCloudChainingConfig {
  enabled: boolean;                      // Sequenced morph chaining mode toggle
  chain: string[];                       // Array of glyphs or words in sequence
  mode: ChainTraversalMode;              // Traversal pattern
  stepHoldDuration: number;              // Hold/dwell duration on resolved link (seconds)
  transitionDuration: number;            // Morph interpolation duration (seconds)
  easing: ChainEasing;                   // Transition easing curve
  timingJitter: number;                  // Dynamic timing jitter / organic drift (0.0 to 1.0)
  disperseImpulse: number;               // Fluid shockwave burst kicked on transition (0.0 to 5.0)
  paused?: boolean;                      // Pause playback
}

export interface ChainTimelineState {
  currentIndex: number;
  nextIndex: number;
  currentGlyph: string;
  nextGlyph: string;
  phase: 'hold' | 'transition';
  progress: number; // 0.0 to 1.0
  elapsedInPhase: number;
  totalDurationInPhase: number;
}

export type ColorDistributionMode =
  | 'monochrome'
  | 'linearGradient'
  | 'radialGradient'
  | 'angularSweep'
  | 'velocityThermal'
  | 'densityDepth'
  | 'waveInterference'
  | 'rainbowSpectral';

export type BackgroundAtmosphereMode = 'solid' | 'vignette' | 'ambientGlow' | 'adaptive';

export interface PointCloudColorConfig {
  enabled: boolean;                      // Whether procedural color field is enabled (true = dynamic colors, false = classic ink)
  mode: ColorDistributionMode;          // Spatial color distribution algorithm across the glyph
  primaryColor: string;                 // Hex e.g. '#00f0ff'
  secondaryColor: string;               // Hex e.g. '#ff007f'
  accentColor: string;                  // Hex e.g. '#ffe600'
  cycleSpeed: number;                   // Temporal wave propagation rate (-5.0 to 5.0, 0 = stationary)
  waveFrequency: number;                // Spatial scale / band density across glyph field (0.1 to 8.0)
  angle: number;                        // Wave travel / gradient angle in degrees (0 to 360)
  fieldCenterOffset: [number, number];  // Center offset [x, y] in normalized coordinates (-1.0 to 1.0)
  turbulenceModulation: number;         // Fluid curl noise warping on color coordinates (0.0 to 1.0)
  speedReactiveIntensity: number;       // Kinetic brightness & color shift under fluid velocity (0.0 to 2.0)
  densityWeight: number;                // Shading influence of particle density (0.0 to 1.0)
  hueShiftSpeed: number;                // Continuous temporal hue cycling rate (-2.0 to 2.0)
  contrast: number;                     // Sharpness / contrast between gradient stops (0.2 to 3.0)
  paletteId?: string;                   // Optional preset palette reference ID

  // Background atmosphere variability
  backgroundColor?: string;              // Custom background color hex (e.g. '#09090b', '#000000', '#fafaf9')
  backgroundMode?: BackgroundAtmosphereMode; // Atmospheric style: solid, vignette, ambientGlow, adaptive
  backgroundGlowIntensity?: number;      // 0.0 to 1.0 - glow intensity of particle color on background
}

export interface PointCloudConfig {
  glyph: string | string[];           // e.g., ["O", "I"] or "OI" or "✦ ✧"
  particleCount: number;             // Default: 200000 (nearest power texture e.g. 512x512=262144)
  fontFamily?: string;               // Default: system bold sans/serif
  fontWeight?: string | number;      // Default: 900
  colorMode: 'blackOnWhite' | 'whiteOnBlack';
  backgroundColor?: string;          // Direct background color hex override
  backgroundMode?: BackgroundAtmosphereMode; // Direct background atmosphere mode override
  backgroundGlowIntensity?: number;  // Direct background glow intensity override
  style: 'stipple' | 'halftone';     // Ink stipple vs matrix halftone
  dotShape?: 'circle' | 'square';    // Crisp circular stipple vs typographic square grid
  particleSize: { min: number; max: number };
  fluid: PointCloudFluidConfig;
  interaction: PointCloudInteractionConfig;
  relational?: PointCloudRelationalConfig;
  chaining?: PointCloudChainingConfig;
  color?: PointCloudColorConfig;
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
