/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { curlNoiseGLSL } from './curlNoise';

export const simulationVertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export const positionSimulationShader = /* glsl */ `
precision highp float;

uniform sampler2D uPositionTexture;
uniform sampler2D uVelocityTexture;
uniform float uDelta;

varying vec2 vUv;

void main() {
  vec4 posData = texture2D(uPositionTexture, vUv);
  vec4 velData = texture2D(uVelocityTexture, vUv);

  vec3 pos = posData.xyz;
  vec3 vel = velData.xyz;

  // Integrate position
  pos += vel * uDelta;

  // Mild z-plane dampening to preserve typography clarity in the view plane
  pos.z *= 0.98;

  gl_FragColor = vec4(pos, posData.w); // posData.w holds density/particle metadata
}
`;

export const velocitySimulationShader = /* glsl */ `
precision highp float;

${curlNoiseGLSL}

uniform sampler2D uPositionTexture;
uniform sampler2D uVelocityTexture;
uniform sampler2D uTargetATexture;
uniform sampler2D uTargetBTexture;

uniform float uMorphProgress;
uniform float uDelta;
uniform float uTime;

// Fluid properties
uniform float uCurlScale;
uniform float uCurlSpeed;
uniform float uTurbulence;
uniform float uVortexStrength;
uniform vec2 uVortexCenter;
uniform float uViscosity;
uniform float uReturnSpeed;
uniform float uDispersion;
uniform float uStyleMode; // 0 = stipple, 1 = halftone

// Free Relational System & Multi-Attractor Orbits
uniform float uRelationalEnabled;
uniform int uAttractorCount;
uniform vec4 uAttractors[6];      // xyz = center coords, w = relative mass
uniform float uAttractorSpin[6];  // angular momentum/vorticity per pole
uniform float uRelationalGravity; // gravitational pull strength
uniform float uRelationalSpin;    // orbital tangential swirl force
uniform float uChaosFactor;       // strange attractor turbulence

// Interaction properties
uniform vec2 uPointerPos;
uniform vec2 uPointerVelocity;
uniform float uPointerRadius;
uniform float uPointerStrength;
uniform float uInteractionMode; // 0 = repel, 1 = attract, 2 = vortex

varying vec2 vUv;

void main() {
  vec4 posData = texture2D(uPositionTexture, vUv);
  vec4 velData = texture2D(uVelocityTexture, vUv);
  vec4 targetA = texture2D(uTargetATexture, vUv);
  vec4 targetB = texture2D(uTargetBTexture, vUv);

  vec3 pos = posData.xyz;
  vec3 vel = velData.xyz;

  // Interpolate target shape coordinate and target density
  vec3 targetPos = mix(targetA.xyz, targetB.xyz, clamp(uMorphProgress, 0.0, 1.0));
  float targetDensity = mix(targetA.w, targetB.w, clamp(uMorphProgress, 0.0, 1.0));

  // --- 1. Hooke's Law Restorative Force ---
  vec3 toTarget = targetPos - pos;
  
  // Halftone mode snaps more rigidly to grid positions, stipple mode is looser & more organic
  float returnMultiplier = (uStyleMode > 0.5) ? 6.5 : 4.0;
  // Core density areas have slightly stronger return force, perimeter stipple drifts more freely
  float densityTether = mix(0.45, 1.35, targetDensity);
  // Full testing range: allows negative values (explosive anti-spring) and high snap values
  vec3 fSpring = toTarget * (uReturnSpeed * returnMultiplier * densityTether);

  // --- 2. Divergence-Free Curl Noise Advection ---
  vec3 noiseCoords = vec3(pos.xy * (uCurlScale * 0.0035), pos.z * 0.002);
  vec3 curl = curlNoise(noiseCoords, uTime * uCurlSpeed * 0.85);
  // Modulate curl by dispersion & inverse density so perimeter stippling sprays out
  float curlFalloff = (uStyleMode > 0.5) ? 0.35 : (1.0 + (1.0 - targetDensity) * 0.7);
  vec3 fCurl = curl * (uTurbulence * 85.0 * curlFalloff);

  // --- 3. Vorticity & Orbital Swirl Vector ---
  // Pulls boundary particles in an orbital motion, bridging shapes (e.g. O to I)
  vec2 rVort = pos.xy - uVortexCenter;
  float rLen = length(rVort);
  vec2 vTangent = vec2(-rVort.y, rVort.x) / (rLen + 25.0);
  float vortRadius = 450.0;
  float vortFactor = exp(- (rLen * rLen) / (2.0 * vortRadius * vortRadius));
  vec3 fVortex = vec3(vTangent * (uVortexStrength * 160.0 * vortFactor), 0.0);

  // --- 4. Inter-Glyph Directional Dispersion ---
  vec3 fDisperse = vec3(0.0);
  if (abs(uDispersion) > 0.0001) {
    float bridgeFactor = smoothstep(0.05, 0.95, uMorphProgress) * (1.0 - targetDensity * 0.4);
    fDisperse = vec3(
      uDispersion * 75.0 * (curl.x * 0.8 + 0.6) * bridgeFactor,
      uDispersion * 35.0 * curl.y * bridgeFactor,
      0.0
    );
  }

  // --- 5. Free Relational System: Multi-Attractor Gravity & Orbital Whirlpools ---
  vec3 fRelational = vec3(0.0);
  if (uRelationalEnabled > 0.5) {
    for (int i = 0; i < 6; i++) {
      if (i >= uAttractorCount) break;
      vec3 aPos = uAttractors[i].xyz;
      float aMass = uAttractors[i].w;
      
      vec3 toAttr = aPos - pos;
      float dAttr = length(toAttr);
      
      // Softened gravitational potential (Plummer sphere)
      float eps = 45.0;
      float denom = pow(dAttr * dAttr + eps * eps, 1.45);
      fRelational += toAttr * (uRelationalGravity * aMass * 140000.0 / denom);
      
      // Relational orbital torque / Coriolis swirl around attractor
      vec2 aTan = vec2(-toAttr.y, toAttr.x) / (dAttr + 22.0);
      float aFalloff = exp(- (dAttr * dAttr) / (2.0 * 500.0 * 500.0));
      fRelational.xy += aTan * (uRelationalSpin * uAttractorSpin[i] * 350.0 * aFalloff);
    }

    // Chaos Vector Field (Strange attractor non-linear flow)
    if (uChaosFactor > 0.001) {
      float sX = sin(pos.y * 0.007 + uTime * 0.8);
      float cY = cos(pos.x * 0.007 - uTime * 0.7);
      vec3 chaosVec = vec3(
        sX * cY - 0.08 * pos.x * 0.003,
        cos(pos.z * 0.01 + uTime * 0.5) * sX - 0.08 * pos.y * 0.003,
        sin(pos.x * 0.005 + pos.y * 0.005)
      );
      fRelational += chaosVec * (uChaosFactor * 160.0);
    }
  }

  // --- 6. Pointer Interaction Force ---
  vec3 fPointer = vec3(0.0);
  if (uPointerRadius > 0.0 && abs(uPointerStrength) > 0.0001) {
    vec2 toPtr = pos.xy - uPointerPos;
    float dPtr = length(toPtr);
    if (dPtr < uPointerRadius) {
      float normDist = dPtr / uPointerRadius;
      float falloff = (1.0 - normDist) * (1.0 - normDist);

      if (uInteractionMode < 0.5) {
        // Repulsion: push outward
        vec2 dir = (dPtr > 0.001) ? (toPtr / dPtr) : vec2(0.0, 1.0);
        fPointer.xy += dir * (uPointerStrength * 400.0 * falloff);
      } else if (uInteractionMode < 1.5) {
        // Attraction: pull inward
        vec2 dir = (dPtr > 0.001) ? (-toPtr / dPtr) : vec2(0.0, 0.0);
        fPointer.xy += dir * (uPointerStrength * 400.0 * falloff);
      } else {
        // Pointer Vortex: swirl around cursor
        vec2 pTan = vec2(-toPtr.y, toPtr.x) / (dPtr + 10.0);
        fPointer.xy += pTan * (uPointerStrength * 480.0 * falloff);
      }

      // Velocity injection from mouse movement
      fPointer.xy += uPointerVelocity * (falloff * 0.85);
    }
  }

  // --- 7. Total Acceleration & Viscous Integration ---
  vec3 accel = fSpring + fCurl + fVortex + fDisperse + fRelational + fPointer;
  
  // Velocity damping / viscosity (supports zero damping and hyper-viscous)
  vel = (vel + accel * uDelta) * uViscosity;

  // Clamping relaxed to allow high-velocity kinetic testing
  float speed = length(vel);
  float maxSpeed = 35000.0;
  if (speed > maxSpeed) {
    vel = (vel / speed) * maxSpeed;
    speed = maxSpeed;
  }

  gl_FragColor = vec4(vel, speed);
}
`;
