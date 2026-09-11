/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import {
  PointCloudConfig,
  PointCloudFluidConfig,
  PointCloudInteractionConfig,
  PointCloudRelationalConfig,
  PointCloudChainingConfig,
  PointCloudColorConfig,
  ColorDistributionMode,
  ChainTimelineState,
  ChainTraversalMode,
  ChainEasing,
} from './types';
import { GPGPUSimulator } from './GPGPUSimulator';
import { GlyphSampler, BakeResult } from './GlyphSampler';
import { particleVertexShader, particleFragmentShader } from './shaders/particleShaders';
import { isLightHex } from './colorPalettes';

export function getColorModeIndex(mode?: string): number {
  switch (mode) {
    case 'monochrome': return 0;
    case 'linearGradient': return 1;
    case 'radialGradient': return 2;
    case 'angularSweep': return 3;
    case 'velocityThermal': return 4;
    case 'densityDepth': return 5;
    case 'waveInterference': return 6;
    case 'rainbowSpectral': return 7;
    default: return 1;
  }
}

export const DEFAULT_COLOR_CONFIG: PointCloudColorConfig = {
  enabled: false,
  mode: 'linearGradient',
  primaryColor: '#00f0ff',
  secondaryColor: '#ff007f',
  accentColor: '#ffe600',
  cycleSpeed: 1.2,
  waveFrequency: 1.8,
  angle: 45,
  fieldCenterOffset: [0, 0],
  turbulenceModulation: 0.35,
  speedReactiveIntensity: 0.6,
  densityWeight: 0.5,
  hueShiftSpeed: 0.0,
  contrast: 1.0,
  paletteId: 'cyberpunk_neon',
  backgroundColor: '#09090b',
  backgroundMode: 'ambientGlow',
  backgroundGlowIntensity: 0.45,
};

export const DEFAULT_CONFIG: PointCloudConfig = {
  glyph: ['O', 'I'],
  particleCount: 200000,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontWeight: 900,
  colorMode: 'blackOnWhite',
  backgroundColor: '#09090b',
  backgroundMode: 'ambientGlow',
  backgroundGlowIntensity: 0.45,
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
  chaining: {
    enabled: false,
    chain: ['▲', '■', '⬟', '⬢', '⯎', '◉'],
    mode: 'loop',
    stepHoldDuration: 1.0,
    transitionDuration: 2.2,
    easing: 'smoothstep',
    timingJitter: 0.15,
    disperseImpulse: 0.8,
    paused: false,
  },
  color: DEFAULT_COLOR_CONFIG,
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

  // Chaining State Machine
  private chainIndex: number = 0;
  private nextChainIndex: number = 1;
  private chainDirection: 1 | -1 = 1;
  private chainPhase: 'hold' | 'transition' = 'hold';
  private chainPhaseTimer: number = 0;
  private currentStepHoldTime: number = 1.0;
  private currentTransitionTime: number = 2.2;
  private chainShuffleOrder: number[] = [];
  private onChainUpdateCallback: ((state: ChainTimelineState) => void) | null = null;

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
    if (this.config.chaining?.enabled && this.config.chaining.chain.length > 0) {
      this.initChainingState();
    } else {
      this.bakeAndSeedGlyphs();
    }

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
      chaining: {
        ...(base.chaining || DEFAULT_CONFIG.chaining!),
        ...(override.chaining || {}),
        chain: override.chaining?.chain
          ? [...override.chaining.chain]
          : (base.chaining?.chain ? [...base.chaining.chain] : ['▲', '■', '⬟', '⬢', '⯎', '◉']),
      },
      color: {
        ...(base.color || DEFAULT_COLOR_CONFIG),
        ...(override.color || {}),
        fieldCenterOffset: override.color?.fieldCenterOffset
          ? [...override.color.fieldCenterOffset]
          : (base.color?.fieldCenterOffset ? [...base.color.fieldCenterOffset] : [0, 0]),
      },
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

    const effectiveBg = this.config.backgroundColor || this.config.color?.backgroundColor;
    const isLightMode = effectiveBg ? isLightHex(effectiveBg) : (this.config.colorMode === 'blackOnWhite');
    const particleColor = isLightMode ? new THREE.Color(0x0a0a0a) : new THREE.Color(0xf5f5f5);

    const col = this.config.color || DEFAULT_COLOR_CONFIG;
    const primaryCol = new THREE.Color(col.primaryColor || '#00f0ff');
    const secondaryCol = new THREE.Color(col.secondaryColor || '#ff007f');
    const accentCol = new THREE.Color(col.accentColor || '#ffe600');
    const colorAngleRad = ((col.angle ?? 45) * Math.PI) / 180;
    const colorCenter = new THREE.Vector2(
      (col.fieldCenterOffset?.[0] ?? 0) * 300,
      (col.fieldCenterOffset?.[1] ?? 0) * 300
    );

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

        // Procedural Color Field Uniforms
        uColorEnabled: { value: col.enabled ? 1.0 : 0.0 },
        uColorDistMode: { value: getColorModeIndex(col.mode) },
        uPrimaryColor: { value: primaryCol },
        uSecondaryColor: { value: secondaryCol },
        uAccentColor: { value: accentCol },
        uColorCycleSpeed: { value: col.cycleSpeed ?? 1.2 },
        uColorWaveFrequency: { value: col.waveFrequency ?? 1.8 },
        uColorAngle: { value: colorAngleRad },
        uColorCenter: { value: colorCenter },
        uColorTurbulence: { value: col.turbulenceModulation ?? 0.35 },
        uColorSpeedReactive: { value: col.speedReactiveIntensity ?? 0.6 },
        uColorDensityWeight: { value: col.densityWeight ?? 0.5 },
        uColorHueShift: { value: 0.0 },
        uColorContrast: { value: col.contrast ?? 1.0 },
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
    const prevChainingEnabled = !!this.config.chaining?.enabled;
    const prevChain = JSON.stringify(this.config.chaining?.chain);
    const prevGlyph = JSON.stringify(this.config.glyph);
    const prevStyle = this.config.style;
    const prevFont = this.config.fontFamily;

    this.config = this.mergeConfig(this.config, newConfig);

    const nextChainingEnabled = !!this.config.chaining?.enabled;
    const nextChain = JSON.stringify(this.config.chaining?.chain);
    const nextGlyph = JSON.stringify(this.config.glyph);

    if (prevStyle !== this.config.style || prevFont !== this.config.fontFamily) {
      this.glyphSampler.clearCache();
    }

    if (nextChainingEnabled) {
      if (
        !prevChainingEnabled ||
        prevChain !== nextChain ||
        prevStyle !== this.config.style ||
        prevFont !== this.config.fontFamily
      ) {
        this.initChainingState();
      }
    } else {
      // If returning to non-chaining mode or glyph/style changed, re-bake target textures
      if (
        prevChainingEnabled ||
        prevGlyph !== nextGlyph ||
        prevStyle !== this.config.style ||
        prevFont !== this.config.fontFamily
      ) {
        if (this.bakedTargets) {
          this.bakedTargets.textureA.dispose();
          this.bakedTargets.textureB.dispose();
        }
        this.bakeAndSeedGlyphs();
      }
    }

    // Update material uniforms
    if (this.particleMaterial) {
      const effectiveBg = this.config.backgroundColor || this.config.color?.backgroundColor;
      const isLightMode = effectiveBg ? isLightHex(effectiveBg) : (this.config.colorMode === 'blackOnWhite');
      const particleColor = isLightMode ? new THREE.Color(0x0a0a0a) : new THREE.Color(0xf5f5f5);

      this.particleMaterial.uniforms.uParticleColor.value.copy(particleColor);
      this.particleMaterial.uniforms.uColorMode.value = isLightMode ? 0.0 : 1.0;
      this.particleMaterial.uniforms.uMinParticleSize.value = this.config.particleSize.min;
      this.particleMaterial.uniforms.uMaxParticleSize.value = this.config.particleSize.max;
      this.particleMaterial.uniforms.uStyleMode.value = this.config.style === 'halftone' ? 1.0 : 0.0;
      this.particleMaterial.uniforms.uDotShape.value = this.config.dotShape === 'square' ? 1.0 : 0.0;

      const col = this.config.color || DEFAULT_COLOR_CONFIG;
      this.particleMaterial.uniforms.uColorEnabled.value = col.enabled ? 1.0 : 0.0;
      this.particleMaterial.uniforms.uColorDistMode.value = getColorModeIndex(col.mode);
      this.particleMaterial.uniforms.uPrimaryColor.value.set(col.primaryColor || '#00f0ff');
      this.particleMaterial.uniforms.uSecondaryColor.value.set(col.secondaryColor || '#ff007f');
      this.particleMaterial.uniforms.uAccentColor.value.set(col.accentColor || '#ffe600');
      this.particleMaterial.uniforms.uColorCycleSpeed.value = col.cycleSpeed ?? 1.2;
      this.particleMaterial.uniforms.uColorWaveFrequency.value = col.waveFrequency ?? 1.8;
      this.particleMaterial.uniforms.uColorAngle.value = ((col.angle ?? 45) * Math.PI) / 180;
      this.particleMaterial.uniforms.uColorCenter.value.set(
        (col.fieldCenterOffset?.[0] ?? 0) * 300,
        (col.fieldCenterOffset?.[1] ?? 0) * 300
      );
      this.particleMaterial.uniforms.uColorTurbulence.value = col.turbulenceModulation ?? 0.35;
      this.particleMaterial.uniforms.uColorSpeedReactive.value = col.speedReactiveIntensity ?? 0.6;
      this.particleMaterial.uniforms.uColorDensityWeight.value = col.densityWeight ?? 0.5;
      this.particleMaterial.uniforms.uColorContrast.value = col.contrast ?? 1.0;
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

    // 1. Chaining sequence timeline takes priority if enabled
    if (this.config.chaining?.enabled && this.config.chaining.chain.length > 0) {
      this.tickChaining(delta);
    } else if (this.config.autoMorph) {
      // Classic 1:1 auto-morph oscillation between glyph A & B (e.g. O and I)
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

    // Temporal Hue Shift animation if configured
    const col = this.config.color;
    if (col && col.enabled && col.hueShiftSpeed && Math.abs(col.hueShiftSpeed) > 0.001) {
      this.particleMaterial.uniforms.uColorHueShift.value = (elapsedTime * col.hueShiftSpeed * 0.1) % 1.0;
    } else if (this.particleMaterial.uniforms.uColorHueShift.value !== 0.0) {
      this.particleMaterial.uniforms.uColorHueShift.value = 0.0;
    }

    // Render final scene
    this.renderer.render(this.scene, this.camera);
  };

  // --- Chaining Mode Engine Methods ---

  public initChainingState() {
    const ch = this.config.chaining;
    if (!ch || !ch.chain || ch.chain.length === 0) return;
    this.chainIndex = 0;
    this.nextChainIndex = ch.chain.length > 1 ? 1 : 0;
    this.chainPhase = 'hold';
    this.chainPhaseTimer = 0;
    this.morphProgress = 0.0;
    this.currentStepHoldTime = Math.max(0.05, ch.stepHoldDuration ?? 1.0);
    this.currentTransitionTime = Math.max(0.1, ch.transitionDuration ?? 2.2);

    this.loadChainTargets(this.chainIndex, this.nextChainIndex);
    if (this.bakedTargets?.textureA) {
      const initialData = (this.bakedTargets.textureA.image as { data: Float32Array }).data;
      this.simulator.seedInitialState(initialData);
    }
    this.emitChainTimelineUpdate();
  }

  private tickChaining(delta: number) {
    const ch = this.config.chaining;
    if (!ch || !ch.chain || ch.chain.length === 0) return;

    if (ch.chain.length === 1) {
      this.morphProgress = 0.0;
      this.emitChainTimelineUpdate();
      return;
    }

    if (ch.paused) {
      this.emitChainTimelineUpdate();
      return;
    }

    if (this.chainPhase === 'hold') {
      this.morphProgress = 0.0;
      this.chainPhaseTimer += delta;

      if (this.chainPhaseTimer >= this.currentStepHoldTime) {
        // Hold duration complete, start morph transition to next link
        this.chainPhase = 'transition';
        this.chainPhaseTimer = 0;

        const jitter = ch.timingJitter || 0.0;
        const factor = 1.0 + (Math.random() - 0.5) * 2 * Math.min(1.0, jitter);
        this.currentTransitionTime = Math.max(0.1, (ch.transitionDuration || 2.2) * factor);

        if (ch.disperseImpulse && ch.disperseImpulse > 0) {
          this.triggerDisperse(ch.disperseImpulse);
        }
      }
    } else {
      // Transition phase
      this.chainPhaseTimer += delta;
      const u = Math.min(1.0, Math.max(0.0, this.chainPhaseTimer / Math.max(0.05, this.currentTransitionTime)));

      let t = u;
      const easing = ch.easing || 'smoothstep';
      if (easing === 'smoothstep') {
        t = u * u * (3.0 - 2.0 * u);
      } else if (easing === 'kineticSnap') {
        t = Math.pow(u, 0.42) * (1.0 - Math.exp(-6.0 * u)) / (1.0 - Math.exp(-6.0));
      } else if (easing === 'whip') {
        t = u < 0.5 ? 4.0 * u * u * u : 1.0 - Math.pow(-2.0 * u + 2.0, 3.0) / 2.0;
      }
      this.morphProgress = Math.min(1.0, Math.max(0.0, t));

      if (this.chainPhaseTimer >= this.currentTransitionTime) {
        this.advanceChain();
      }
    }

    this.emitChainTimelineUpdate();
  }

  private advanceChain() {
    const ch = this.config.chaining;
    if (!ch || !ch.chain || ch.chain.length < 2) return;

    this.chainIndex = this.nextChainIndex;
    this.nextChainIndex = this.calcNextChainIndex(ch.mode, this.chainIndex, ch.chain.length);

    this.chainPhase = 'hold';
    this.chainPhaseTimer = 0;
    this.morphProgress = 0.0;

    const jitter = ch.timingJitter || 0.0;
    const factor = 1.0 + (Math.random() - 0.5) * 2 * Math.min(1.0, jitter);
    this.currentStepHoldTime = Math.max(0.05, (ch.stepHoldDuration || 1.0) * factor);

    this.loadChainTargets(this.chainIndex, this.nextChainIndex);
  }

  private calcNextChainIndex(mode: ChainTraversalMode, current: number, length: number): number {
    if (length <= 1) return 0;

    if (mode === 'loop') {
      return (current + 1) % length;
    }

    if (mode === 'pingpong') {
      if (current >= length - 1) {
        this.chainDirection = -1;
      } else if (current <= 0) {
        this.chainDirection = 1;
      }
      return Math.max(0, Math.min(length - 1, current + this.chainDirection));
    }

    if (mode === 'randomWalk') {
      const step = Math.random() < 0.5 ? -1 : 1;
      return (current + step + length) % length;
    }

    if (mode === 'chaos') {
      let rand = Math.floor(Math.random() * (length - 1));
      if (rand >= current) rand++;
      return rand % length;
    }

    if (mode === 'shuffle') {
      if (this.chainShuffleOrder.length !== length) {
        this.chainShuffleOrder = Array.from({ length }, (_, i) => i).sort(() => Math.random() - 0.5);
      }
      const curPos = this.chainShuffleOrder.indexOf(current);
      if (curPos === -1 || curPos >= length - 1) {
        this.chainShuffleOrder = Array.from({ length }, (_, i) => i).sort(() => Math.random() - 0.5);
        return this.chainShuffleOrder[0] === current && length > 1
          ? this.chainShuffleOrder[1]
          : this.chainShuffleOrder[0];
      }
      return this.chainShuffleOrder[curPos + 1];
    }

    return (current + 1) % length;
  }

  private loadChainTargets(indexA: number, indexB: number) {
    const ch = this.config.chaining;
    const chain = ch?.chain && ch.chain.length > 0 ? ch.chain : ['O', 'I'];
    const textA = chain[((indexA % chain.length) + chain.length) % chain.length] || 'O';
    const textB = chain[((indexB % chain.length) + chain.length) % chain.length] || 'I';

    const oldA = this.bakedTargets?.textureA;
    const oldB = this.bakedTargets?.textureB;

    this.bakedTargets = this.glyphSampler.bakeTargets(
      [textA, textB],
      this.simulator.particleCount,
      this.simulator.texWidth,
      this.simulator.texHeight,
      this.config.style,
      this.config.fontFamily,
      this.config.fontWeight
    );

    if (oldA) oldA.dispose();
    if (oldB) oldB.dispose();

    this.simulator.setTargetTextures(
      this.bakedTargets.textureA,
      this.bakedTargets.textureB,
      this.bakedTargets.vortexCenter
    );
  }

  public jumpToChainLink(index: number) {
    const ch = this.config.chaining;
    if (!ch || !ch.chain || ch.chain.length === 0) return;
    const len = ch.chain.length;
    this.chainIndex = ((index % len) + len) % len;
    this.nextChainIndex = this.calcNextChainIndex(ch.mode, this.chainIndex, len);
    this.chainPhase = 'hold';
    this.chainPhaseTimer = 0;
    this.morphProgress = 0.0;
    this.currentStepHoldTime = Math.max(0.05, ch.stepHoldDuration || 1.0);
    this.loadChainTargets(this.chainIndex, this.nextChainIndex);
    this.emitChainTimelineUpdate();
  }

  public stepChain(direction: 1 | -1) {
    const ch = this.config.chaining;
    if (!ch || !ch.chain || ch.chain.length === 0) return;
    const len = ch.chain.length;
    const target = (this.chainIndex + direction + len) % len;
    this.jumpToChainLink(target);
  }

  public setChainPaused(paused: boolean) {
    if (this.config.chaining) {
      this.config.chaining.paused = paused;
    }
  }

  public scrubChainProgress(progress: number) {
    this.chainPhase = 'transition';
    this.morphProgress = Math.max(0.0, Math.min(1.0, progress));
    this.chainPhaseTimer = this.morphProgress * this.currentTransitionTime;
    this.emitChainTimelineUpdate();
  }

  public setOnChainUpdate(cb: ((state: ChainTimelineState) => void) | null) {
    this.onChainUpdateCallback = cb;
  }

  public getChainTimelineState(): ChainTimelineState {
    const ch = this.config.chaining;
    const chain = ch?.chain || ['O', 'I'];
    const curG = chain[this.chainIndex % chain.length] || '';
    const nextG = chain[this.nextChainIndex % chain.length] || '';
    const dur = this.chainPhase === 'hold' ? this.currentStepHoldTime : this.currentTransitionTime;
    return {
      currentIndex: this.chainIndex,
      nextIndex: this.nextChainIndex,
      currentGlyph: curG,
      nextGlyph: nextG,
      phase: this.chainPhase,
      progress: this.morphProgress,
      elapsedInPhase: this.chainPhaseTimer,
      totalDurationInPhase: dur,
    };
  }

  private emitChainTimelineUpdate() {
    if (!this.onChainUpdateCallback) return;
    const ch = this.config.chaining;
    const chain = ch?.chain || ['O', 'I'];
    const curG = chain[this.chainIndex % chain.length] || '';
    const nextG = chain[this.nextChainIndex % chain.length] || '';
    const dur = this.chainPhase === 'hold' ? this.currentStepHoldTime : this.currentTransitionTime;

    this.onChainUpdateCallback({
      currentIndex: this.chainIndex,
      nextIndex: this.nextChainIndex,
      currentGlyph: curG,
      nextGlyph: nextG,
      phase: this.chainPhase,
      progress: this.morphProgress,
      elapsedInPhase: this.chainPhaseTimer,
      totalDurationInPhase: dur,
    });
  }

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
