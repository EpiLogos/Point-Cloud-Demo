/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { PointCloudConfig } from './types';
import {
  simulationVertexShader,
  positionSimulationShader,
  velocitySimulationShader,
} from './shaders/simulationShaders';

export class GPGPUSimulator {
  private renderer: THREE.WebGLRenderer;
  public texWidth: number;
  public texHeight: number;
  public particleCount: number;

  // Ping-pong render targets
  private posTarget0: THREE.WebGLRenderTarget;
  private posTarget1: THREE.WebGLRenderTarget;
  private velTarget0: THREE.WebGLRenderTarget;
  private velTarget1: THREE.WebGLRenderTarget;

  public currentPosTarget: THREE.WebGLRenderTarget;
  public nextPosTarget: THREE.WebGLRenderTarget;
  public currentVelTarget: THREE.WebGLRenderTarget;
  public nextVelTarget: THREE.WebGLRenderTarget;

  // Quad setup for GPGPU render pass
  private quadScene: THREE.Scene;
  private quadCamera: THREE.Camera;
  private quadMesh: THREE.Mesh;

  // Simulation shader materials
  private posMaterial: THREE.ShaderMaterial;
  private velMaterial: THREE.ShaderMaterial;

  constructor(renderer: THREE.WebGLRenderer, particleCount: number = 200000) {
    this.renderer = renderer;

    // Smallest square simulation texture that holds the requested count; the requested
    // count itself is honoured exactly (unused texels are never drawn).
    const requested = Math.max(64, Math.min(4_000_000, Math.floor(particleCount)));
    const texSide = Math.max(8, Math.ceil(Math.sqrt(requested)));

    this.texWidth = texSide;
    this.texHeight = texSide;
    this.particleCount = requested;

    // Determine supported float type
    const isWebGL2 = renderer.capabilities.isWebGL2;
    const floatType = isWebGL2 ? THREE.FloatType : THREE.HalfFloatType;

    const rtOptions: THREE.RenderTargetOptions = {
      type: floatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      generateMipmaps: false,
      stencilBuffer: false,
      depthBuffer: false,
    };

    this.posTarget0 = new THREE.WebGLRenderTarget(this.texWidth, this.texHeight, rtOptions);
    this.posTarget1 = new THREE.WebGLRenderTarget(this.texWidth, this.texHeight, rtOptions);
    this.velTarget0 = new THREE.WebGLRenderTarget(this.texWidth, this.texHeight, rtOptions);
    this.velTarget1 = new THREE.WebGLRenderTarget(this.texWidth, this.texHeight, rtOptions);

    this.currentPosTarget = this.posTarget0;
    this.nextPosTarget = this.posTarget1;
    this.currentVelTarget = this.velTarget0;
    this.nextVelTarget = this.velTarget1;

    // Quad setup
    this.quadScene = new THREE.Scene();
    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quadGeom = new THREE.PlaneGeometry(2, 2);

    // Position simulation material
    this.posMaterial = new THREE.ShaderMaterial({
      vertexShader: simulationVertexShader,
      fragmentShader: positionSimulationShader,
      uniforms: {
        uPositionTexture: { value: null },
        uVelocityTexture: { value: null },
        uDelta: { value: 0.016 },
        uCompPlane: { value: 0.0 },
        uMorphTrajectory: { value: 0.0 },
        uZDepthRetention: { value: 0.0 },
        uZConfinement: { value: 1.0 },
      },
      depthTest: false,
      depthWrite: false,
    });

    // Velocity simulation material
    this.velMaterial = new THREE.ShaderMaterial({
      vertexShader: simulationVertexShader,
      fragmentShader: velocitySimulationShader,
      uniforms: {
        uPositionTexture: { value: null },
        uVelocityTexture: { value: null },
        uTargetATexture: { value: null },
        uTargetBTexture: { value: null },
        uMorphProgress: { value: 0.0 },
        uDelta: { value: 0.016 },
        uTime: { value: 0.0 },

        // Fluid forces
        uCurlScale: { value: 1.0 },
        uCurlSpeed: { value: 0.8 },
        uTurbulence: { value: 1.0 },
        uVortexStrength: { value: 1.2 },
        uVortexCenter: { value: new THREE.Vector2(0, 0) },
        uViscosity: { value: 0.94 },
        uReturnSpeed: { value: 1.0 },
        uDispersion: { value: 0.5 },
        uStyleMode: { value: 0.0 },

        // Extended physics
        uSnapRigidity: { value: 1.0 },
        uDensityTether: { value: 1.0 },
        uCurlDepth: { value: 0.57 },
        uVortexRadius: { value: 450.0 },
        uGravity: { value: new THREE.Vector3(0, 0, 0) },
        uQuadraticDrag: { value: 0.0 },
        uThermalJitter: { value: 0.0 },
        uMaxSpeed: { value: 35000.0 },
        uGravitySoftening: { value: 45.0 },
        uGravityFalloff: { value: 1.45 },
        uSwirlRadius: { value: 500.0 },
        uPointerFalloffPower: { value: 2.0 },
        uTorPhase: { value: 0.0 },
        uPolPhase: { value: 0.0 },

        // Free Relational System
        uRelationalEnabled: { value: 0.0 },
        uAttractorCount: { value: 2 },
        uAttractors: {
          value: [
            new THREE.Vector4(-150, 0, 0, 1.0),
            new THREE.Vector4(150, 0, 0, 1.0),
            new THREE.Vector4(0, 150, 0, 1.0),
            new THREE.Vector4(0, -150, 0, 1.0),
            new THREE.Vector4(100, 100, 0, 1.0),
            new THREE.Vector4(-100, -100, 0, 1.0),
            new THREE.Vector4(0, 250, 0, 1.0),
            new THREE.Vector4(0, -250, 0, 1.0),
            new THREE.Vector4(200, 0, 0, 1.0),
            new THREE.Vector4(-200, 0, 0, 1.0),
          ],
        },
        uAttractorSpin: { value: [1.0, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0, -1.0] },
        uRelationalGravity: { value: 1.5 },
        uRelationalSpin: { value: 1.2 },
        uChaosFactor: { value: 0.0 },

        // Entities (first-class centres of formation)
        uEntityCount: { value: 0 },
        uEntityBounds: { value: new Float32Array(10) },
        uEntityCenter: { value: Array.from({ length: 10 }, () => new THREE.Vector4(0, 0, 0, 200)) },
        uEntityMorph: { value: new Float32Array(10) },
        uEntityForce: { value: Array.from({ length: 10 }, () => new THREE.Vector4(0, 0, 0, 0)) },
        uTexSize: { value: new THREE.Vector2(1, 1) },
        uCompPlane: { value: 0.0 },
        uResDominance: { value: 1.0 },

        // Continuous modal cymatic resonator (live per-mode complex envelopes)
        uResEnabled: { value: 0.0 },
        uResModeCount: { value: 0 },
        uResRe: { value: new Float32Array(64) },
        uResIm: { value: new Float32Array(64) },
        uResPlateSize: { value: 700.0 },
        uResTransport: { value: 1.0 },
        uResAgitation: { value: 0.3 },
        uResBoundary: { value: 6.0 },
        uResPlane: { value: 0.0 },
        uResDriveScale: { value: 1.0 },

        // Dual-Phase Toroidal/Poloidal Morph & Inverse Hopf Fibration System
        uMorphTrajectory: { value: 1.0 },
        uFiberPhaseOffset: { value: 0.0 },
        uToroidalWinding: { value: 3.0 },
        uPoloidalWinding: { value: 2.0 },
        uChiralCoupling: { value: 0.75 },
        uOscillationAmp: { value: 1.2 },
        uOscillationFreq: { value: 0.8 },
        uManifoldRadius: { value: 180.0 },
        uTorusDepthScale: { value: 1.0 },

        // Pointer
        uPointerPos: { value: new THREE.Vector2(-99999, -99999) },
        uPointerVelocity: { value: new THREE.Vector2(0, 0) },
        uPointerRadius: { value: 150.0 },
        uPointerStrength: { value: 1.0 },
        uInteractionMode: { value: 0.0 },

        // Placed persistent interaction points in 3D
        uPlacedPointCount: { value: 0 },
        uPlacedPoints: {
          value: Array.from({ length: 8 }, () => new THREE.Vector4(-99999, -99999, 0, 0)),
        },
        uPlacedPointParams: {
          value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0, 0)),
        },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.quadMesh = new THREE.Mesh(quadGeom, this.posMaterial);
    this.quadScene.add(this.quadMesh);
  }

  /**
   * Initializes position and velocity textures with seed data from target A
   */
  public seedInitialState(initialData: Float32Array) {
    const initTex = new THREE.DataTexture(
      initialData,
      this.texWidth,
      this.texHeight,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    initTex.needsUpdate = true;
    initTex.minFilter = THREE.NearestFilter;
    initTex.magFilter = THREE.NearestFilter;

    // Render initial data into both position targets
    const passMaterial = new THREE.ShaderMaterial({
      vertexShader: simulationVertexShader,
      fragmentShader: /* glsl */ `
        uniform sampler2D uInitTexture;
        varying vec2 vUv;
        void main() {
          gl_FragColor = texture2D(uInitTexture, vUv);
        }
      `,
      uniforms: { uInitTexture: { value: initTex } },
      depthTest: false,
      depthWrite: false,
    });

    this.quadMesh.material = passMaterial;
    this.renderer.setRenderTarget(this.posTarget0);
    this.renderer.render(this.quadScene, this.quadCamera);
    this.renderer.setRenderTarget(this.posTarget1);
    this.renderer.render(this.quadScene, this.quadCamera);

    // Clear velocities to 0
    const zeroVelMaterial = new THREE.ShaderMaterial({
      vertexShader: simulationVertexShader,
      fragmentShader: /* glsl */ `
        void main() {
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      `,
      depthTest: false,
      depthWrite: false,
    });

    this.quadMesh.material = zeroVelMaterial;
    this.renderer.setRenderTarget(this.velTarget0);
    this.renderer.render(this.quadScene, this.quadCamera);
    this.renderer.setRenderTarget(this.velTarget1);
    this.renderer.render(this.quadScene, this.quadCamera);

    this.renderer.setRenderTarget(null);
    initTex.dispose();
    passMaterial.dispose();
    zeroVelMaterial.dispose();
  }

  /**
   * Updates target textures for morphing
   */
  public setTargetTextures(texA: THREE.DataTexture, texB: THREE.DataTexture, vortexCenter: THREE.Vector2) {
    this.velMaterial.uniforms.uTargetATexture.value = texA;
    this.velMaterial.uniforms.uTargetBTexture.value = texB;
    this.velMaterial.uniforms.uVortexCenter.value.copy(vortexCenter);
  }

  /**
   * Updates dynamic attractor positions and polarities for relational orbital dynamics
   */
  public setAttractors(attractors: THREE.Vector4[], spins: number[]) {
    const attrUniform = this.velMaterial.uniforms.uAttractors.value as THREE.Vector4[];
    for (let i = 0; i < Math.min(attractors.length, attrUniform.length); i++) {
      attrUniform[i].copy(attractors[i]);
    }
    const spinUniform = this.velMaterial.uniforms.uAttractorSpin.value as number[];
    for (let i = 0; i < Math.min(spins.length, spinUniform.length); i++) {
      spinUniform[i] = spins[i];
    }
  }

  /** Push the entity uniform set (partition bounds, centres, morph, forces) to the velocity material */
  public setEntityState(u: {
    count: number;
    bounds: Float32Array;
    centers: THREE.Vector4[];
    morph: Float32Array;
    forces: THREE.Vector4[];
  }) {
    const vU = this.velMaterial.uniforms;
    vU.uEntityCount.value = Math.min(10, u.count);
    (vU.uEntityBounds.value as Float32Array).set(u.bounds.subarray(0, 10));
    (vU.uEntityMorph.value as Float32Array).set(u.morph.subarray(0, 10));
    const cU = vU.uEntityCenter.value as THREE.Vector4[];
    const fU = vU.uEntityForce.value as THREE.Vector4[];
    for (let i = 0; i < 10; i++) {
      cU[i].copy(u.centers[i]);
      fU[i].copy(u.forces[i]);
    }
    (vU.uTexSize.value as THREE.Vector2).set(this.texWidth, this.texHeight);
  }

  public setCompositionPlane(plane: 'vertical' | 'horizontal') {
    const v = plane === 'horizontal' ? 1.0 : 0.0;
    this.velMaterial.uniforms.uCompPlane.value = v;
    this.posMaterial.uniforms.uCompPlane.value = v;
    // resonator plate follows the composition plane (0 = horizontal XZ, 1 = vertical XY in its own convention)
    this.velMaterial.uniforms.uResPlane.value = v > 0.5 ? 0.0 : 1.0;
  }

  public setResonatorDominance(d: number) {
    this.velMaterial.uniforms.uResDominance.value = Math.max(0, Math.min(1, d));
  }

  /** Push the live modal envelopes + coupling parameters of the cymatic resonator */
  public setResonatorState(
    enabled: boolean,
    modeCount: number,
    re: Float32Array,
    im: Float32Array,
    plateSize: number,
    transport: number,
    agitation: number,
    boundary: number,
    plane: number,
    driveScale: number
  ) {
    const vU = this.velMaterial.uniforms;
    vU.uResEnabled.value = enabled ? 1.0 : 0.0;
    vU.uResModeCount.value = Math.max(0, Math.min(64, Math.round(modeCount)));
    (vU.uResRe.value as Float32Array).set(re.subarray(0, 64));
    (vU.uResIm.value as Float32Array).set(im.subarray(0, 64));
    vU.uResPlateSize.value = plateSize;
    vU.uResTransport.value = transport;
    vU.uResAgitation.value = agitation;
    vU.uResBoundary.value = boundary;
    vU.uResPlane.value = plane;
    vU.uResDriveScale.value = driveScale;
  }

  public setToroidalMorphParams(
    trajectory: number,
    fiberPhaseOffset: number,
    toroidalWinding: number,
    poloidalWinding: number,
    chiralCoupling: number,
    oscillationAmp: number,
    oscillationFreq: number,
    manifoldRadius: number
  ) {
    const vU = this.velMaterial.uniforms;
    vU.uMorphTrajectory.value = trajectory;
    vU.uFiberPhaseOffset.value = fiberPhaseOffset;
    vU.uToroidalWinding.value = toroidalWinding;
    vU.uPoloidalWinding.value = poloidalWinding;
    vU.uChiralCoupling.value = chiralCoupling;
    vU.uOscillationAmp.value = oscillationAmp;
    vU.uOscillationFreq.value = oscillationFreq;
    vU.uManifoldRadius.value = manifoldRadius;
  }

  /** Running phases of the two conjugate morph oscillators (radians) */
  public setMorphPhases(toroidal: number, poloidal: number) {
    this.velMaterial.uniforms.uTorPhase.value = toroidal;
    this.velMaterial.uniforms.uPolPhase.value = poloidal;
  }

  /**
   * Advances simulation by dt seconds
   */
  public step(
    dt: number,
    time: number,
    config: PointCloudConfig,
    morphProgress: number,
    pointerPos: THREE.Vector2,
    pointerVel: THREE.Vector2
  ) {
    // 1. Update uniforms for velocity simulation
    const vUniforms = this.velMaterial.uniforms;
    vUniforms.uPositionTexture.value = this.currentPosTarget.texture;
    vUniforms.uVelocityTexture.value = this.currentVelTarget.texture;
    vUniforms.uMorphProgress.value = morphProgress;
    vUniforms.uDelta.value = Math.min(dt, 0.033);
    vUniforms.uTime.value = time;

    vUniforms.uCurlScale.value = config.fluid.curlScale;
    vUniforms.uCurlSpeed.value = config.fluid.curlSpeed;
    vUniforms.uTurbulence.value = config.fluid.turbulence ?? 1.0;
    vUniforms.uVortexStrength.value = config.fluid.vortexStrength;
    vUniforms.uViscosity.value = config.fluid.viscosity;
    vUniforms.uReturnSpeed.value = config.fluid.returnSpeed;
    vUniforms.uDispersion.value = config.fluid.dispersion ?? 0.5;
    vUniforms.uStyleMode.value = config.style === 'halftone' ? 1.0 : 0.0;

    // Extended physics
    const fl = config.fluid;
    vUniforms.uSnapRigidity.value = fl.snapRigidity ?? 1.0;
    vUniforms.uDensityTether.value = fl.densityTether ?? 1.0;
    vUniforms.uCurlDepth.value = fl.curlDepth ?? 0.57;
    vUniforms.uVortexRadius.value = fl.vortexRadius ?? 450.0;
    (vUniforms.uGravity.value as THREE.Vector3).set(fl.gravityX ?? 0, fl.gravityY ?? 0, fl.gravityZ ?? 0);
    vUniforms.uQuadraticDrag.value = fl.quadraticDrag ?? 0.0;
    vUniforms.uThermalJitter.value = fl.thermalJitter ?? 0.0;
    vUniforms.uMaxSpeed.value = fl.maxSpeed ?? 35000.0;
    vUniforms.uPointerFalloffPower.value = config.interaction.falloffPower ?? 2.0;

    // Toroidal / Hopf morph uniforms
    const tm = config.toroidalMorph;
    if (tm && tm.enabled) {
      let trajVal = 1.0;
      if (tm.trajectory === 'linear') trajVal = 0.0;
      else if (tm.trajectory === 'vortexSpiral') trajVal = 2.0;
      else if (tm.trajectory === 'quantumInterference') trajVal = 3.0;
      else trajVal = 1.0;

      vUniforms.uMorphTrajectory.value = trajVal;
      vUniforms.uFiberPhaseOffset.value = tm.fiberPhaseOffset ?? 0.0;
      vUniforms.uToroidalWinding.value = tm.toroidalWinding ?? 3.0;
      vUniforms.uPoloidalWinding.value = tm.poloidalWinding ?? 2.0;
      vUniforms.uChiralCoupling.value = tm.chiralCoupling ?? 0.75;
      vUniforms.uOscillationAmp.value = tm.oscillationAmplitude ?? 1.2;
      vUniforms.uOscillationFreq.value = tm.oscillationSpeed ?? 0.8;
      vUniforms.uManifoldRadius.value = tm.manifoldRadius ?? 180.0;
      vUniforms.uTorusDepthScale.value = tm.volumetricDepthScale ?? 1.0;
    } else {
      vUniforms.uMorphTrajectory.value = 0.0;
      vUniforms.uFiberPhaseOffset.value = 0.0;
      vUniforms.uToroidalWinding.value = 3.0;
      vUniforms.uPoloidalWinding.value = 2.0;
      vUniforms.uChiralCoupling.value = 0.75;
      vUniforms.uOscillationAmp.value = 1.2;
      vUniforms.uOscillationFreq.value = 0.8;
      vUniforms.uManifoldRadius.value = 180.0;
      vUniforms.uTorusDepthScale.value = 1.0;
    }

    // Relational system uniforms
    const rel = config.relational;
    vUniforms.uRelationalEnabled.value = rel?.enabled ? 1.0 : 0.0;
    vUniforms.uAttractorCount.value = Math.max(1, Math.min(10, rel?.attractorCount ?? 2));
    vUniforms.uRelationalGravity.value = rel?.attractorGravity ?? 1.5;
    vUniforms.uRelationalSpin.value = rel?.relationalSpin ?? 1.2;
    vUniforms.uChaosFactor.value = rel?.chaosFactor ?? 0.0;
    vUniforms.uGravitySoftening.value = rel?.gravitySoftening ?? 45.0;
    vUniforms.uGravityFalloff.value = rel?.gravityFalloff ?? 1.45;
    vUniforms.uSwirlRadius.value = rel?.swirlRadius ?? 500.0;

    vUniforms.uPointerPos.value.copy(pointerPos);
    vUniforms.uPointerVelocity.value.copy(pointerVel).multiplyScalar(config.interaction.velocityInfluence ?? 1.0);
    vUniforms.uPointerRadius.value = config.interaction.radius;
    vUniforms.uPointerStrength.value = config.interaction.strength;

    let modeVal = 0.0;
    if (config.interaction.mode === 'attract') modeVal = 1.0;
    else if (config.interaction.mode === 'vortex') modeVal = 2.0;
    vUniforms.uInteractionMode.value = modeVal;

    // Placed interaction points in 3D
    const placed = config.interaction.placedPoints || [];
    vUniforms.uPlacedPointCount.value = Math.min(8, placed.length);
    for (let i = 0; i < 8; i++) {
      const p = placed[i];
      if (p && p.active !== false) {
        (vUniforms.uPlacedPoints.value[i] as THREE.Vector4).set(
          p.x,
          p.y,
          p.z ?? 0.0,
          p.radius
        );
        let pMode = 0.0;
        if (p.mode === 'attract') pMode = 1.0;
        else if (p.mode === 'vortex') pMode = 2.0;
        (vUniforms.uPlacedPointParams.value[i] as THREE.Vector4).set(p.strength, pMode, 0, 0);
      } else {
        (vUniforms.uPlacedPoints.value[i] as THREE.Vector4).set(-99999, -99999, 0, 0);
        (vUniforms.uPlacedPointParams.value[i] as THREE.Vector4).set(0, 0, 0, 0);
      }
    }

    // 2. Render velocity simulation pass
    this.quadMesh.material = this.velMaterial;
    this.renderer.setRenderTarget(this.nextVelTarget);
    this.renderer.render(this.quadScene, this.quadCamera);

    // Swap velocity targets
    const tempVel = this.currentVelTarget;
    this.currentVelTarget = this.nextVelTarget;
    this.nextVelTarget = tempVel;

    // 3. Update uniforms for position simulation
    const pUniforms = this.posMaterial.uniforms;
    pUniforms.uPositionTexture.value = this.currentPosTarget.texture;
    pUniforms.uVelocityTexture.value = this.currentVelTarget.texture;
    pUniforms.uDelta.value = Math.min(dt, 0.033);
    pUniforms.uMorphTrajectory.value = tm && tm.enabled !== false && tm.trajectory !== 'linear' ? 1.0 : 0.0;
    pUniforms.uZDepthRetention.value = tm?.enabled ? 1.0 : 0.0;
    pUniforms.uZConfinement.value = config.fluid.zConfinement ?? 1.0;

    // 4. Render position simulation pass
    this.quadMesh.material = this.posMaterial;
    this.renderer.setRenderTarget(this.nextPosTarget);
    this.renderer.render(this.quadScene, this.quadCamera);

    // Swap position targets
    const tempPos = this.currentPosTarget;
    this.currentPosTarget = this.nextPosTarget;
    this.nextPosTarget = tempPos;

    // Reset render target
    this.renderer.setRenderTarget(null);
  }

  public destroy() {
    this.posTarget0.dispose();
    this.posTarget1.dispose();
    this.velTarget0.dispose();
    this.velTarget1.dispose();
    this.posMaterial.dispose();
    this.velMaterial.dispose();
  }
}
