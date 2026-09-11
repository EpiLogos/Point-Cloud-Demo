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

    // Calculate optimal square texture dimensions (e.g., 512x512 = 262,144 or 400x500 etc)
    const side = Math.ceil(Math.sqrt(particleCount));
    // Pick nearest power of 2 or clean dimension
    let texSide = 512;
    if (side <= 256) texSide = 256;
    else if (side <= 384) texSide = 384;
    else if (side <= 512) texSide = 512;
    else texSide = 640;

    this.texWidth = texSide;
    this.texHeight = texSide;
    this.particleCount = this.texWidth * this.texHeight;

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
        uChakraMode: { value: 0.0 },
        uChakraPlane: { value: 0.0 },
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

        // Dedicated Per-Chakra Multi-Vortex System
        uChakraMode: { value: 0.0 },
        uChakraNodeCount: { value: 7 },
        uChakraCenters: {
          value: [
            new THREE.Vector4(0, 0, 0, 1.0),
            new THREE.Vector4(0, 0, 0, 1.0),
            new THREE.Vector4(0, 0, 0, 1.0),
            new THREE.Vector4(0, 0, 0, 1.0),
            new THREE.Vector4(0, 0, 0, 1.0),
            new THREE.Vector4(0, 0, 0, 1.0),
            new THREE.Vector4(0, 0, 0, 1.0),
            new THREE.Vector4(0, 0, 0, 1.0),
            new THREE.Vector4(0, 0, 0, 1.0),
            new THREE.Vector4(0, 0, 0, 1.0),
          ],
        },
        uChakraSpins: { value: [1.0, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0, -1.0, 1.0, -1.0] },
        uChakraPlane: { value: 0.0 },
        uChakraVortexStrength: { value: 1.5 },

        // Dedicated Cymatic Chladni Acoustic Resonance System
        uCymaticsEnabled: { value: 0.0 },
        uCymaticsLock: { value: 1.0 },
        uCymaticsChaos: { value: 1.4 },
        uCymaticsNodalPull: { value: 2.8 },
        uCymaticsParams: { value: new THREE.Vector4(2, 2, 396, 0) },

        // Pointer
        uPointerPos: { value: new THREE.Vector2(-99999, -99999) },
        uPointerVelocity: { value: new THREE.Vector2(0, 0) },
        uPointerRadius: { value: 150.0 },
        uPointerStrength: { value: 1.0 },
        uInteractionMode: { value: 0.0 },
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

  /**
   * Updates per-chakra multi-vortex centers, spins, planar orientation, and intensity
   */
  public setChakraVortexParams(
    mode: number,
    nodeCount: number,
    centers: THREE.Vector4[],
    spins: number[],
    plane: number,
    vortexStrength: number
  ) {
    const vU = this.velMaterial.uniforms;
    vU.uChakraMode.value = mode;
    vU.uChakraNodeCount.value = nodeCount;
    const cU = vU.uChakraCenters.value as THREE.Vector4[];
    for (let i = 0; i < Math.min(centers.length, cU.length); i++) {
      cU[i].copy(centers[i]);
    }
    const sU = vU.uChakraSpins.value as number[];
    for (let i = 0; i < Math.min(spins.length, sU.length); i++) {
      sU[i] = spins[i];
    }
    vU.uChakraPlane.value = plane;
    vU.uChakraVortexStrength.value = vortexStrength;

    const pU = this.posMaterial.uniforms;
    pU.uChakraMode.value = mode;
    pU.uChakraPlane.value = plane;
  }

  public setCymaticsParams(
    enabled: boolean,
    lock: number,
    chaos: number,
    nodalPull: number,
    m: number,
    n: number,
    freq: number,
    plateType: number
  ) {
    this.velMaterial.uniforms.uCymaticsEnabled.value = enabled ? 1.0 : 0.0;
    this.velMaterial.uniforms.uCymaticsLock.value = lock;
    this.velMaterial.uniforms.uCymaticsChaos.value = chaos;
    this.velMaterial.uniforms.uCymaticsNodalPull.value = nodalPull;
    this.velMaterial.uniforms.uCymaticsParams.value.set(m, n, freq, plateType);
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

    // Relational system uniforms
    const rel = config.relational;
    vUniforms.uRelationalEnabled.value = rel?.enabled ? 1.0 : 0.0;
    vUniforms.uAttractorCount.value = Math.max(1, Math.min(10, rel?.attractorCount ?? 2));
    vUniforms.uRelationalGravity.value = rel?.attractorGravity ?? 1.5;
    vUniforms.uRelationalSpin.value = rel?.relationalSpin ?? 1.2;
    vUniforms.uChaosFactor.value = rel?.chaosFactor ?? 0.0;

    vUniforms.uPointerPos.value.copy(pointerPos);
    vUniforms.uPointerVelocity.value.copy(pointerVel);
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
