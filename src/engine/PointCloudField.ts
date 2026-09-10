/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { PointCloudConfig, PointCloudFluidConfig, PointCloudInteractionConfig } from './types';
import { GPGPUSimulator } from './GPGPUSimulator';
import { GlyphSampler, BakeResult } from './GlyphSampler';
import { particleVertexShader, particleFragmentShader } from './shaders/particleShaders';

export const DEFAULT_CONFIG: PointCloudConfig = {
  glyph: ['O', 'I'],
  particleCount: 200000,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontWeight: 900,
  colorMode: 'blackOnWhite',
  style: 'stipple',
  dotShape: 'circle',
  particleSize: { min: 1.5, max: 3.5 },
  fluid: {
    curlScale: 1.2,
    curlSpeed: 0.6,
    vortexStrength: 1.4,
    viscosity: 0.94,
    returnSpeed: 1.1,
    turbulence: 1.0,
    dispersion: 0.65,
  },
  interaction: {
    radius: 180,
    strength: 1.2,
    mode: 'repel',
  },
  relational: {
    enabled: false,
    mode: 'orbital',
    attractorCount: 3,
    attractorGravity: 1.6,
    orbitSpeed: 0.8,
    orbitRadius: 240,
    relationalSpin: 1.4,
    chaosFactor: 0.2,
    wanderSpeed: 0.5,
  },
  morphProgress: 0.0,
  autoMorph: true,
  autoMorphDuration: 4.0,
  positioning: 'absolute',
};

export class PointCloudField {
  public canvas: HTMLCanvasElement;
  public config: PointCloudConfig;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private simulator!: GPGPUSimulator;
  private glyphSampler!: GlyphSampler;

  private particleGeometry!: THREE.BufferGeometry;
  private particleMaterial!: THREE.ShaderMaterial;
  private particlePoints!: THREE.Points;

  private bakedTargets!: BakeResult;

  // Animation & Clock
  private clock: THREE.Clock;
  private animFrameId: number | null = null;
  private isDestroyed: boolean = false;

  // Morph state
  private morphProgress: number = 0.0;
  private morphDirection: number = 1.0;

  // Pointer state
  private pointerPos: THREE.Vector2 = new THREE.Vector2(-99999, -99999);
  private pointerVel: THREE.Vector2 = new THREE.Vector2(0, 0);
  private lastPointerPos: THREE.Vector2 = new THREE.Vector2(-99999, -99999);
  private lastPointerTime: number = 0;

  // Bound listeners
  private onPointerMoveBound: (e: PointerEvent) => void;
  private onPointerLeaveBound: () => void;
  private onResizeBound: () => void;

  constructor(canvas: HTMLCanvasElement, options: Partial<PointCloudConfig> = {}) {
    this.canvas = canvas;
    this.config = this.mergeConfig(DEFAULT_CONFIG, options);
    this.morphProgress = this.config.morphProgress ?? 0.0;

    this.clock = new THREE.Clock();

    // 1. Initialize WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
    });

    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    this.renderer.setPixelRatio(dpr);

    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height, false);

    // 2. Initialize Scene and 1:1 Orthographic Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0.1,
      1000
    );
    this.camera.position.z = 100;

    // 3. Initialize GPGPU Simulation Engine
    this.simulator = new GPGPUSimulator(this.renderer, this.config.particleCount);

    // 4. Initialize Glyph Sampler and Bake Initial Targets
    this.glyphSampler = new GlyphSampler();
    this.bakeAndSeedGlyphs();

    // 5. Initialize Particle Render Pipeline
    this.initParticlePipeline(width, height, dpr);

    // 6. Bind Event Listeners
    this.onPointerMoveBound = this.handlePointerMove.bind(this);
    this.onPointerLeaveBound = this.handlePointerLeave.bind(this);
    this.onResizeBound = this.handleResize.bind(this);

    window.addEventListener('pointermove', this.onPointerMoveBound, { passive: true });
    window.addEventListener('pointerleave', this.onPointerLeaveBound, { passive: true });
    window.addEventListener('resize', this.onResizeBound, { passive: true });

    // 7. Start Simulation & Render Loop
    this.clock.start();
    this.tick();
  }

  private mergeConfig(base: PointCloudConfig, override: Partial<PointCloudConfig>): PointCloudConfig {
    return {
      ...base,
      ...override,
      particleSize: { ...base.particleSize, ...override.particleSize },
      fluid: { ...base.fluid, ...override.fluid },
      interaction: { ...base.interaction, ...override.interaction },
      relational: { ...base.relational, ...override.relational },
    };
  }

  private bakeAndSeedGlyphs() {
    this.bakedTargets = this.glyphSampler.bakeTargets(
      this.config.glyph,
      this.simulator.particleCount,
      this.simulator.texWidth,
      this.simulator.texHeight,
      this.config.style,
      this.config.fontFamily,
      this.config.fontWeight
    );

    this.simulator.setTargetTextures(
      this.bakedTargets.textureA,
      this.bakedTargets.textureB,
      this.bakedTargets.vortexCenter
    );

    // Seed initial position state from Target A
    const initialData = (this.bakedTargets.textureA.image as { data: Float32Array }).data;
    this.simulator.seedInitialState(initialData);
  }

  private initParticlePipeline(width: number, height: number, dpr: number) {
    const totalCount = this.simulator.particleCount;
    const texW = this.simulator.texWidth;
    const texH = this.simulator.texHeight;

    const uvs = new Float32Array(totalCount * 2);
    for (let i = 0; i < totalCount; i++) {
      const x = i % texW;
      const y = Math.floor(i / texW);
      uvs[i * 2 + 0] = (x + 0.5) / texW;
      uvs[i * 2 + 1] = (y + 0.5) / texH;
    }

    this.particleGeometry = new THREE.BufferGeometry();
    // Use dummy positions for attribute; vertex shader reads actual coords from simulation texture
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(totalCount * 3), 3));
    this.particleGeometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    const isLightMode = this.config.colorMode === 'blackOnWhite';
    const particleColor = isLightMode ? new THREE.Color(0x0a0a0a) : new THREE.Color(0xf5f5f5);

    this.particleMaterial = new THREE.ShaderMaterial({
      vertexShader: particleVertexShader,
      fragmentShader: particleFragmentShader,
      uniforms: {
        uPositionTexture: { value: this.simulator.currentPosTarget.texture },
        uVelocityTexture: { value: this.simulator.currentVelTarget.texture },
        uMinParticleSize: { value: this.config.particleSize.min },
        uMaxParticleSize: { value: this.config.particleSize.max },
        uStyleMode: { value: this.config.style === 'halftone' ? 1.0 : 0.0 },
        uDotShape: { value: this.config.dotShape === 'square' ? 1.0 : 0.0 },
        uParticleColor: { value: particleColor },
        uColorMode: { value: isLightMode ? 0.0 : 1.0 },
        uContrast: { value: 1.0 },
        uPixelRatio: { value: dpr },
        uCanvasSize: { value: new THREE.Vector2(width, height) },
        uTime: { value: 0.0 },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.particlePoints = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.particlePoints.frustumCulled = false;
    this.scene.add(this.particlePoints);
  }

  private handlePointerMove(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to centered coordinates (0,0 at center, matching orthographic camera)
    const worldX = x - rect.width / 2;
    const worldY = -(y - rect.height / 2);

    const now = performance.now();
    const dt = Math.max(0.001, (now - this.lastPointerTime) / 1000);

    if (this.lastPointerPos.x > -90000) {
      const vx = (worldX - this.lastPointerPos.x) / dt;
      const vy = (worldY - this.lastPointerPos.y) / dt;
      // Exponential velocity smoothing
      this.pointerVel.x = this.pointerVel.x * 0.4 + vx * 0.6;
      this.pointerVel.y = this.pointerVel.y * 0.4 + vy * 0.6;
    }

    this.pointerPos.set(worldX, worldY);
    this.lastPointerPos.set(worldX, worldY);
    this.lastPointerTime = now;
  }

  private handlePointerLeave() {
    this.pointerPos.set(-99999, -99999);
    this.pointerVel.set(0, 0);
    this.lastPointerPos.set(-99999, -99999);
  }

  public resize() {
    this.handleResize();
  }

  private handleResize() {
    if (!this.canvas || this.isDestroyed) return;
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);

    this.camera.left = -width / 2;
    this.camera.right = width / 2;
    this.camera.top = height / 2;
    this.camera.bottom = -height / 2;
    this.camera.updateProjectionMatrix();

    if (this.particleMaterial) {
      this.particleMaterial.uniforms.uPixelRatio.value = dpr;
      this.particleMaterial.uniforms.uCanvasSize.value.set(width, height);
    }
  }

  public updateConfig(newConfig: Partial<PointCloudConfig>) {
    const prevGlyph = JSON.stringify(this.config.glyph);
    const prevStyle = this.config.style;
    const prevFont = this.config.fontFamily;

    this.config = this.mergeConfig(this.config, newConfig);

    const nextGlyph = JSON.stringify(this.config.glyph);

    // If glyph or style changed, re-bake target textures
    if (prevGlyph !== nextGlyph || prevStyle !== this.config.style || prevFont !== this.config.fontFamily) {
      this.bakedTargets.textureA.dispose();
      this.bakedTargets.textureB.dispose();
      this.bakeAndSeedGlyphs();
    }

    // Update material uniforms
    if (this.particleMaterial) {
      const isLightMode = this.config.colorMode === 'blackOnWhite';
      const particleColor = isLightMode ? new THREE.Color(0x0a0a0a) : new THREE.Color(0xf5f5f5);

      this.particleMaterial.uniforms.uParticleColor.value.copy(particleColor);
      this.particleMaterial.uniforms.uColorMode.value = isLightMode ? 0.0 : 1.0;
      this.particleMaterial.uniforms.uMinParticleSize.value = this.config.particleSize.min;
      this.particleMaterial.uniforms.uMaxParticleSize.value = this.config.particleSize.max;
      this.particleMaterial.uniforms.uStyleMode.value = this.config.style === 'halftone' ? 1.0 : 0.0;
      this.particleMaterial.uniforms.uDotShape.value = this.config.dotShape === 'square' ? 1.0 : 0.0;
    }
  }

  public setMorphProgress(progress: number) {
    this.morphProgress = Math.max(0.0, Math.min(1.0, progress));
  }

  public getMorphProgress(): number {
    return this.morphProgress;
  }

  public triggerDisperse(strength: number = 3.0) {
    // Injects instantaneous vorticity and radial turbulence into pointer position or center
    this.pointerVel.set(
      (Math.random() - 0.5) * 600 * strength,
      (Math.random() - 0.5) * 600 * strength
    );
  }

  private tick = () => {
    if (this.isDestroyed) return;

    this.animFrameId = requestAnimationFrame(this.tick);

    const delta = Math.min(this.clock.getDelta(), 0.05);
    const elapsedTime = this.clock.getElapsedTime();

    // Auto-morph oscillation between glyph A & B (e.g. O and I)
    if (this.config.autoMorph) {
      const cycleDuration = this.config.autoMorphDuration || 4.0;
      const step = (delta / cycleDuration) * this.morphDirection;
      this.morphProgress += step;

      if (this.morphProgress >= 1.0) {
        this.morphProgress = 1.0;
        this.morphDirection = -1.0;
      } else if (this.morphProgress <= 0.0) {
        this.morphProgress = 0.0;
        this.morphDirection = 1.0;
      }
    }

    // Decay pointer velocity over time
    this.pointerVel.multiplyScalar(0.92);

    // Update dynamic relational multi-attractors
    if (this.config.relational?.enabled && this.bakedTargets?.attractorCenters) {
      const rel = this.config.relational;
      const count = Math.max(1, Math.min(6, rel.attractorCount || 3));
      const baseCenters = this.bakedTargets.attractorCenters;
      const vCenter = this.bakedTargets.vortexCenter || new THREE.Vector2(0, 0);

      const dynamicAttractors: THREE.Vector4[] = [];
      const dynamicSpins: number[] = [];

      for (let i = 0; i < 6; i++) {
        if (i < count) {
          const basePt = baseCenters[i % baseCenters.length] || new THREE.Vector2(0, 0);
          const initialAngle = (i / count) * Math.PI * 2;
          const currentAngle = initialAngle + elapsedTime * (rel.orbitSpeed || 0.8);
          const radius = rel.orbitRadius || 240;

          let posX = 0;
          let posY = 0;

          if (rel.mode === 'chaos') {
            // Non-linear harmonic wandering attractor
            const wx = Math.sin(elapsedTime * (rel.wanderSpeed || 0.5) * 1.4 + i * 2.1) * radius * 0.7;
            const wy = Math.cos(elapsedTime * (rel.wanderSpeed || 0.5) * 1.1 + i * 1.7) * radius * 0.5;
            posX = basePt.x + wx;
            posY = basePt.y + wy;
          } else if (rel.mode === 'nbody') {
            // Mutual figure-8 / Keplerian lemniscate orbit
            const t = elapsedTime * (rel.orbitSpeed || 0.8) + i * ((Math.PI * 2) / count);
            const denom = 1 + Math.cos(t) * Math.cos(t);
            posX = vCenter.x + (Math.sin(t) / denom) * radius * 1.4;
            posY = vCenter.y + ((Math.sin(t) * Math.cos(t)) / denom) * radius * 1.4;
          } else {
            // Standard orbital gravity around center
            const rx = Math.cos(currentAngle) * radius;
            const ry = Math.sin(currentAngle) * radius * 0.75;
            const driftX = Math.sin(elapsedTime * (rel.wanderSpeed || 0.5) + i) * 35;
            const driftY = Math.cos(elapsedTime * (rel.wanderSpeed || 0.5) + i) * 35;
            posX = vCenter.x + rx + driftX;
            posY = vCenter.y + ry + driftY;
          }

          // Individual spin sign alternation
          const spin = (i % 2 === 0 ? 1.0 : -1.0) * (1.0 + i * 0.2);
          dynamicAttractors.push(new THREE.Vector4(posX, posY, 0, 1.0));
          dynamicSpins.push(spin);
        } else {
          dynamicAttractors.push(new THREE.Vector4(-99999, -99999, 0, 0));
          dynamicSpins.push(0);
        }
      }

      this.simulator.setAttractors(dynamicAttractors, dynamicSpins);
    }

    // Run GPGPU fluid dynamic simulation step
    this.simulator.step(
      delta,
      elapsedTime,
      this.config,
      this.morphProgress,
      this.pointerPos,
      this.pointerVel
    );

    // Bind updated simulation textures to particle render material
    this.particleMaterial.uniforms.uPositionTexture.value = this.simulator.currentPosTarget.texture;
    this.particleMaterial.uniforms.uVelocityTexture.value = this.simulator.currentVelTarget.texture;
    this.particleMaterial.uniforms.uTime.value = elapsedTime;

    // Render final scene
    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    this.isDestroyed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('pointerleave', this.onPointerLeaveBound);
    window.removeEventListener('resize', this.onResizeBound);

    if (this.bakedTargets) {
      this.bakedTargets.textureA.dispose();
      this.bakedTargets.textureB.dispose();
    }

    if (this.simulator) {
      this.simulator.destroy();
    }

    if (this.glyphSampler) {
      this.glyphSampler.destroy();
    }

    if (this.particleGeometry) {
      this.particleGeometry.dispose();
    }

    if (this.particleMaterial) {
      this.particleMaterial.dispose();
    }

    this.renderer.dispose();
  }
}
