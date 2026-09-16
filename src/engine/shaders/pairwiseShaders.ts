/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Sorted-grid pairwise collision (DEM-style contact response), fragment-shader
 * GPGPU. Four passes, run before the velocity pass only when pairwise is
 * enabled (see GPGPUSimulator.step):
 *   1. cellId  — key every particle texel by its composition-plane cell
 *   2. sort    — one parameterized material executing the bitonic schedule from
 *                pairwiseSchedule.ts (uPartner / uBlock compare-exchange)
 *   3. range   — per-cell binary search over the sorted keys -> (1-based start,
 *                count) in a cell-table texture sized to the cell grid
 *   4. force   — each particle texel sums contact response over its 3x3 cell
 *                neighbourhood directly in particle-index space. Output:
 *                xy = position correction (px, applied by the position pass),
 *                zw = velocity delta (px/s, applied by the velocity pass).
 *                Separation lives at the position level (a bounded projection
 *                cannot pump energy into a dense packing); velocity change is
 *                reserved for genuine approach/recession between pairs.
 *
 * All indices/keys are exact integers held in highp floats (<= 2**24). The force
 * pass writes every texel, so no clear pass is needed anywhere in the chain.
 */

import { PAIRWISE_CELL_CAPACITY, PAIRWISE_KEY_SENTINEL, PAIRWISE_SEARCH_ITERATIONS } from '../pairwiseSchedule';

/** Pass 1: (cellKey, particleLinearIndex) per texel; unused/padded texels get the sentinel key. */
export const pairwiseCellIdShader = /* glsl */ `
precision highp float;

uniform sampler2D uPositionTexture;
uniform vec2 uTexSize;        // particle-state texture size
uniform float uParticleCount;
uniform float uExtent;        // grid half-extent, world px
uniform float uCellSize;      // >= interaction radius
uniform vec2 uCells;          // cell-grid dimensions
uniform float uCompPlane;     // 0 = vertical (XY), 1 = horizontal (XZ)

varying vec2 vUv;

void main() {
  float pIndex = floor(vUv.y * uTexSize.y) * uTexSize.x + floor(vUv.x * uTexSize.x);
  if (pIndex >= uParticleCount) {
    gl_FragColor = vec4(${PAIRWISE_KEY_SENTINEL.toFixed(1)}, 0.0, 0.0, 1.0);
    return;
  }
  vec3 pos = texture2D(uPositionTexture, vUv).xyz;
  vec2 p = (uCompPlane < 0.5) ? pos.xy : pos.xz;
  vec2 c = clamp(floor((p + uExtent) / uCellSize), vec2(0.0), uCells - 1.0);
  gl_FragColor = vec4(c.y * uCells.x + c.x, pIndex, 0.0, 1.0);
}
`;

/** Pass 2: one material for the whole bitonic network; a texel keeps the min/max of its XOR partner pair. */
export const pairwiseSortShader = /* glsl */ `
precision highp float;

uniform sampler2D uSortTexture;
uniform float uSide;    // padded power-of-two texture side
uniform float uPartner; // texel XOR distance (power of two)
uniform float uBlock;   // ascending / descending block size (power of two)

varying vec2 vUv;

vec2 keyIndexAt(float i) {
  return texture2D(uSortTexture, (vec2(mod(i, uSide), floor(i / uSide)) + 0.5) / uSide).rg;
}

void main() {
  float i = floor(vUv.y * uSide) * uSide + floor(vUv.x * uSide);
  float bit = mod(floor(i / uPartner), 2.0);
  float j = bit < 0.5 ? i + uPartner : i - uPartner;
  vec4 a = texture2D(uSortTexture, vUv);
  vec2 b = keyIndexAt(j);
  bool asc = mod(floor(i / uBlock), 2.0) < 0.5;
  bool low = i < j;
  // Symmetric tie rule: both texels of a pair agree, so (key, index) pairs never split.
  bool aFirst = (a.x < b.x) || (a.x == b.x && i < j);
  vec4 lo = aFirst ? a : vec4(b.x, b.y, 0.0, 1.0);
  vec4 hi = aFirst ? vec4(b.x, b.y, 0.0, 1.0) : a;
  gl_FragColor = (asc == low) ? lo : hi;
}
`;

/** Pass 3: renders the cell grid; each cell binary-searches the sorted list for its run. */
export const pairwiseRangeShader = /* glsl */ `
precision highp float;

uniform sampler2D uSortTexture;
uniform float uSide;   // padded sort texture side
uniform float uSlots;  // side * side
uniform vec2 uCells;

varying vec2 vUv;

float keyAt(float i) {
  return texture2D(uSortTexture, (vec2(mod(i, uSide), floor(i / uSide)) + 0.5) / uSide).x;
}

void main() {
  vec2 c = floor(vUv * uCells);
  float cell = c.y * uCells.x + c.x;
  // Leftmost slot with key >= cell.
  float lo = 0.0;
  float hi = uSlots;
  for (int k = 0; k < ${PAIRWISE_SEARCH_ITERATIONS}; k++) {
    float mid = floor((lo + hi) * 0.5);
    if (keyAt(mid) >= cell) hi = mid; else lo = mid;
  }
  float start = hi;
  float count = 0.0;
  if (keyAt(start) == cell) {
    // Leftmost slot with key > cell.
    float lo2 = start;
    float hi2 = uSlots;
    for (int k = 0; k < ${PAIRWISE_SEARCH_ITERATIONS}; k++) {
      float mid = floor((lo2 + hi2) * 0.5);
      if (keyAt(mid) > cell) hi2 = mid; else lo2 = mid;
    }
    count = hi2 - start;
  }
  gl_FragColor = vec4(start + 1.0, count, 0.0, 1.0); // 1-based start disambiguates slot 0
}
`;

/** Pass 4: particle-index space. Each texel sums contact response over its 3x3 cell neighbourhood. */
export const pairwiseForceShader = /* glsl */ `
precision highp float;

uniform sampler2D uPositionTexture;
uniform sampler2D uVelocityTexture;
uniform sampler2D uSortTexture;   // sorted (cellKey, particleIndex) list
uniform sampler2D uCellTable;     // per-cell (1-based start, count)
uniform vec2 uTexSize;
uniform vec2 uCells;
uniform float uSide;
uniform float uExtent;
uniform float uCellSize;
uniform float uRadius;            // interaction radius h, world px
uniform float uStiffness;
uniform float uRestitution;
uniform float uPairViscosity;
uniform float uCompPlane;
uniform float uParticleCount;

varying vec2 vUv;

vec2 sortUv(float i) {
  return (vec2(mod(i, uSide), floor(i / uSide)) + 0.5) / uSide;
}

vec2 particleUv(float i) {
  return (vec2(mod(i, uTexSize.x), floor(i / uTexSize.x)) + 0.5) / uTexSize;
}

void main() {
  float pIndex = floor(vUv.y * uTexSize.y) * uTexSize.x + floor(vUv.x * uTexSize.x);
  vec2 corr = vec2(0.0);
  vec2 dv = vec2(0.0);
  if (pIndex < uParticleCount) {
    vec3 pos = texture2D(uPositionTexture, vUv).xyz;
    vec3 vel = texture2D(uVelocityTexture, vUv).xyz;
    vec2 p2 = (uCompPlane < 0.5) ? pos.xy : pos.xz;
    vec2 v2 = (uCompPlane < 0.5) ? vel.xy : vel.xz;
    vec2 c = clamp(floor((p2 + uExtent) / uCellSize), vec2(0.0), uCells - 1.0);
    float cap = float(${PAIRWISE_CELL_CAPACITY});
    float responded = 0.0;
    bool stop = false;
    for (int dy = -1; dy <= 1; dy++) {
      if (stop) break;
      for (int dx = -1; dx <= 1; dx++) {
        if (stop) break;
        vec2 cn = c + vec2(float(dx), float(dy));
        if (cn.x < 0.0 || cn.y < 0.0 || cn.x >= uCells.x || cn.y >= uCells.y) continue;
        vec2 range = texture2D(uCellTable, (cn + 0.5) / uCells).rg;
        float count = min(range.y, cap);
        for (int k = 0; k < ${PAIRWISE_CELL_CAPACITY}; k++) {
          if (float(k) >= count) break;
          float other = texture2D(uSortTexture, sortUv(range.x - 1.0 + float(k))).y;
          if (other == pIndex) continue;
          vec3 oPos = texture2D(uPositionTexture, particleUv(other)).xyz;
          vec3 oVel = texture2D(uVelocityTexture, particleUv(other)).xyz;
          vec2 q2 = (uCompPlane < 0.5) ? oPos.xy : oPos.xz;
          vec2 w2 = (uCompPlane < 0.5) ? oVel.xy : oVel.xz;
          vec2 d = p2 - q2;
          float dist = length(d);
          if (dist >= uRadius || dist < 0.0001) continue;
          // Total-response cap: glyph packing puts hundreds of particles inside h;
          // the nearest CAP contacts define the interaction. Slot visits stay
          // bounded by 9 x CAP either way.
          if (responded >= cap) { stop = true; break; }
          responded += 1.0;
          vec2 n = d / dist;
          float x = 1.0 - dist / uRadius;
          // Position-level separation: a relaxed projection (fraction of the
          // overlap) that cannot add kinetic energy, so a dense packing stays
          // quiet at rest instead of pre-pressurising the field.
          corr += n * (x * x * uRadius * 0.35 * uStiffness);
          vec2 relV = v2 - w2;
          float vn = dot(relV, n);
          // Normal restitution only for approaching pairs; tangential smoothing.
          if (vn < 0.0) dv += n * (-vn * (1.0 + uRestitution) * 0.5);
          dv -= (relV - n * vn) * (uPairViscosity * 0.5);
        }
      }
    }
    // Bound the total projection so dense piles correct, never teleport.
    float cLen = length(corr);
    float cMax = 2.0 * uRadius;
    if (cLen > cMax) corr *= cMax / cLen;
  }
  // Corrections live in the composition plane; the consumer picks its two axes.
  gl_FragColor = vec4(corr, dv);
}
`;
