/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const particleVertexShader = /* glsl */ `
precision highp float;

uniform sampler2D uPositionTexture;
uniform sampler2D uVelocityTexture;

uniform float uMinParticleSize;
uniform float uMaxParticleSize;
uniform float uStyleMode; // 0 = stipple, 1 = halftone
uniform float uPixelRatio;
uniform vec2 uCanvasSize;
uniform float uTime;

varying vec2 vSimUv;
varying float vDensity;
varying float vSpeed;
varying float vJitter;

// High-speed pseudo-random generator
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vSimUv = uv;

  // Sample simulation textures
  vec4 posData = texture2D(uPositionTexture, uv);
  vec4 velData = texture2D(uVelocityTexture, uv);

  vec3 pos = posData.xyz;
  float density = posData.w; // 0.0 (scatter perimeter) to 1.0 (dense stroke core)
  float speed = velData.w;   // local velocity magnitude

  vDensity = density;
  vSpeed = speed;

  // Compute stochastic micro-jitter based on simulation UV coordinates
  float rnd = hash(uv);
  vJitter = rnd;

  // Dynamic particle size calculation
  float baseSize;
  if (uStyleMode > 0.5) {
    // Ordered Halftone mode:
    // Dot radius scales directly with local target darkness/density, creating true raster halftone
    float halftoneT = pow(density, 1.25);
    baseSize = mix(uMinParticleSize * 0.4, uMaxParticleSize, halftoneT);

    // Speed dispersion causes subtle dot disintegration
    baseSize *= clamp(1.0 - speed * 0.0015, 0.35, 1.2);
  } else {
    // Stochastic Stipple mode:
    // Emulates fine ink-jet / risograph spray with random jittered sizes
    float sizeJitter = mix(0.7, 1.35, rnd);
    float densityWeight = mix(0.5, 1.15, density);
    baseSize = mix(uMinParticleSize, uMaxParticleSize, rnd * 0.8 + density * 0.2) * sizeJitter * densityWeight;

    // Fast moving dispersion particles stretch/shrink into fine aerosol spray
    baseSize = mix(baseSize, uMinParticleSize * 0.8, clamp(speed * 0.002, 0.0, 0.7));
  }

  // Orthographic / view space point size scaling
  gl_PointSize = max(1.0, baseSize * uPixelRatio);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const particleFragmentShader = /* glsl */ `
precision highp float;

uniform vec3 uParticleColor;
uniform float uColorMode; // 0 = black on white, 1 = white on black
uniform float uDotShape;  // 0 = circle, 1 = square
uniform float uStyleMode; // 0 = stipple, 1 = halftone
uniform float uContrast;

varying vec2 vSimUv;
varying float vDensity;
varying float vSpeed;
varying float vJitter;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);

  float alpha = 0.0;

  if (uDotShape < 0.5) {
    // High-contrast anti-aliased circular stipple dot
    // Uses smoothstep over tight fractional pixel radius for razor-sharp stippling
    float delta = fwidth(dist);
    alpha = 1.0 - smoothstep(0.48 - delta * 1.5, 0.50, dist);
  } else {
    // Typographic matrix square dither dot
    vec2 d = abs(coord);
    float maxD = max(d.x, d.y);
    float delta = fwidth(maxD);
    alpha = 1.0 - smoothstep(0.48 - delta * 1.5, 0.50, maxD);
  }

  if (alpha < 0.01) {
    discard;
  }

  // Subtle ink saturation modulation in core vs outer spray
  float inkAlpha = alpha;
  if (uStyleMode < 0.5) {
    // Stipple spray has tiny variation in opacity like riso ink absorption
    inkAlpha *= mix(0.85, 1.0, vDensity * 0.5 + vJitter * 0.5);
  }

  gl_FragColor = vec4(uParticleColor, inkAlpha);
}
`;
