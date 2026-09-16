/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { PointCloudConfig } from './types';
import type { ForceEmitterState } from './forceRuntime';
import {
  simulationVertexShader,
  positionSimulationShader,
  velocitySimulationShader,
} from './shaders/simulationShaders';
import {
  pairwiseCellIdShader,
  pairwiseForceShader,
  pairwiseRangeShader,
  pairwiseSortShader,
} from './shaders/pairwiseShaders';
import {
  bitonicSchedule,
  cellGridDims,
  PAIRWISE_MAX_PARTICLES,
  PAIRWISE_MAX_SPEED_FRACTION,
  PairwiseSortPass,
  sortSideForParticleTexSide,
} from './pairwiseSchedule';

export class GPGPUSimulator {
  private renderer: THREE.WebGLRenderer;
  public texWidth: number;
  public texHeight: number;
  public particleCount: number;
  public seedGeneration = 0;
  public stepCount = 0;

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

  // Sorted-grid pairwise collision passes (allocated lazily; zero draw calls while disabled)
  private pairCellIdMaterial: THREE.ShaderMaterial;
  private pairSortMaterial: THREE.ShaderMaterial;
  private pairRangeMaterial: THREE.ShaderMaterial;
  private pairForceMaterial: THREE.ShaderMaterial;
  private pairSortA: THREE.WebGLRenderTarget | null = null;
  private pairSortB: THREE.WebGLRenderTarget | null = null;
  private pairCellTable: THREE.WebGLRenderTarget | null = null;
  private pairForceTarget: THREE.WebGLRenderTarget | null = null;
  private pairForceFallback: THREE.DataTexture;
  private pairSchedule: PairwiseSortPass[] | null = null;
  private pairSide = 0;
  private pairCells = new THREE.Vector2(0, 0);
  private pairWarned = false;
  private rtTemplate: THREE.RenderTargetOptions;

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
    this.rtTemplate = rtOptions;

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
        uTargetNoise: { value: null },
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
        uEntityDepthScale: {value: new Float32Array(10).fill(1)},
        uEntityNormalized: {value: new Float32Array(10)},
        uEntityTransform: { value: Array.from({length:10},()=>new THREE.Vector3(1,1,0)) },
        uTexSize: { value: new THREE.Vector2(1, 1) },
        uForceEmitterCount: { value: 0 },
        uForceEmitterCenter: { value: Array.from({ length: 18 }, () => new THREE.Vector4(-99999, -99999, 0, 1)) },
        uForceEmitterParams: { value: Array.from({ length: 18 }, () => new THREE.Vector4(0, 0, 0, 0)) },
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

        // Sorted-grid pairwise collisions (bound to a 1x1 zero texture while disabled)
        uPairwiseForceTexture: { value: null },
        uPairwiseEnabled: { value: 0.0 },
        uPairMaxDelta: { value: 5000.0 },

        // Dual-Phase Toroidal/Poloidal Morph & Inverse Hopf Fibration System
        uMorphTrajectory: { value: 1.0 },
        uFiberPhaseOffset: { value: 0.0 },
        uToroidalWinding: { value: 3.0 },
        uPoloidalWinding: { value: 2.0 },
        uChiralCoupling: { value: 0.75 },
        uOscillationAmp: { value: 1.2 },
        uOscillationFreq: { value: 0.8 },
        uBreathPhase: { value: 0.0 },
        uBreathDepth: { value: 0.35 },
        uManifoldRadius: { value: 180.0 },
        uTorusDepthScale: { value: 1.0 },

        // Pointer
        uPointerPos: { value: new THREE.Vector2(-99999, -99999) },
        uBurstPosition: {value: new THREE.Vector2()},
        uBurstVelocity: {value: new THREE.Vector2()},
        uBurstRadius: { value: 150.0 },
        uBurstRadial: { value: 0.0 },
        uBurstSpin: { value: 0.0 },
        uPointerVelocity: { value: new THREE.Vector2(0, 0) },
        uPointerZ: { value: 0 },
        uPointerRadius: { value: 150.0 },
        uPointerStrength: { value: 1.0 },
        uInteractionMode: { value: 0.0 },

      },
      depthTest: false,
      depthWrite: false,
    });

    this.quadMesh = new THREE.Mesh(quadGeom, this.posMaterial);
    this.quadScene.add(this.quadMesh);

    // Pairwise materials share the quad; targets are created on first enabled frame.
    const pwUniforms = () => ({
      uPositionTexture: { value: null },
      uVelocityTexture: { value: null },
      uSortTexture: { value: null },
      uCellTable: { value: null },
      uTexSize: { value: new THREE.Vector2(this.texWidth, this.texHeight) },
      uCells: { value: new THREE.Vector2(1, 1) },
      uSide: { value: 1.0 },
      uSlots: { value: 1.0 },
      uParticleCount: { value: this.particleCount },
      uExtent: { value: 1400.0 },
      uCellSize: { value: 14.0 },
      uRadius: { value: 14.0 },
      uStiffness: { value: 1.0 },
      uRestitution: { value: 0.2 },
      uPairViscosity: { value: 0.3 },
      uCompPlane: { value: 0.0 },
      uDelta: { value: 0.016 },
      uPartner: { value: 1.0 },
      uBlock: { value: 2.0 },
    });
    this.pairCellIdMaterial = new THREE.ShaderMaterial({
      vertexShader: simulationVertexShader,
      fragmentShader: pairwiseCellIdShader,
      uniforms: pwUniforms(),
      depthTest: false,
      depthWrite: false,
    });
    this.pairSortMaterial = new THREE.ShaderMaterial({
      vertexShader: simulationVertexShader,
      fragmentShader: pairwiseSortShader,
      uniforms: pwUniforms(),
      depthTest: false,
      depthWrite: false,
    });
    this.pairRangeMaterial = new THREE.ShaderMaterial({
      vertexShader: simulationVertexShader,
      fragmentShader: pairwiseRangeShader,
      uniforms: pwUniforms(),
      depthTest: false,
      depthWrite: false,
    });
    this.pairForceMaterial = new THREE.ShaderMaterial({
      vertexShader: simulationVertexShader,
      fragmentShader: pairwiseForceShader,
      uniforms: pwUniforms(),
      depthTest: false,
      depthWrite: false,
    });

    this.pairForceFallback = new THREE.DataTexture(new Float32Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat, THREE.FloatType);
    this.pairForceFallback.needsUpdate = true;
    this.velMaterial.uniforms.uPairwiseForceTexture.value = this.pairForceFallback;
  }

  /**
   * Initializes position and velocity textures with seed data from target A
   */
  public seedInitialState(initialData: Float32Array) {
    this.seedGeneration++;
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
  public setTargetTextures(texA: THREE.DataTexture, texB: THREE.DataTexture, vortexCenter: THREE.Vector2, noise?: THREE.DataTexture) {
    this.velMaterial.uniforms.uTargetNoise.value = noise ?? null;
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

  /** Push formation partition geometry/state; physical forces use the separate emitter table. */
  public setEntityState(u: {
    count: number;
    bounds: Float32Array;
    centers: THREE.Vector4[];
    morph: Float32Array;
    transforms: THREE.Vector3[];
    depthScales?: Float32Array;
    normalized?: Float32Array;
  }) {
    const vU = this.velMaterial.uniforms;
    vU.uEntityCount.value = Math.min(10, u.count);
    (vU.uEntityBounds.value as Float32Array).set(u.bounds.subarray(0, 10));
    (vU.uEntityMorph.value as Float32Array).set(u.morph.subarray(0, 10));
    (vU.uEntityDepthScale.value as Float32Array).set(u.depthScales ?? new Float32Array(10).fill(1));
    (vU.uEntityNormalized.value as Float32Array).set(u.normalized ?? new Float32Array(10));
    const cU = vU.uEntityCenter.value as THREE.Vector4[];
    for (let i = 0; i < 10; i++) {
      cU[i].copy(u.centers[i]);
      vU.uEntityTransform.value[i].copy(u.transforms[i]);
    }
    (vU.uTexSize.value as THREE.Vector2).set(this.texWidth, this.texHeight);
  }

  public setForceEmitters(emitters: readonly ForceEmitterState[]) {
    const u=this.velMaterial.uniforms;
    const centers=u.uForceEmitterCenter.value as THREE.Vector4[];
    const params=u.uForceEmitterParams.value as THREE.Vector4[];
    const count=Math.min(18,emitters.length);u.uForceEmitterCount.value=count;
    for(let i=0;i<18;i++){const e=emitters[i];if(!e||!e.enabled){centers[i].set(-99999,-99999,0,1);params[i].set(0,0,0,0);continue;}
      centers[i].set(e.position.x,e.position.y,e.position.z,Math.max(5,e.radius));
      const mode=e.law==='vortex'?3:e.polarity==='repel'?2:1;params[i].set(e.strength,mode,e.spin,e.metric==='world3d'?1:0);
    }
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

  /** Running phases of the two conjugate morph oscillators plus the breathing oscillator (radians) */
  public setMorphPhases(toroidal: number, poloidal: number, breathPhase: number = poloidal) {
    this.velMaterial.uniforms.uTorPhase.value = toroidal;
    this.velMaterial.uniforms.uPolPhase.value = poloidal;
    this.velMaterial.uniforms.uBreathPhase.value = breathPhase;
  }

  /**
   * Advances simulation by dt seconds
   */
  /** Native disperse command; independent of editor pointer ownership. */
  public setBurst(position: THREE.Vector2, velocity: THREE.Vector2, radius: number, radial: number, spin: number) {
    this.velMaterial.uniforms.uBurstPosition.value.copy(position);
    this.velMaterial.uniforms.uBurstVelocity.value.copy(velocity);
    this.velMaterial.uniforms.uBurstRadius.value = radius;
    this.velMaterial.uniforms.uBurstRadial.value = radial;
    this.velMaterial.uniforms.uBurstSpin.value = spin;
  }

  /**
   * Sorted-grid neighbour search + DEM contact response.
   * cellId -> bitonic sort (schedule-driven ping-pong) -> cell ranges -> force.
   * The force pass runs in particle-index space, so no scatter-back pass is needed.
   */
  private runPairwisePasses(
    pw: { radius?: number; stiffness?: number; restitution?: number; viscosity?: number; extent?: number },
    compPlane: number,
    dt: number
  ): void {
    const side = sortSideForParticleTexSide(this.texWidth);
    if (side === null) return; // caller has already warned once
    const radius = Math.max(0.5, pw.radius ?? 14);
    const extent = Math.max(1, pw.extent ?? 1400);
    const grid = cellGridDims(extent, radius);

    if (!this.pairSortA || !this.pairSortB || this.pairSide !== side) {
      this.pairSortA?.dispose();
      this.pairSortB?.dispose();
      this.pairSortA = new THREE.WebGLRenderTarget(side, side, this.rtTemplate);
      this.pairSortB = new THREE.WebGLRenderTarget(side, side, this.rtTemplate);
      this.pairSide = side;
      this.pairSchedule = null;
    }
    if (!this.pairSchedule) this.pairSchedule = bitonicSchedule(side);
    if (!this.pairCellTable || this.pairCells.x !== grid.cellsX || this.pairCells.y !== grid.cellsY) {
      this.pairCellTable?.dispose();
      this.pairCellTable = new THREE.WebGLRenderTarget(grid.cellsX, grid.cellsY, this.rtTemplate);
      this.pairCells.set(grid.cellsX, grid.cellsY);
    }
    if (!this.pairForceTarget) {
      this.pairForceTarget = new THREE.WebGLRenderTarget(this.texWidth, this.texHeight, this.rtTemplate);
    }

    // 1. Cell keys
    const idU = this.pairCellIdMaterial.uniforms;
    idU.uPositionTexture.value = this.currentPosTarget.texture;
    idU.uTexSize.value.set(this.texWidth, this.texHeight);
    idU.uParticleCount.value = this.particleCount;
    idU.uExtent.value = extent;
    idU.uCellSize.value = grid.cellSize;
    idU.uCells.value.set(grid.cellsX, grid.cellsY);
    idU.uCompPlane.value = compPlane;
    let sorted = this.pairSortA;
    this.quadMesh.material = this.pairCellIdMaterial;
    this.renderer.setRenderTarget(sorted);
    this.renderer.render(this.quadScene, this.quadCamera);

    // 2. Bitonic sort network: one material, (stage, substage) uniforms per draw
    const sortU = this.pairSortMaterial.uniforms;
    sortU.uSide.value = side;
    sortU.uSlots.value = side * side;
    for (const pass of this.pairSchedule) {
      sortU.uSortTexture.value = sorted.texture;
      sortU.uPartner.value = pass.partner;
      sortU.uBlock.value = pass.block;
      const other = sorted === this.pairSortA ? this.pairSortB : this.pairSortA;
      this.quadMesh.material = this.pairSortMaterial;
      this.renderer.setRenderTarget(other);
      this.renderer.render(this.quadScene, this.quadCamera);
      sorted = other;
    }

    // 3. Per-cell (start, count) via binary search over the sorted keys
    const rangeU = this.pairRangeMaterial.uniforms;
    rangeU.uSortTexture.value = sorted.texture;
    rangeU.uSide.value = side;
    rangeU.uSlots.value = side * side;
    rangeU.uCells.value.set(grid.cellsX, grid.cellsY);
    this.quadMesh.material = this.pairRangeMaterial;
    this.renderer.setRenderTarget(this.pairCellTable);
    this.renderer.render(this.quadScene, this.quadCamera);

    // 4. Contact forces straight into particle-index space
    const forceU = this.pairForceMaterial.uniforms;
    forceU.uPositionTexture.value = this.currentPosTarget.texture;
    forceU.uVelocityTexture.value = this.currentVelTarget.texture;
    forceU.uSortTexture.value = sorted.texture;
    forceU.uCellTable.value = this.pairCellTable.texture;
    forceU.uTexSize.value.set(this.texWidth, this.texHeight);
    forceU.uCells.value.set(grid.cellsX, grid.cellsY);
    forceU.uSide.value = side;
    forceU.uExtent.value = extent;
    forceU.uCellSize.value = grid.cellSize;
    forceU.uRadius.value = radius;
    forceU.uStiffness.value = Math.max(0, pw.stiffness ?? 1);
    forceU.uRestitution.value = Math.max(0, Math.min(1, pw.restitution ?? 0.2));
    forceU.uPairViscosity.value = Math.max(0, Math.min(1, pw.viscosity ?? 0.3));
    forceU.uCompPlane.value = compPlane;
    forceU.uParticleCount.value = this.particleCount;
    forceU.uDelta.value = dt;
    this.quadMesh.material = this.pairForceMaterial;
    this.renderer.setRenderTarget(this.pairForceTarget);
    this.renderer.render(this.quadScene, this.quadCamera);

    this.velMaterial.uniforms.uPairwiseForceTexture.value = this.pairForceTarget.texture;
  }

  public step(
    dt: number,
    time: number,
    config: PointCloudConfig,
    morphProgress: number,
    pointerPos: THREE.Vector2,
    pointerVel: THREE.Vector2,
    pointerZ = 0
  ) {
    if (!(dt > 0)) return;
    this.stepCount++;
    const clampedDt = Math.min(dt, 0.033);

    // 0. Sorted-grid pairwise collision passes (entirely skipped while disabled)
    const pw = config.pairwise;
    const pwEnabled = !!(pw && pw.enabled) && this.particleCount <= PAIRWISE_MAX_PARTICLES;
    if (pw && pw.enabled && this.particleCount > PAIRWISE_MAX_PARTICLES && !this.pairWarned) {
      this.pairWarned = true;
      console.warn(
        `pairwise: ${this.particleCount} particles exceed the ${PAIRWISE_MAX_PARTICLES} sort capacity; the collision system stays disabled.`
      );
    }
    if (pwEnabled) {
      this.runPairwisePasses(pw!, this.velMaterial.uniforms.uCompPlane.value as number, clampedDt);
    }

    // 1. Update uniforms for velocity simulation
    const vUniforms = this.velMaterial.uniforms;
    vUniforms.uPairwiseEnabled.value = pwEnabled ? 1.0 : 0.0;
    vUniforms.uPairMaxDelta.value = Math.max(1.0, PAIRWISE_MAX_SPEED_FRACTION * (config.fluid.maxSpeed ?? 35000.0));
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
      vUniforms.uBreathDepth.value = tm.breathDepth ?? 0.35;
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
      vUniforms.uBreathDepth.value = 0.35;
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
    vUniforms.uPointerZ.value = pointerZ;
    vUniforms.uPointerVelocity.value.copy(pointerVel).multiplyScalar(config.interaction.velocityInfluence ?? 1.0);
    vUniforms.uPointerRadius.value = config.interaction.radius;
    vUniforms.uPointerStrength.value = config.interaction.strength;

    let modeVal = 0.0;
    if (config.interaction.mode === 'attract') modeVal = 1.0;
    else if (config.interaction.mode === 'vortex') modeVal = 2.0;
    vUniforms.uInteractionMode.value = modeVal;

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
    this.pairSortA?.dispose();
    this.pairSortB?.dispose();
    this.pairCellTable?.dispose();
    this.pairForceTarget?.dispose();
    this.pairForceFallback.dispose();
    this.pairCellIdMaterial.dispose();
    this.pairSortMaterial.dispose();
    this.pairRangeMaterial.dispose();
    this.pairForceMaterial.dispose();
  }
}
