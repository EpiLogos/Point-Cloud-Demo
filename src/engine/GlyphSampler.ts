/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface BakeResult {
  textureA: THREE.DataTexture;
  textureB: THREE.DataTexture;
  centerA: THREE.Vector2;
  centerB: THREE.Vector2;
  vortexCenter: THREE.Vector2;
  attractorCenters: THREE.Vector2[];
}

export const FALLBACK_FONT_STACK =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif';

export class GlyphSampler {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private targetCache = new Map<
    string,
    {
      data: Float32Array;
      center: THREE.Vector2;
      subCenters: THREE.Vector2[];
    }
  >();

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 1024;
    const context = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      throw new Error('Failed to create offscreen 2D canvas context for glyph rasterization');
    }
    this.ctx = context;
  }

  public clearCache() {
    this.targetCache.clear();
  }

  /**
   * Renders a glyph or arbitrary string onto the offscreen canvas with automatic font-size scaling
   */
  private rasterizeGlyph(
    glyphText: string,
    fontFamily: string = FALLBACK_FONT_STACK,
    fontWeight: string | number = 900
  ): {
    imageData: ImageData;
    bbox: { minX: number; maxX: number; minY: number; maxY: number };
    center: THREE.Vector2;
    subCenters: THREE.Vector2[];
  } {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, w, h);

    const safeText = glyphText.trim() || 'O';

    // Auto-scale font size dynamically to fit width & height without clipping
    let targetFontSize = Math.floor(h * 0.52);
    ctx.font = `${fontWeight} ${targetFontSize}px ${fontFamily}`;
    const initialMeasure = ctx.measureText(safeText);
    const maxAllowableWidth = w * 0.88;

    if (initialMeasure.width > maxAllowableWidth) {
      const scale = maxAllowableWidth / initialMeasure.width;
      targetFontSize = Math.max(36, Math.floor(targetFontSize * scale));
    }

    ctx.font = `${fontWeight} ${targetFontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';

    const cx = w / 2;
    const cy = h / 2;
    ctx.fillText(safeText, cx, cy);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let minX = w;
    let maxX = 0;
    let minY = h;
    let maxY = 0;
    let sumX = 0;
    let sumY = 0;
    let totalWeight = 0;

    // Scan bounding box and global center of mass
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const idx = (y * w + x) * 4;
        const alpha = data[idx + 3];
        if (alpha > 15) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

          sumX += x * alpha;
          sumY += y * alpha;
          totalWeight += alpha;
        }
      }
    }

    if (totalWeight === 0) {
      minX = w * 0.3;
      maxX = w * 0.7;
      minY = h * 0.3;
      maxY = h * 0.7;
      sumX = cx;
      sumY = cy;
      totalWeight = 1;
    }

    const glyphCenter = new THREE.Vector2(
      sumX / totalWeight - cx,
      -(sumY / totalWeight - cy)
    );

    // Identify sub-centers for individual characters (for multi-attractor orbital simulation)
    const subCenters: THREE.Vector2[] = [];
    const chars = Array.from(safeText).filter((c) => c !== ' ');

    if (chars.length > 1) {
      // Split canvas horizontally across character segments to locate individual centroids
      const spanWidth = Math.max(50, maxX - minX);
      const segmentWidth = spanWidth / chars.length;

      for (let i = 0; i < chars.length && i < 6; i++) {
        const segMinX = minX + i * segmentWidth;
        const segMaxX = segMinX + segmentWidth;

        let segSumX = 0;
        let segSumY = 0;
        let segWeight = 0;

        for (let y = minY; y <= maxY; y += 4) {
          for (let x = Math.floor(segMinX); x <= Math.floor(segMaxX); x += 4) {
            const idx = (y * w + x) * 4;
            const alpha = data[idx + 3];
            if (alpha > 20) {
              segSumX += x * alpha;
              segSumY += y * alpha;
              segWeight += alpha;
            }
          }
        }

        if (segWeight > 0) {
          subCenters.push(
            new THREE.Vector2(
              segSumX / segWeight - cx,
              -(segSumY / segWeight - cy)
            )
          );
        } else {
          // Fallback evenly distributed position
          const segCenterX = segMinX + segmentWidth * 0.5;
          subCenters.push(new THREE.Vector2(segCenterX - cx, glyphCenter.y));
        }
      }
    } else {
      subCenters.push(glyphCenter.clone());
    }

    return {
      imageData: imgData,
      bbox: { minX, maxX, minY, maxY },
      center: glyphCenter,
      subCenters,
    };
  }

  /**
   * Generates target particle positions for a given glyph.
   * Supports both Stochastic Stipple (with perimeter falloff scatter) and Ordered Halftone Matrix.
   */
  public generateTargetData(
    glyphText: string,
    particleCount: number,
    texWidth: number,
    texHeight: number,
    style: 'stipple' | 'halftone' = 'stipple',
    fontFamily: string = FALLBACK_FONT_STACK,
    fontWeight: string | number = 900,
    worldScale: number = 0.85
  ): {
    data: Float32Array;
    center: THREE.Vector2;
    subCenters: THREE.Vector2[];
  } {
    const cacheKey = `${glyphText}_${particleCount}_${texWidth}_${texHeight}_${style}_${fontFamily}_${fontWeight}_${worldScale}`;
    const cached = this.targetCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { imageData, bbox, center, subCenters } = this.rasterizeGlyph(glyphText, fontFamily, fontWeight);
    const w = this.canvas.width;
    const h = this.canvas.height;
    const pixels = imageData.data;

    const data = new Float32Array(texWidth * texHeight * 4);

    // Build dense point candidates list with density weighting
    interface SampleCandidate {
      x: number;
      y: number;
      density: number; // 0.0 to 1.0
    }

    const strokeCandidates: SampleCandidate[] = [];
    const edgeCandidates: SampleCandidate[] = [];

    // Bounding box padding for stipple scatter
    const pad = 40;
    const startX = Math.max(0, bbox.minX - pad);
    const endX = Math.min(w - 1, bbox.maxX + pad);
    const startY = Math.max(0, bbox.minY - pad);
    const endY = Math.min(h - 1, bbox.maxY + pad);

    const step = style === 'halftone' ? 4 : 2;

    for (let y = startY; y <= endY; y += step) {
      for (let x = startX; x <= endX; x += step) {
        const idx = (y * w + x) * 4;
        const alpha = pixels[idx + 3] / 255.0;

        if (alpha > 0.02) {
          // Compute local neighborhood gradient to detect edges vs core
          let edgeDist = 0;
          if (x > 2 && x < w - 2 && y > 2 && y < h - 2) {
            const aL = pixels[(y * w + (x - 2)) * 4 + 3];
            const aR = pixels[(y * w + (x + 2)) * 4 + 3];
            const aT = pixels[((y - 2) * w + x) * 4 + 3];
            const aB = pixels[((y + 2) * w + x) * 4 + 3];
            const grad = Math.abs(aR - aL) + Math.abs(aB - aT);
            edgeDist = grad / 510.0;
          }

          const cand: SampleCandidate = {
            x: (x - w / 2) * worldScale,
            y: -(y - h / 2) * worldScale,
            density: alpha,
          };

          if (alpha > 0.65 && edgeDist < 0.25) {
            strokeCandidates.push(cand);
          } else {
            edgeCandidates.push(cand);
          }
        }
      }
    }

    const allCandidates = strokeCandidates.concat(edgeCandidates);
    const candidateCount = allCandidates.length;

    if (candidateCount === 0) {
      // Fallback ring if nothing rendered
      for (let i = 0; i < particleCount; i++) {
        const theta = (i / particleCount) * Math.PI * 2;
        const r = 180 + (Math.random() - 0.5) * 40;
        data[i * 4 + 0] = Math.cos(theta) * r;
        data[i * 4 + 1] = Math.sin(theta) * r;
        data[i * 4 + 2] = (Math.random() - 0.5) * 10;
        data[i * 4 + 3] = 0.8;
      }
      return { data, center, subCenters };
    }

    if (style === 'halftone') {
      // Ordered Halftone / Dot-Matrix Grid Stippling:
      // Snap positions into a structured grid pattern where radius/density will be modulated
      const gridPitch = 8.5; // pixel spacing between halftone dots
      const gridCols = Math.ceil((bbox.maxX - bbox.minX + pad * 2) / gridPitch);
      const gridRows = Math.ceil((bbox.maxY - bbox.minY + pad * 2) / gridPitch);

      const gridNodes: SampleCandidate[] = [];

      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const px = Math.floor(bbox.minX - pad + c * gridPitch);
          const py = Math.floor(bbox.minY - pad + r * gridPitch);

          if (px >= 0 && px < w && py >= 0 && py < h) {
            const idx = (py * w + px) * 4;
            const alpha = pixels[idx + 3] / 255.0;
            if (alpha > 0.05) {
              gridNodes.push({
                x: (px - w / 2) * worldScale,
                y: -(py - h / 2) * worldScale,
                density: alpha,
              });
            }
          }
        }
      }

      const numGridNodes = Math.max(1, gridNodes.length);
      for (let i = 0; i < particleCount; i++) {
        // Distribute particles across grid nodes with tiny micro-jitter
        const nodeIndex = i % numGridNodes;
        const node = gridNodes[nodeIndex];
        const microJitter = (Math.random() - 0.5) * 1.5;

        data[i * 4 + 0] = node.x + microJitter;
        data[i * 4 + 1] = node.y + microJitter;
        data[i * 4 + 2] = (Math.random() - 0.5) * 4.0;
        data[i * 4 + 3] = node.density;
      }
    } else {
      // Stochastic Stipple (Risograph Spray):
      // Core stroke has high concentration, dropping off into stippled scatter at perimeters
      for (let i = 0; i < particleCount; i++) {
        // 75% sampled from core stroke with jitter, 25% from outer stipple perimeter
        const isCore = Math.random() < 0.72 && strokeCandidates.length > 0;
        const pool = isCore ? strokeCandidates : allCandidates;
        const chosen = pool[Math.floor(Math.random() * pool.length)];

        // Stochastic dispersion jitter based on local density
        const scatterRadius = isCore
          ? (Math.random() - 0.5) * 5.0
          : (Math.random() - 0.5) * 22.0 * (1.05 - chosen.density);

        data[i * 4 + 0] = chosen.x + scatterRadius;
        data[i * 4 + 1] = chosen.y + scatterRadius;
        data[i * 4 + 2] = (Math.random() - 0.5) * 8.0;
        data[i * 4 + 3] = chosen.density;
      }
    }

    const result = { data, center, subCenters };
    this.targetCache.set(cacheKey, result);
    return result;
  }

  /**
   * Bakes target textures for glyph A and glyph B (for morphing)
   * Automatically recognizes any user-typed string, special characters, or word pairs
   */
  public bakeTargets(
    glyphInput: string | string[],
    particleCount: number,
    texWidth: number,
    texHeight: number,
    style: 'stipple' | 'halftone',
    fontFamily: string = FALLBACK_FONT_STACK,
    fontWeight: string | number = 900
  ): BakeResult {
    let textA = 'O';
    let textB = 'I';

    if (Array.isArray(glyphInput)) {
      textA = glyphInput[0] || 'O';
      textB = glyphInput[1] || textA;
    } else if (typeof glyphInput === 'string') {
      const trimmed = glyphInput.trim();
      // Check if user separated with space, comma, slash, or arrow
      const splitTokens = trimmed.split(/[\s,⇄→/\-_|]+/).filter(Boolean);
      if (splitTokens.length >= 2) {
        textA = splitTokens[0];
        textB = splitTokens[1];
      } else if (splitTokens.length === 1) {
        const token = splitTokens[0];
        if (token.length >= 2 && Array.from(token).length === 2) {
          // Exactly 2 unicode glyphs like "OI" or "✦✧"
          const chars = Array.from(token);
          textA = chars[0];
          textB = chars[1];
        } else {
          // Single word or symbol (e.g. "VOID", "✦", "§")
          textA = token;
          textB = token;
        }
      }
    }

    const resA = this.generateTargetData(textA, particleCount, texWidth, texHeight, style, fontFamily, fontWeight);
    const resB = this.generateTargetData(textB, particleCount, texWidth, texHeight, style, fontFamily, fontWeight);

    const texA = new THREE.DataTexture(
      resA.data,
      texWidth,
      texHeight,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    texA.needsUpdate = true;
    texA.minFilter = THREE.NearestFilter;
    texA.magFilter = THREE.NearestFilter;

    const texB = new THREE.DataTexture(
      resB.data,
      texWidth,
      texHeight,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    texB.needsUpdate = true;
    texB.minFilter = THREE.NearestFilter;
    texB.magFilter = THREE.NearestFilter;

    // Vortex center lies in the corridor bridging the two glyphs
    const vortexCenter = new THREE.Vector2(
      (resA.center.x + resB.center.x) * 0.5,
      (resA.center.y + resB.center.y) * 0.5
    );

    // Aggregate unique attractor center poles from both letterforms
    const rawAttractors = [...resA.subCenters, ...resB.subCenters];
    const uniqueAttractors: THREE.Vector2[] = [];
    for (const pt of rawAttractors) {
      const isDuplicate = uniqueAttractors.some((u) => u.distanceTo(pt) < 15);
      if (!isDuplicate) {
        uniqueAttractors.push(pt);
      }
    }

    // Ensure at least 2 distinct attractor poles for orbital mechanics
    if (uniqueAttractors.length < 2) {
      uniqueAttractors.push(new THREE.Vector2(-140, 0));
      uniqueAttractors.push(new THREE.Vector2(140, 0));
    }

    return {
      textureA: texA,
      textureB: texB,
      centerA: resA.center,
      centerB: resB.center,
      vortexCenter,
      attractorCenters: uniqueAttractors.slice(0, 6),
    };
  }

  public destroy() {
    this.targetCache.clear();
    this.canvas.width = 1;
    this.canvas.height = 1;
  }
}
