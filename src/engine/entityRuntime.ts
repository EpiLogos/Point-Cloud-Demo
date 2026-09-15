/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * EntityRuntime — the engine-side owner of the field's formations.
 *
 *  - Every enabled formation owns a contiguous PARTITION of the particle texture (share-weighted).
 *  - Each partition's A/B targets are baked in LOCAL coordinates (centred on the origin); the entity's
 *    world centre is a per-frame uniform, so moving an entity never re-bakes and never reseeds.
 *  - Sequence position (which link, progress) is resolved statelessly from the engine clock via
 *    fieldModel.resolveSequence; a partition is re-baked only when its current/next link changes.
 *  - Positions/velocities are never touched here except `buildSeed()` for an explicit reset.
 */

import * as THREE from 'three';
import { GlyphSampler } from './GlyphSampler';
import {
  Entity,
  Shape,
  Composition,
  Partition,
  SequenceState,
  layoutPartitions,
  resolveSequence,
  effectiveLinks,
  MAX_FORMATIONS,
} from './fieldModel';
import { SpatialChakraNode } from './types';
import { CANONICAL_CHAKRAS } from './chakraSystem';

/** World px per canvas px at entity.scale = 1 (a glyph fills ≈ 400 px) */
const BASE_SCALE = 0.56;

interface Candidate {
  x: number;
  y: number;
  z?: number;
  density: number;
}

export interface EntityFrame {
  entityId: string;
  index: number;
  state: SequenceState;
}

export interface EntityUniformSet {
  count: number;
  bounds: Float32Array; // 10 — exclusive end particle index
  centers: THREE.Vector4[]; // 10 — xyz centre, w force radius
  morph: Float32Array; // 10
  transforms: THREE.Vector3[]; // x/y scale and rotation radians
  depthScales: Float32Array;
  normalized: Float32Array;
  forces: THREE.Vector4[]; // 10 — x strength, y mode, z spin, w enabled
  tints: THREE.Color[]; // 10
  tintWeights: Float32Array; // 10
}

const FORCE_MODE: Record<string, number> = { none: 0, attract: 1, repel: 2, vortex: 3 };

export class EntityRuntime {
  private sampler: GlyphSampler;
  public bakeGeneration = 0;
  private currentPlane: Composition['plane'] = 'vertical';
  private texW = 0;
  private texH = 0;
  private particleCount = 0;
  private dataA: Float32Array = new Float32Array(0);
  private dataB: Float32Array = new Float32Array(0);
  private noiseData: Float32Array = new Float32Array(0);
  public noiseTexture: THREE.DataTexture | null = null;
  public textureA: THREE.DataTexture | null = null;
  public textureB: THREE.DataTexture | null = null;

  private partitions: Partition[] = [];
  private layoutSig = '';
  private bakeSig = new Map<string, string>();
  private lastStep = new Map<string, number>();
  private customCandidates = new Map<string, Candidate[]>();
  private candidateCache = new Map<string, Candidate[]>();
  private baseSig = '';
  private templateGeometry: 'square'|'circular'|'volumetric3D' = 'square';
  private templateDimension: '2D'|'3D' = '2D';

  public readonly uniforms: EntityUniformSet = {
    count: 0,
    bounds: new Float32Array(10),
    centers: Array.from({ length: 10 }, () => new THREE.Vector4(0, 0, 0, 200)),
    morph: new Float32Array(10),
    transforms: Array.from({ length: 10 }, () => new THREE.Vector3(1, 1, 0)),
    depthScales: new Float32Array(10).fill(1),
    normalized: new Float32Array(10),
    forces: Array.from({ length: 10 }, () => new THREE.Vector4(0, 0, 0, 0)),
    tints: Array.from({ length: 10 }, () => new THREE.Color('#ffffff')),
    tintWeights: new Float32Array(10),
  };

  constructor(sampler: GlyphSampler) {
    this.sampler = sampler;
  }

  // ------------------------------------------------------------------ allocation
  public allocate(particleCount: number, texW: number, texH: number) {
    this.disposeTextures();
    this.texW = texW;
    this.texH = texH;
    this.particleCount = particleCount;
    this.dataA = new Float32Array(texW * texH * 4);
    this.dataB = new Float32Array(texW * texH * 4);
    this.noiseData = new Float32Array(texW * texH * 4);
    this.noiseTexture = new THREE.DataTexture(this.noiseData, texW, texH, THREE.RGBAFormat, THREE.FloatType);
    this.textureA = new THREE.DataTexture(this.dataA, texW, texH, THREE.RGBAFormat, THREE.FloatType);
    this.textureB = new THREE.DataTexture(this.dataB, texW, texH, THREE.RGBAFormat, THREE.FloatType);
    for (const t of [this.textureA, this.textureB, this.noiseTexture]) {
      t.minFilter = THREE.NearestFilter;
      t.magFilter = THREE.NearestFilter;
      t.needsUpdate = true;
    }
    this.layoutSig = '';
    this.bakeSig.clear();
    this.lastStep.clear();
  }

  private disposeTextures() {
    this.textureA?.dispose();
    this.textureB?.dispose();
    this.noiseTexture?.dispose();this.noiseTexture=null;
    this.textureA = null;
    this.textureB = null;
  }

  public dispose() {
    this.disposeTextures();
    this.candidateCache.clear();
  }

  public getPartitions(): Partition[] {
    return this.partitions;
  }

  /** Base bake context (style/font/plane). Changing it invalidates every partition. */
  public setBaseContext(style: string, fontFamily: string | undefined, fontWeight: string | number | undefined, plane: Composition['plane'], template?: {plateGeometry?:'square'|'circular'|'volumetric3D';dimension?:'2D'|'3D'}) {
    this.templateGeometry=template?.plateGeometry??'square';this.templateDimension=template?.dimension??'2D';
    const sig = `${style}|${fontFamily ?? ''}|${fontWeight ?? ''}|${plane}|${this.templateGeometry}|${this.templateDimension}`;
    if (sig !== this.baseSig) {
      this.baseSig = sig;
      this.candidateCache.clear();
      this.bakeSig.clear();
    }
  }

  /** Image / ASCII sources: override a formation's shape with an explicit candidate pool. */
  public setCustomCandidates(entityId: string, candidates: Candidate[] | null) {
    if (candidates) this.customCandidates.set(entityId, candidates);
    else this.customCandidates.delete(entityId);
    this.bakeSig.delete(entityId);
  }

  // ------------------------------------------------------------------ shapes
  private shapeSignature(shape: Shape): string {
    return `${shape.kind}|${shape.text ?? ''}|${shape.yantraId ?? ''}|${shape.frequencyHz ?? ''}|${shape.primitive ?? ''}|${shape.plateGeometry ?? ''}|${shape.dimension ?? ''}`;
  }

  private candidatesFor(shape: Shape, fontFamily: string | undefined, fontWeight: string | number | undefined): Candidate[] {
    const sig = this.shapeSignature(shape);
    const cached = this.candidateCache.get(sig);
    if (cached) return cached;

    let out: Candidate[];
    const pseudo: SpatialChakraNode = {
      id: shape.yantraId || 'anahata',
      shape: shape.kind === 'glyph' ? 'glyph' : shape.kind === 'cymatic' ? 'cymatic' : 'yantra',
      glyphText: shape.text,
      name: '',
      sanskrit: '',
      seedSyllable: shape.text || 'ॐ',
      symbol: shape.text || '✦',
      frequencyHz: shape.frequencyHz ?? 396,
      x: 0,
      y: 0,
      scale: 1,
      color: '#ffffff',
      attractorStrength: 0,
      active: true,
    };
    if (shape.kind === 'primitive') {
      out = [];
      const kind = shape.primitive ?? 'disc';
      for (let j=0;j<192;j++) for(let i=0;i<192;i++) {
        const x=(i/191-.5)*400, y=(j/191-.5)*400;
        const r=Math.hypot(x,y);
        const inside=kind==='square' || kind==='disc'&&r<=200 || kind==='ring'&&r>=140&&r<=200 || kind==='triangle'&&y>=-200&&y<=200&&Math.abs(x)<=(200-y)/2;
        if (inside) out.push({x,y,density:1});
      }
    } else if (shape.kind === 'cymatic') {
      const freq = shape.frequencyHz ?? 396;
      const profile = CANONICAL_CHAKRAS.reduce((best, c) => (Math.abs((c.frequencyHz ?? 0) - freq) < Math.abs((best.frequencyHz ?? 0) - freq) ? c : best), CANONICAL_CHAKRAS[0]);
      pseudo.id = profile.id;
      out = this.sampler.sampleCymaticNode(pseudo, shape.plateGeometry ?? this.templateGeometry, shape.dimension ?? this.templateDimension, 1.0, 0.0, freq).candidates;
    } else {
      out = this.sampler.rasterizeSpatialNode(pseudo, shape.kind === 'glyph' ? 'symbol' : 'yantra', fontFamily, fontWeight, 'yantraA').candidates;
    }
    if (out.length === 0) out = [{ x: 0, y: 0, density: 1 }];
    this.candidateCache.set(sig, out);
    return out;
  }

  // ------------------------------------------------------------------ layout & baking
  /** Recompute partitions. Returns true when the layout changed (all partitions need baking). */
  public layout(entities: Entity[]): boolean {
    this.partitions = layoutPartitions(entities, this.particleCount);
    const sig = this.partitions.map((p) => `${p.entityId}:${p.start}-${p.end}`).join(',');
    if (sig === this.layoutSig) return false;
    this.layoutSig = sig;
    this.bakeSig.clear();
    // particles outside every partition (none normally) are parked at the origin
    return true;
  }

  private writeCandidates(
    target: Float32Array,
    start: number,
    end: number,
    cands: Candidate[],
    scale: number,
    plane: Composition['plane'],
    jitterPx: number,
    channel: 0 | 2
  ) {
    const n = cands.length;
    for (let i = start; i < end; i++) {
      // The raster pool is scanline ordered. A prefix would crop low-share
      // allocations to the top of a glyph. A low-discrepancy stride covers the
      // complete local shape for every allocation size without changing IDs.
      const c = cands[Math.floor(((i-start)*0.6180339887498949 % 1)*n)];
      const jx = (Math.random() - 0.5) * jitterPx;
      const jy = (Math.random() - 0.5) * jitterPx;
      this.noiseData[i*4+channel]=jx;this.noiseData[i*4+channel+1]=jy;
      const lx = c.x * scale;
      const ly = c.y * scale;
      const lz = (c.z ?? 0) * scale;
      const o = i * 4;
      if (plane === 'horizontal') {
        target[o] = lx;
        target[o + 1] = lz;
        target[o + 2] = -ly;
      } else {
        target[o] = lx;
        target[o + 1] = ly;
        target[o + 2] = lz;
      }
      target[o + 3] = c.density;
    }
  }

  private bakePartition(p: Partition, e: Entity, linkIndex: number, nextIndex: number, plane: Composition['plane'], fontFamily?: string, fontWeight?: string | number) {
    const links = effectiveLinks(e);
    const custom = this.customCandidates.get(e.id);
    const candA = custom && linkIndex === 0 ? custom : this.candidatesFor(links[linkIndex].shape, fontFamily, fontWeight);
    const candB = custom && nextIndex === 0 ? custom : this.candidatesFor(links[nextIndex].shape, fontFamily, fontWeight);
    this.bakeGeneration++;
    const normalize = (cands: Candidate[]) => {
      if (!e.extent || e.extent.normalized === false) return cands;
      const core = cands.filter(c=>c.density>.25);
      let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
      for (const c of (core.length ? core : cands)) {x0=Math.min(x0,c.x);x1=Math.max(x1,c.x);y0=Math.min(y0,c.y);y1=Math.max(y1,c.y);}
      const sx=400/Math.max(1,x1-x0),sy=400/Math.max(1,y1-y0);
      return cands.map(c=>({...c,x:(c.x-(x0+x1)/2)*sx,y:(c.y-(y0+y1)/2)*sy}));
    };
    // Image/ASCII pools arrive already normalized to the 400-unit stage box with
    // their true aspect preserved. The glyph law would stretch them to a square.
    const preset = (cands: Candidate[]) => (cands as {norm?:string}).norm === 'stage400' ? cands : normalize(cands);
    const scale = e.extent && e.extent.normalized !== false ? 1 : BASE_SCALE;
    this.writeCandidates(this.dataA, p.start, p.end, preset(candA), scale, plane, 2, 0);
    this.writeCandidates(this.dataB, p.start, p.end, preset(candB), scale, plane, 2, 2);
    if (this.noiseTexture) this.noiseTexture.needsUpdate = true;
    if (this.textureA) this.textureA.needsUpdate = true;
    if (this.textureB) this.textureB.needsUpdate = true;
  }

  /**
   * Per-frame update: resolves every formation's sequence, re-bakes partitions whose links changed,
   * and refreshes the uniform set. Returns the frames + impulses to fire (link changes).
   */
  public update(
    entities: Entity[],
    comp: Composition,
    simTime: number,
    drivePhase: number,
    manualMorph: number,
    holdRatio: number,
    fontFamily?: string,
    fontWeight?: string | number
  ): { frames: EntityFrame[]; impulses: number[]; rebaked: boolean } {
    this.currentPlane = comp.plane;
    const byId = new Map(entities.map((e) => [e.id, e]));
    const frames: EntityFrame[] = [];
    const impulses: number[] = [];
    let rebaked = false;
    const u = this.uniforms;
    u.count = Math.min(MAX_FORMATIONS, this.partitions.length);

    this.partitions.forEach((p, i) => {
      if (i >= 10) return;
      const e = byId.get(p.entityId);
      if (!e) return;
      const state = resolveSequence(e, simTime, drivePhase, manualMorph, holdRatio);
      const links = effectiveLinks(e);
      const sig = `${this.shapeSignature(links[state.linkIndex].shape)}>${this.shapeSignature(links[state.nextIndex].shape)}|${!!e.extent && e.extent.normalized !== false}|${this.customCandidates.has(e.id) ? `c:${state.linkIndex === 0}:${state.nextIndex === 0}` : ''}`;
      const prevStep = this.lastStep.get(e.id);
      if (this.bakeSig.get(e.id) !== sig) {
        this.bakePartition(p, e, state.linkIndex, state.nextIndex, comp.plane, fontFamily, fontWeight);
        this.bakeSig.set(e.id, sig);
        rebaked = true;
      }
      if (prevStep !== undefined && prevStep !== state.step && e.sequence.impulse > 0) impulses.push(e.sequence.impulse);
      this.lastStep.set(e.id, state.step);

      // centre = entity position + per-link offsets glided by progress
      const la = links[state.linkIndex];
      const lb = links[state.nextIndex];
      const t = state.progress;
      const cx = e.x + ((la.x ?? 0) * (1 - t) + (lb.x ?? 0) * t);
      const cy = e.y + ((la.y ?? 0) * (1 - t) + (lb.y ?? 0) * t);
      const cz = e.z + ((la.z ?? 0) * (1 - t) + (lb.z ?? 0) * t);
      u.bounds[i] = p.end;
      u.centers[i].set(cx, cy, cz, Math.max(5, e.forces.radius));
      u.morph[i] = state.progress;
      u.depthScales[i]=Math.max(.001,e.scale);
      u.normalized[i]=e.extent&&e.extent.normalized!==false?1:0;
      u.transforms[i].set(Math.max(0.001,e.scale)*(e.extent?e.extent.width/400:1), Math.max(0.001,e.scale)*(e.extent?e.extent.height/400:1), e.extent?.rotation??0);
      u.forces[i].set(e.forces.strength, FORCE_MODE[e.forces.mode] ?? 0, e.forces.spin, e.enabled && e.forces.mode !== 'none' ? 1 : e.enabled && Math.abs(e.forces.spin) > 0 ? 1 : 0);
      u.tints[i].set(e.tint);
      u.tintWeights[i] = Math.max(0, Math.min(1, e.tintWeight * comp.entityTintWeight));
      frames.push({ entityId: e.id, index: i, state });
    });
    for (let i = u.count; i < 10; i++) {
      u.bounds[i] = this.particleCount;
      u.forces[i].set(0, 0, 0, 0);
      u.tintWeights[i] = 0;
      u.morph[i] = 0;
    }
    return { frames, impulses, rebaked };
  }

  /** Explicit reset: particle seed = current A targets translated to each entity's centre. */
  public buildSeed(): Float32Array {
    const seed = new Float32Array(this.dataA.length);
    seed.set(this.dataA);
    if (!this.partitions.length) {
      // A field without formations remains a medium, not a stack at the origin.
      // Used only on explicit reset / initial count allocation.
      const count=seed.length/4;
      for(let i=0;i<count;i++) {
        seed[i*4]=(((i+.5)*0.6180339887498949)%1-.5)*700;
        seed[i*4+1]=((i+.5)/count-.5)*700;
        seed[i*4+2]=0; seed[i*4+3]=.8;
      }
    }
    this.partitions.forEach((p, i) => {
      if (i >= 10) return;
      const c = this.uniforms.centers[i];
      for (let k = p.start; k < p.end; k++) {
        const tr=this.uniforms.transforms[i];
        const horizontal=this.currentPlane==='horizontal';
        const jx=this.noiseData[k*4],jy=this.noiseData[k*4+1],normalized=this.uniforms.normalized[i]>.5;
        const x=(seed[k*4]+(normalized?jx:0))*tr.x, y=((horizontal?-seed[k*4+2]:seed[k*4+1])+(normalized?jy:0))*tr.y;
        const nx=normalized?0:jx,ny=normalized?0:jy;
        const co=Math.cos(tr.z),si=Math.sin(tr.z);
        seed[k*4]=x*co-y*si+nx+c.x;
        if(horizontal){seed[k*4+2]=-(x*si+y*co+ny)+c.z;seed[k*4+1]=seed[k*4+1]*this.uniforms.depthScales[i]+c.y;}
        else{seed[k*4+1]=x*si+y*co+ny+c.y;seed[k*4+2]=seed[k*4+2]*this.uniforms.depthScales[i]+c.z;}
      }
    });
    return seed;
  }

  /** Centroid of all formation centres (field-level vortex reference) */
  public fieldCentre(): THREE.Vector2 {
    const n = this.uniforms.count;
    if (n === 0) return new THREE.Vector2(0, 0);
    let x = 0;
    let y = 0;
    for (let i = 0; i < n; i++) {
      x += this.uniforms.centers[i].x;
      y += this.uniforms.centers[i].y;
    }
    return new THREE.Vector2(x / n, y / n);
  }
}
