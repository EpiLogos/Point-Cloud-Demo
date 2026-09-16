/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shared medium solver passes: the classic grid-fluid recipe — additive splat,
 * semi-Lagrangian self-advection with dissipation, divergence, Jacobi pressure
 * iterations, gradient subtract (PavelDoGreat structure, no interior
 * boundaries). Solver space uses unit cells; stored velocity carries world px/s
 * clamped to MEDIUM_VEL_LIMIT so divergence and pressure stay bounded — the
 * particle velocity clamp remains the final safety. Boundaries: the grid edge
 * only; samples outside [0,1] clamp to the edge texel (free-slip, no normal
 * inflow generated at the boundary).
 */

export const MEDIUM_VEL_LIMIT = 3000.0; // px/s stability bound on stored medium velocity
export const MEDIUM_PRESSURE_DECAY = 0.8; // Jacobi warm-start under-relaxation

/** One vertex per particle; positions arrive from the particle-state texture. */
export const mediumSplatVertexShader = /* glsl */ `
precision highp float;

uniform sampler2D uPositionTexture;
uniform sampler2D uVelocityTexture;
uniform vec2 uMediumMin;
uniform vec2 uMediumMax;
uniform float uMediumPlane; // 0 = XY media axes, 1 = XZ
uniform float uSplatGain;

attribute vec2 aParticleUv;
varying vec4 vSplat;

void main() {
  vec3 pos = texture2D(uPositionTexture, aParticleUv).xyz;
  vec3 vel = texture2D(uVelocityTexture, aParticleUv).xyz;
  vec2 plane = (uMediumPlane > 0.5) ? pos.xz : pos.xy;
  vec2 g = (plane - uMediumMin) / max(uMediumMax - uMediumMin, vec2(0.001));
  vec2 pv = (uMediumPlane > 0.5) ? vel.xz : vel.xy;
  float sp = length(pv);
  // Finite guard: a NaN velocity would poison the medium through accumulation.
  bool finite = all(equal(pv, pv)) && all(equal(plane, plane));
  if (sp > ${MEDIUM_VEL_LIMIT}.0) pv *= ${MEDIUM_VEL_LIMIT}.0 / sp;
  vSplat = finite ? vec4(pv, 1.0, 1.0) * uSplatGain : vec4(0.0);
  gl_Position = vec4(g * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = 1.0;
}
`;

export const mediumSplatFragmentShader = /* glsl */ `
precision highp float;

varying vec4 vSplat;

void main() {
  gl_FragColor = vSplat;
}
`;

export const mediumAdvectShader = /* glsl */ `
precision highp float;

uniform sampler2D uMediumVelocity;
uniform float uDelta;
uniform float uDissipation;  // pow(persistence, dt*60)
uniform float uMediumExtent; // world px covered by the grid side
varying vec2 vUv;

void main() {
  vec4 v = texture2D(uMediumVelocity, vUv);
  vec2 back = clamp(vUv - v.xy * (uDelta / max(uMediumExtent, 1.0)), vec2(0.0), vec2(1.0));
  vec4 advected = texture2D(uMediumVelocity, back) * uDissipation;
  float sp = length(advected.xy);
  if (sp > ${MEDIUM_VEL_LIMIT}.0) advected.xy *= ${MEDIUM_VEL_LIMIT}.0 / sp;
  gl_FragColor = advected;
}
`;

export const mediumDivergenceShader = /* glsl */ `
precision highp float;

uniform sampler2D uMediumVelocity;
uniform vec2 uTexel;
varying vec2 vUv;

void main() {
  float vL = texture2D(uMediumVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float vR = texture2D(uMediumVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float vB = texture2D(uMediumVelocity, vUv - vec2(0.0, uTexel.y)).y;
  float vT = texture2D(uMediumVelocity, vUv + vec2(0.0, uTexel.y)).y;
  gl_FragColor = vec4(0.5 * (vR - vL + vT - vB), 0.0, 0.0, 1.0);
}
`;

export const mediumPressureShader = /* glsl */ `
precision highp float;

uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;
uniform float uPressureDecay; // warm-start under-relaxation
varying vec2 vUv;

void main() {
  float L = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x * uPressureDecay;
  float R = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x * uPressureDecay;
  float B = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x * uPressureDecay;
  float T = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x * uPressureDecay;
  float divergence = texture2D(uDivergence, vUv).x;
  gl_FragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
}
`;

export const mediumGradientSubtractShader = /* glsl */ `
precision highp float;

uniform sampler2D uPressure;
uniform sampler2D uMediumVelocity;
uniform vec2 uTexel;
varying vec2 vUv;

void main() {
  vec4 v = texture2D(uMediumVelocity, vUv);
  float pL = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float pR = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float pB = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float pT = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  vec2 projected = v.xy - vec2(pR - pL, pT - pB);
  float sp = length(projected);
  if (sp > ${MEDIUM_VEL_LIMIT}.0) projected *= ${MEDIUM_VEL_LIMIT}.0 / sp;
  gl_FragColor = vec4(projected, v.z, 1.0);
}
`;
