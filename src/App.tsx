/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Sliders,
  Play,
  Pause,
  Sun,
  Moon,
  Circle,
  Square,
  Code2,
  ChevronDown,
  ChevronUp,
  Flame,
  Layers,
  Wind,
  Compass,
  Eye,
  EyeOff,
  Save,
  Bookmark,
  Download,
  Upload,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Orbit,
  Type,
  Maximize2,
  Link2,
  Palette,
} from 'lucide-react';
import { PointCloudConfig, PointCloudRelationalConfig, ChainTimelineState, SpatialChakraTimelineState, CameraOrbState } from './engine/types';
import { DEFAULT_CONFIG, PointCloudField, DEFAULT_COLOR_CONFIG } from './engine/PointCloudField';
import { isLightHex } from './engine/colorPalettes';
import { PointCloudComponent, PointCloudComponentRef } from './components/PointCloudComponent';
import { CameraOrbControl } from './components/CameraOrbControl';
import { TweakpaneDebug } from './components/TweakpaneDebug';
import { EditableNumber } from './components/EditableNumber';
import { CurvedSlider } from './components/CurvedSlider';
import { ChainingPanel } from './components/ChainingPanel';
import { ColorSystemPanel } from './components/ColorSystemPanel';
import { ChakraPanel } from './components/ChakraPanel';
import { createDefaultChakraConfig, CANONICAL_CHAKRAS } from './engine/chakraSystem';

interface Preset {
  id: string;
  name: string;
  description: string;
  config: Partial<PointCloudConfig>;
}

interface SavedState {
  id: string;
  name: string;
  timestamp: number;
  config: PointCloudConfig;
}

const PRESETS: Preset[] = [
  {
    id: 'reference_oi',
    name: 'O ⇄ I Vortex Bridge',
    description: 'Canonical reference: orbital vorticity pulling O boundary into I bar with fine stipple spray',
    config: {
      glyph: ['O', 'I'],
      style: 'stipple',
      dotShape: 'circle',
      particleSize: { min: 1.5, max: 3.5 },
      fluid: {
        curlScale: 1.2,
        curlSpeed: 0.6,
        vortexStrength: 1.45,
        viscosity: 0.94,
        returnSpeed: 1.15,
        turbulence: 1.0,
        dispersion: 0.75,
      },
      interaction: {
        radius: 190,
        strength: 1.3,
        mode: 'repel',
      },
      relational: {
        enabled: false,
        mode: 'orbital',
        attractorCount: 2,
        attractorGravity: 1.6,
        orbitSpeed: 0.8,
        orbitRadius: 240,
        relationalSpin: 1.4,
        chaosFactor: 0.2,
        wanderSpeed: 0.5,
      },
      autoMorph: true,
      autoMorphDuration: 3.8,
    },
  },
  {
    id: 'binary_star_orbit',
    name: 'Binary Star Relational Orbits',
    description: 'Two relational attractor poles dynamically orbiting each other, transferring stipple particles along gravitational bridges',
    config: {
      glyph: ['✦', '✧'],
      style: 'stipple',
      dotShape: 'circle',
      particleSize: { min: 1.2, max: 4.0 },
      relational: {
        enabled: true,
        mode: 'orbital',
        attractorCount: 2,
        attractorGravity: 3.2,
        orbitSpeed: 1.2,
        orbitRadius: 280,
        relationalSpin: 2.5,
        chaosFactor: 0.4,
        wanderSpeed: 0.6,
      },
      fluid: {
        curlScale: 1.4,
        curlSpeed: 0.8,
        vortexStrength: 1.5,
        viscosity: 0.94,
        returnSpeed: 0.6,
        turbulence: 0.8,
        dispersion: 0.5,
      },
      interaction: {
        radius: 200,
        strength: 1.5,
        mode: 'vortex',
      },
      autoMorph: false,
    },
  },
  {
    id: 'chaotic_strange_attractor',
    name: 'Harmonic Strange Attractor',
    description: '3 multi-pole non-linear harmonic wanderers perturbing typographic symbols into turbulent filament streams',
    config: {
      glyph: ['Ω', '∞'],
      style: 'stipple',
      dotShape: 'circle',
      particleSize: { min: 1.0, max: 3.8 },
      relational: {
        enabled: true,
        mode: 'chaos',
        attractorCount: 3,
        attractorGravity: 4.5,
        orbitSpeed: 0.5,
        orbitRadius: 320,
        relationalSpin: -3.0,
        chaosFactor: 2.2,
        wanderSpeed: 1.8,
      },
      fluid: {
        curlScale: 2.2,
        curlSpeed: 1.2,
        vortexStrength: 2.2,
        viscosity: 0.93,
        returnSpeed: 0.4,
        turbulence: 1.8,
        dispersion: 1.0,
      },
      interaction: {
        radius: 250,
        strength: 2.0,
        mode: 'attract',
      },
      autoMorph: false,
    },
  },
  {
    id: 'nbody_lemniscate',
    name: 'N-Body Lemniscate Rosette',
    description: 'Keplerian figure-8 orbit with 4 dynamic centers interweaving mathematical glyph forms in continuous motion',
    config: {
      glyph: ['∑', '∫'],
      style: 'halftone',
      dotShape: 'circle',
      particleSize: { min: 1.2, max: 5.0 },
      relational: {
        enabled: true,
        mode: 'nbody',
        attractorCount: 4,
        attractorGravity: 2.8,
        orbitSpeed: 1.4,
        orbitRadius: 260,
        relationalSpin: 2.0,
        chaosFactor: 0.3,
        wanderSpeed: 0.4,
      },
      fluid: {
        curlScale: 0.9,
        curlSpeed: 0.5,
        vortexStrength: 1.2,
        viscosity: 0.95,
        returnSpeed: 0.9,
        turbulence: 0.5,
        dispersion: 0.3,
      },
      interaction: {
        radius: 220,
        strength: 1.4,
        mode: 'vortex',
      },
      autoMorph: false,
    },
  },
  {
    id: 'explosive_antigravity',
    name: 'Anti-Spring Kinetic Dispersal',
    description: 'Negative spring constant (k = -0.6) and high kinetic speed propelling stipple points outward in unrestrained fluid dissipation',
    config: {
      glyph: ['&', '@'],
      style: 'stipple',
      dotShape: 'circle',
      particleSize: { min: 1.4, max: 4.5 },
      relational: {
        enabled: true,
        mode: 'chaos',
        attractorCount: 2,
        attractorGravity: -2.5,
        orbitSpeed: 2.0,
        orbitRadius: 300,
        relationalSpin: 5.0,
        chaosFactor: 3.5,
        wanderSpeed: 2.0,
      },
      fluid: {
        curlScale: 3.0,
        curlSpeed: 2.5,
        vortexStrength: 4.5,
        viscosity: 0.97,
        returnSpeed: -0.6,
        turbulence: 3.0,
        dispersion: 2.5,
      },
      interaction: {
        radius: 350,
        strength: 3.5,
        mode: 'repel',
      },
      autoMorph: true,
      autoMorphDuration: 3.0,
    },
  },
  {
    id: 'halftone_matrix',
    name: 'Ordered Halftone Matrix',
    description: 'Structured dot-matrix grid with radius directly modulated by typographical stroke density',
    config: {
      glyph: ['O', 'I'],
      style: 'halftone',
      dotShape: 'circle',
      particleSize: { min: 1.2, max: 5.2 },
      fluid: {
        curlScale: 0.8,
        curlSpeed: 0.4,
        vortexStrength: 0.6,
        viscosity: 0.96,
        returnSpeed: 1.8,
        turbulence: 0.4,
        dispersion: 0.2,
      },
      interaction: {
        radius: 160,
        strength: 1.1,
        mode: 'vortex',
      },
      relational: {
        enabled: false,
      },
      autoMorph: true,
      autoMorphDuration: 4.5,
    },
  },
  {
    id: 'risograph_spray',
    name: 'Risograph Ink Spray',
    description: 'Organic high-turbulence curl dispersion with micro-droplet perimeter scatter',
    config: {
      glyph: ['&', '@'],
      style: 'stipple',
      dotShape: 'circle',
      particleSize: { min: 1.2, max: 3.8 },
      fluid: {
        curlScale: 1.8,
        curlSpeed: 0.85,
        vortexStrength: 1.1,
        viscosity: 0.93,
        returnSpeed: 0.85,
        turbulence: 1.6,
        dispersion: 0.9,
      },
      interaction: {
        radius: 220,
        strength: 1.5,
        mode: 'repel',
      },
      relational: {
        enabled: false,
      },
      autoMorph: true,
      autoMorphDuration: 4.2,
    },
  },
  {
    id: 'square_dither',
    name: 'Square Dither Grid',
    description: 'Typographic square dither matrix with geometric halftone compression',
    config: {
      glyph: ['8', '∞'],
      style: 'halftone',
      dotShape: 'square',
      particleSize: { min: 1.4, max: 4.8 },
      fluid: {
        curlScale: 1.0,
        curlSpeed: 0.5,
        vortexStrength: 0.8,
        viscosity: 0.95,
        returnSpeed: 1.5,
        turbulence: 0.6,
        dispersion: 0.4,
      },
      interaction: {
        radius: 180,
        strength: 1.2,
        mode: 'attract',
      },
      relational: {
        enabled: false,
      },
      autoMorph: true,
      autoMorphDuration: 4.0,
    },
  },
  {
    id: 'chain_polygons',
    name: 'Platonic Polygon Sequence',
    description: 'Continuous geometric evolution traversing triangle, square, pentagon, hexagon, octagon, and circle',
    config: {
      style: 'stipple',
      dotShape: 'circle',
      particleSize: { min: 1.5, max: 3.5 },
      fluid: {
        curlScale: 1.6,
        curlSpeed: 0.9,
        vortexStrength: 1.8,
        viscosity: 0.94,
        returnSpeed: 1.4,
        turbulence: 1.2,
        dispersion: 0.8,
      },
      interaction: {
        radius: 200,
        strength: 1.5,
        mode: 'vortex',
      },
      relational: {
        enabled: false,
      },
      chaining: {
        enabled: true,
        chain: ['▲', '■', '⬟', '⬢', '⯎', '◉'],
        mode: 'loop',
        stepHoldDuration: 1.2,
        transitionDuration: 2.2,
        easing: 'smoothstep',
        timingJitter: 0.1,
        disperseImpulse: 0.6,
        paused: false,
      },
      autoMorph: false,
    },
  },
  {
    id: 'chain_zodiac',
    name: '12 Zodiac Constellations',
    description: 'Astronomical transit through the full 12 zodiac symbols with orbital multi-attractor dynamics',
    config: {
      style: 'stipple',
      dotShape: 'circle',
      particleSize: { min: 1.2, max: 3.2 },
      fluid: {
        curlScale: 1.8,
        curlSpeed: 1.2,
        vortexStrength: 2.0,
        viscosity: 0.95,
        returnSpeed: 1.5,
        turbulence: 1.4,
        dispersion: 0.9,
      },
      interaction: {
        radius: 220,
        strength: 1.6,
        mode: 'vortex',
      },
      relational: {
        enabled: true,
        mode: 'orbital',
        attractorCount: 3,
        attractorGravity: 1.4,
        orbitSpeed: 0.9,
        orbitRadius: 260,
        relationalSpin: 1.8,
        chaosFactor: 0.3,
        wanderSpeed: 0.8,
      },
      chaining: {
        enabled: true,
        chain: ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'],
        mode: 'loop',
        stepHoldDuration: 1.0,
        transitionDuration: 2.0,
        easing: 'kineticSnap',
        timingJitter: 0.15,
        disperseImpulse: 0.9,
        paused: false,
      },
      autoMorph: false,
    },
  },
  {
    id: 'cyberpunk_chroma',
    name: 'Cyberpunk Neon Wave',
    description: 'Electric cyan, hot pink and solar amber propagating in diagonal waves with kinetic velocity ignition',
    config: {
      glyph: ['Ω', '✦'],
      style: 'stipple',
      dotShape: 'circle',
      particleSize: { min: 1.5, max: 4.0 },
      colorMode: 'whiteOnBlack',
      color: {
        enabled: true,
        mode: 'linearGradient',
        primaryColor: '#00f0ff',
        secondaryColor: '#ff007f',
        accentColor: '#ffe600',
        cycleSpeed: 1.8,
        waveFrequency: 2.2,
        angle: 45,
        fieldCenterOffset: [0, 0],
        turbulenceModulation: 0.45,
        speedReactiveIntensity: 1.2,
        densityWeight: 0.6,
        hueShiftSpeed: 0.1,
        contrast: 1.2,
        paletteId: 'cyberpunk_neon',
      },
      fluid: {
        curlScale: 1.6,
        curlSpeed: 0.9,
        vortexStrength: 1.8,
        viscosity: 0.94,
        returnSpeed: 1.3,
        turbulence: 1.2,
        dispersion: 0.8,
      },
      interaction: {
        radius: 220,
        strength: 1.6,
        mode: 'vortex',
      },
      relational: {
        enabled: false,
      },
      autoMorph: true,
      autoMorphDuration: 3.8,
    },
  },
  {
    id: 'aurora_borealis_spectral',
    name: 'Aurora Borealis Spectral',
    description: 'Bioluminescent emerald and cyan curtains rippling with cymatic wave interference across runic chain',
    config: {
      style: 'stipple',
      dotShape: 'circle',
      particleSize: { min: 1.2, max: 3.6 },
      colorMode: 'whiteOnBlack',
      color: {
        enabled: true,
        mode: 'waveInterference',
        primaryColor: '#00ff87',
        secondaryColor: '#60efff',
        accentColor: '#bf55ec',
        cycleSpeed: 1.4,
        waveFrequency: 2.6,
        angle: 120,
        fieldCenterOffset: [0, -0.2],
        turbulenceModulation: 0.7,
        speedReactiveIntensity: 1.5,
        densityWeight: 0.4,
        hueShiftSpeed: 0.05,
        contrast: 1.1,
        paletteId: 'aurora_borealis',
      },
      chaining: {
        enabled: true,
        chain: ['᚛', '᚜', 'ᚠ', 'ᚢ', 'ᚦ', 'ᚨ'],
        mode: 'loop',
        stepHoldDuration: 1.0,
        transitionDuration: 2.0,
        easing: 'smoothstep',
        timingJitter: 0.1,
        disperseImpulse: 0.9,
        paused: false,
      },
      fluid: {
        curlScale: 2.0,
        curlSpeed: 1.0,
        vortexStrength: 2.0,
        viscosity: 0.94,
        returnSpeed: 1.1,
        turbulence: 1.4,
        dispersion: 0.85,
      },
      interaction: {
        radius: 200,
        strength: 1.4,
        mode: 'vortex',
      },
      relational: {
        enabled: false,
      },
      autoMorph: false,
    },
  },
  {
    id: 'solar_plasma_thermal',
    name: 'Solar Corona Thermal',
    description: 'Incandescent plasma with kinetic velocity ignition and convective rotational sweeps around orbital attractors',
    config: {
      glyph: ['☉', '☼'],
      style: 'stipple',
      dotShape: 'circle',
      particleSize: { min: 1.4, max: 4.2 },
      colorMode: 'whiteOnBlack',
      color: {
        enabled: true,
        mode: 'velocityThermal',
        primaryColor: '#ff2200',
        secondaryColor: '#ff8800',
        accentColor: '#ffffaa',
        cycleSpeed: 2.0,
        waveFrequency: 2.0,
        angle: 90,
        fieldCenterOffset: [0, 0],
        turbulenceModulation: 0.55,
        speedReactiveIntensity: 2.0,
        densityWeight: 0.7,
        hueShiftSpeed: 0.0,
        contrast: 1.3,
        paletteId: 'solar_plasma',
      },
      fluid: {
        curlScale: 2.2,
        curlSpeed: 1.3,
        vortexStrength: 2.4,
        viscosity: 0.95,
        returnSpeed: 1.2,
        turbulence: 1.8,
        dispersion: 1.1,
      },
      interaction: {
        radius: 250,
        strength: 2.0,
        mode: 'repel',
      },
      relational: {
        enabled: true,
        mode: 'orbital',
        attractorCount: 3,
        attractorGravity: 2.5,
        orbitSpeed: 1.4,
        orbitRadius: 260,
        relationalSpin: 2.0,
        chaosFactor: 0.3,
        wanderSpeed: 0.8,
      },
      autoMorph: true,
      autoMorphDuration: 3.5,
    },
  },
  {
    id: 'editorial_parchment_stipple',
    name: 'Editorial Parchment & Sumi Ink',
    description: 'Crisp warm parchment canvas with deep vermilion and sumi ink particles and subtle paper vignette',
    config: {
      glyph: ['字', '道'],
      style: 'stipple',
      dotShape: 'circle',
      particleSize: { min: 1.2, max: 3.8 },
      colorMode: 'blackOnWhite',
      backgroundColor: '#f5f0e6',
      backgroundMode: 'vignette',
      color: {
        enabled: true,
        mode: 'linearGradient',
        primaryColor: '#c0392b',
        secondaryColor: '#1c1917',
        accentColor: '#d35400',
        cycleSpeed: 0.8,
        waveFrequency: 1.5,
        angle: 60,
        fieldCenterOffset: [0, 0],
        turbulenceModulation: 0.3,
        speedReactiveIntensity: 0.6,
        densityWeight: 0.5,
        hueShiftSpeed: 0.0,
        contrast: 1.3,
        paletteId: 'editorial_vermilion',
        backgroundColor: '#f5f0e6',
        backgroundMode: 'vignette',
        backgroundGlowIntensity: 0.3,
      },
      fluid: {
        curlScale: 1.1,
        curlSpeed: 0.5,
        vortexStrength: 1.2,
        viscosity: 0.95,
        returnSpeed: 1.4,
        turbulence: 0.8,
        dispersion: 0.6,
      },
      interaction: {
        radius: 190,
        strength: 1.4,
        mode: 'repel',
      },
      autoMorph: true,
      autoMorphDuration: 3.5,
    },
  },
  {
    id: 'chakral_body_constellation',
    name: 'Chakral Body — 7 Subtle Centers Constellation',
    description: 'Spatial constellation of all 7 chakras positioned along the vertical spine with localized attractor vortices and spectral colors',
    config: {
      style: 'stipple',
      dotShape: 'circle',
      particleSize: { min: 1.2, max: 3.6 },
      colorMode: 'whiteOnBlack',
      fluid: {
        curlScale: 1.4,
        curlSpeed: 0.6,
        vortexStrength: 1.6,
        viscosity: 0.95,
        returnSpeed: 1.3,
        turbulence: 0.9,
        dispersion: 0.6,
      },
      spatialChakra: {
        enabled: true,
        playbackMode: 'simultaneousBody',
        glyphType: 'both',
        cycleDirection: 'ascent',
        holdDuration: 1.2,
        transitionDuration: 2.4,
        attractorInfluence: 1.8,
        particlePartitionSpread: 0.9,
        nodes: CANONICAL_CHAKRAS.map((c) => ({ ...c })),
      },
      color: {
        enabled: true,
        mode: 'linearGradient',
        primaryColor: '#ff1744',
        secondaryColor: '#00e676',
        accentColor: '#b388ff',
        cycleSpeed: 0.8,
        waveFrequency: 1.5,
        angle: 90,
        fieldCenterOffset: [0, 0],
        turbulenceModulation: 0.3,
        speedReactiveIntensity: 1.0,
        densityWeight: 0.5,
        hueShiftSpeed: 0.05,
        contrast: 1.2,
        backgroundColor: '#0a0515',
        backgroundMode: 'ambientGlow',
        backgroundGlowIntensity: 0.4,
      },
      autoMorph: false,
    },
  },
  {
    id: 'kundalini_spinal_ascent',
    name: 'Kundalini Ascent — Sequential Spine Transit',
    description: 'Energetic Kundalini ascent: particles dynamically morph both shape and spatial position climbing from root chakra to crown lotus',
    config: {
      style: 'stipple',
      dotShape: 'circle',
      particleSize: { min: 1.4, max: 4.0 },
      fluid: {
        curlScale: 1.8,
        curlSpeed: 0.9,
        vortexStrength: 2.2,
        viscosity: 0.94,
        returnSpeed: 1.4,
        turbulence: 1.2,
        dispersion: 0.8,
      },
      spatialChakra: {
        enabled: true,
        playbackMode: 'sequentialMorph',
        glyphType: 'both',
        cycleDirection: 'ascent',
        holdDuration: 1.4,
        transitionDuration: 2.6,
        attractorInfluence: 2.2,
        particlePartitionSpread: 0.85,
        nodes: CANONICAL_CHAKRAS.map((c) => ({ ...c })),
      },
      autoMorph: false,
    },
  },
  {
    id: 'cymatic_chladni_harmonics',
    name: 'Chladni Cymatics — Harmonic Attractor Spectrum',
    description: 'Chakra Mode 2: Continuous acoustic frequency spectrum with deterministic Chladni standing wave nodal attractors and in-between Faraday chaos',
    config: {
      style: 'stipple',
      dotShape: 'circle',
      particleSize: { min: 1.2, max: 3.4 },
      colorMode: 'whiteOnBlack',
      fluid: {
        curlScale: 1.2,
        curlSpeed: 0.5,
        vortexStrength: 1.2,
        viscosity: 0.96,
        returnSpeed: 1.5,
        turbulence: 0.8,
        dispersion: 0.5,
      },
      spatialChakra: {
        enabled: true,
        geometryMode: 'cymatics',
        playbackMode: 'sequentialMorph',
        glyphType: 'both',
        cycleDirection: 'ascent',
        plane: 'horizontal',
        cymatics: {
          plateGeometry: 'square',
          dimension: '2D',
          frequencyHz: 528,
          autoSweep: true,
          sweepSpeed: 10.0,
          chaosIntensity: 1.4,
          nodalAttraction: 3.0,
          dampingQFactor: 4.5,
        },
        nodes: CANONICAL_CHAKRAS.map((c) => ({ ...c })),
      },
      color: {
        enabled: true,
        mode: 'linearGradient',
        primaryColor: '#00f0ff',
        secondaryColor: '#bf55ec',
        accentColor: '#00ff87',
        cycleSpeed: 1.2,
        waveFrequency: 2.0,
        angle: 45,
        fieldCenterOffset: [0, 0],
        turbulenceModulation: 0.4,
        speedReactiveIntensity: 1.2,
        densityWeight: 0.6,
        hueShiftSpeed: 0.05,
        contrast: 1.3,
        backgroundColor: '#050814',
        backgroundMode: 'ambientGlow',
        backgroundGlowIntensity: 0.4,
      },
      autoMorph: false,
    },
  },
  {
    id: 'cymatic_volumetric_3d',
    name: 'Volumetric 3D Cymatic Standing Wave',
    description: 'Chakra Mode 2 (3D): Volumetric modal wave nodal surfaces forming spatial acoustic standing cages with frequency sweeping',
    config: {
      style: 'stipple',
      dotShape: 'circle',
      particleSize: { min: 1.4, max: 3.8 },
      colorMode: 'whiteOnBlack',
      fluid: {
        curlScale: 1.0,
        curlSpeed: 0.4,
        vortexStrength: 1.0,
        viscosity: 0.97,
        returnSpeed: 1.6,
        turbulence: 0.6,
        dispersion: 0.4,
      },
      spatialChakra: {
        enabled: true,
        geometryMode: 'cymatics',
        playbackMode: 'simultaneousBody',
        glyphType: 'both',
        cycleDirection: 'ascent',
        plane: 'horizontal',
        cymatics: {
          plateGeometry: 'volumetric3D',
          dimension: '3D',
          frequencyHz: 417,
          autoSweep: true,
          sweepSpeed: 12.0,
          chaosIntensity: 1.2,
          nodalAttraction: 3.2,
          dampingQFactor: 5.0,
        },
        nodes: CANONICAL_CHAKRAS.map((c) => ({ ...c })),
      },
      color: {
        enabled: true,
        mode: 'radialGradient',
        primaryColor: '#8a2be2',
        secondaryColor: '#00ffff',
        accentColor: '#ffffff',
        cycleSpeed: 0.8,
        waveFrequency: 1.8,
        angle: 0,
        fieldCenterOffset: [0, 0],
        turbulenceModulation: 0.3,
        speedReactiveIntensity: 1.0,
        densityWeight: 0.5,
        hueShiftSpeed: 0.02,
        contrast: 1.2,
        backgroundColor: '#090514',
        backgroundMode: 'vignette',
        backgroundGlowIntensity: 0.3,
      },
      autoMorph: false,
    },
  },
];

const GLYPH_PAIRS = [
  { label: 'O ⇄ I', val: ['O', 'I'] },
  { label: '✦ ⇄ ✧', val: ['✦', '✧'] },
  { label: 'ॐ ⇄ 🪷', val: ['ॐ', '🪷'] },
  { label: 'लं ⇄ ॐ', val: ['लं', 'ॐ'] },
  { label: 'यं ⇄ ॐ', val: ['यं', 'ॐ'] },
  { label: '☸ ⇄ ॐ', val: ['☸', 'ॐ'] },
  { label: '∞ ⇄ 8', val: ['∞', '8'] },
  { label: 'Ω ⇄ A', val: ['Ω', 'A'] },
  { label: '& ⇄ @', val: ['&', '@'] },
  { label: '∑ ⇄ ∫', val: ['∑', '∫'] },
  { label: 'S ⇄ Z', val: ['S', 'Z'] },
  { label: '⌘ ⇄ ⌥', val: ['⌘', '⌥'] },
];

const SPECIAL_CHAR_CATEGORIES = [
  {
    name: 'Chakra & Sacred Mantras',
    chars: ['ॐ', 'हं', 'यं', 'रं', 'वं', 'लं', '☸', '𑖌𑖼', '🪷', '✡', '🔻', '☽', '■', '👁️', '⚡', '☀️', '🌕', '🌟'],
  },
  {
    name: 'Cosmic & Occult',
    chars: ['✦', '✧', '★', '✶', '✹', '❂', '☽', '☾', '☉', '☯', '▲', '△', '◊'],
  },
  {
    name: 'Physics & Math',
    chars: ['∞', '≈', '≠', '∑', '∏', '∫', '√', '∂', '∇', 'λ', '±', '÷', '×'],
  },
  {
    name: 'Classical Greek',
    chars: ['Ω', 'α', 'β', 'γ', 'δ', 'π', 'φ', 'ψ', 'θ', 'ξ', 'Σ', 'Φ'],
  },
  {
    name: 'Typography & Symbols',
    chars: ['§', '¶', '†', '‡', '⌘', '⌥', '⎈', '⏣', '❦', '♠', '♥', '♦', '♣'],
  },
];

const STORAGE_KEY = 'typographic_pointcloud_saved_states';

export default function App() {
  const compRef = useRef<PointCloudComponentRef | null>(null);
  const [engine, setEngine] = useState<PointCloudField | null>(null);

  // Configuration state
  const [config, setConfig] = useState<PointCloudConfig>(() => {
    return { ...DEFAULT_CONFIG };
  });

  // UI Visibility State (Zen Mode)
  const [isUIHidden, setIsUIHidden] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  // UI States
  const [activePreset, setActivePreset] = useState<string>('reference_oi');
  const [glyphInputA, setGlyphInputA] = useState<string>('O');
  const [glyphInputB, setGlyphInputB] = useState<string>('I');
  const [freeTextWord, setFreeTextWord] = useState<string>('');
  const [focusedGlyphSlot, setFocusedGlyphSlot] = useState<'A' | 'B'>('A');

  const [showInspector, setShowInspector] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.location.search.includes('debug=true');
  });
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);
  const [showControlsDrawer, setShowControlsDrawer] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'presets' | 'chakra' | 'color' | 'chaining' | 'relational' | 'fluid' | 'particle' | 'interaction' | 'saved'>('presets');
  const [chainTimelineState, setChainTimelineState] = useState<ChainTimelineState | null>(null);
  const [chakraTimelineState, setChakraTimelineState] = useState<SpatialChakraTimelineState | null>(null);
  const [cameraState, setCameraState] = useState<CameraOrbState | null>(null);

  // Saved States system
  const [savedStates, setSavedStates] = useState<SavedState[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load saved states:', e);
    }
    return [];
  });
  const [newSaveName, setNewSaveName] = useState<string>('');
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);

  // Sync inputs with config.glyph
  useEffect(() => {
    if (Array.isArray(config.glyph)) {
      setGlyphInputA(config.glyph[0] || 'O');
      setGlyphInputB(config.glyph[1] || 'I');
    } else if (typeof config.glyph === 'string') {
      setGlyphInputA(config.glyph);
      setGlyphInputB(config.glyph);
    }
  }, [config.glyph]);

  // Keyboard shortcut listener for Zen / Hide UI (Key H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) {
        return;
      }

      if (e.key === 'h' || e.key === 'H') {
        setIsUIHidden((prev) => {
          const next = !prev;
          if (next) {
            triggerToast("UI hidden. Press 'H' or double-click anywhere to show.");
          } else {
            triggerToast('UI restored.');
          }
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => {
      setShowToast((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  // Save states to localStorage
  const persistSavedStates = (states: SavedState[]) => {
    setSavedStates(states);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
    } catch (e) {
      console.error('Failed to persist states:', e);
    }
  };

  const handleSaveCurrentState = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSaveName.trim() || `Config ${new Date().toLocaleTimeString()}`;
    const newState: SavedState = {
      id: 'state_' + Date.now(),
      name,
      timestamp: Date.now(),
      config: JSON.parse(JSON.stringify(config)),
    };
    const updated = [newState, ...savedStates];
    persistSavedStates(updated);
    setNewSaveName('');
    triggerToast(`Saved state "${name}" successfully!`);
  };

  const handleLoadState = (state: SavedState) => {
    setConfig(state.config);
    triggerToast(`Loaded state "${state.name}"`);
  };

  const handleDeleteState = (id: string, name: string) => {
    const filtered = savedStates.filter((s) => s.id !== id);
    persistSavedStates(filtered);
    triggerToast(`Deleted state "${name}"`);
  };

  const handleExportStateJson = (state: SavedState) => {
    const json = JSON.stringify(state.config, null, 2);
    navigator.clipboard.writeText(json);
    setCopiedNotification(state.id);
    setTimeout(() => setCopiedNotification(null), 2000);
    triggerToast(`Exported "${state.name}" JSON to clipboard!`);
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importJsonText.trim());
      if (typeof parsed !== 'object' || !parsed.glyph) {
        throw new Error('Invalid PointCloudConfig JSON');
      }
      setConfig((prev) => ({
        ...prev,
        ...parsed,
        particleSize: { ...prev.particleSize, ...(parsed.particleSize || {}) },
        fluid: { ...prev.fluid, ...(parsed.fluid || {}) },
        interaction: { ...prev.interaction, ...(parsed.interaction || {}) },
        relational: { ...prev.relational, ...(parsed.relational || {}) },
        chaining: {
          ...(prev.chaining || DEFAULT_CONFIG.chaining!),
          ...(parsed.chaining || {}),
        },
      }));
      setShowImportModal(false);
      setImportJsonText('');
      triggerToast('Imported and applied configuration successfully!');
    } catch (err: any) {
      alert('Error parsing JSON configuration: ' + err.message);
    }
  };

  // Listen to engine ready
  const handleEngineReady = (inst: PointCloudField) => {
    setEngine(inst);
  };

  // Switch preset
  const applyPreset = (preset: Preset) => {
    setActivePreset(preset.id);
    setConfig((prev) => ({
      ...prev,
      ...preset.config,
      particleSize: { ...prev.particleSize, ...preset.config.particleSize },
      fluid: { ...prev.fluid, ...preset.config.fluid },
      interaction: { ...prev.interaction, ...preset.config.interaction },
      relational: { ...prev.relational, ...preset.config.relational },
      chaining: {
        ...(prev.chaining || DEFAULT_CONFIG.chaining!),
        ...(preset.config.chaining || {}),
      },
    }));
  };

  // Toggle color mode
  const toggleColorMode = () => {
    setConfig((prev) => {
      const nextMode = prev.colorMode === 'blackOnWhite' ? 'whiteOnBlack' : 'blackOnWhite';
      const nextBg = nextMode === 'blackOnWhite' ? '#fafaf9' : '#09090b';
      return {
        ...prev,
        colorMode: nextMode,
        backgroundColor: nextBg,
        color: {
          ...(prev.color || DEFAULT_COLOR_CONFIG),
          backgroundColor: nextBg,
        },
      };
    });
  };

  // Toggle style
  const toggleStyle = () => {
    setConfig((prev) => ({
      ...prev,
      style: prev.style === 'stipple' ? 'halftone' : 'stipple',
    }));
  };

  // Toggle dot shape
  const toggleDotShape = () => {
    setConfig((prev) => ({
      ...prev,
      dotShape: prev.dotShape === 'circle' ? 'square' : 'circle',
    }));
  };

  // Apply custom glyph pair
  const applyGlyphPair = (a: string, b: string) => {
    const finalA = a.trim() || 'O';
    const finalB = b.trim() || finalA;
    setConfig((prev) => ({
      ...prev,
      glyph: [finalA, finalB],
    }));
  };

  // Insert special character into currently focused slot
  const handleInsertChar = (char: string) => {
    if (focusedGlyphSlot === 'A') {
      setGlyphInputA(char);
      applyGlyphPair(char, glyphInputB);
    } else {
      setGlyphInputB(char);
      applyGlyphPair(glyphInputA, char);
    }
  };

  // Apply free text word/phrase
  const handleBakeFreeText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!freeTextWord.trim()) return;
    const text = freeTextWord.trim();
    setConfig((prev) => ({
      ...prev,
      glyph: [text, text],
    }));
    triggerToast(`Baking point cloud glyph for "${text}"`);
  };

  const activeBgColor =
    config.backgroundColor ||
    config.color?.backgroundColor ||
    (config.colorMode === 'blackOnWhite' ? '#fafaf9' : '#09090b');

  const isLight = isLightHex(activeBgColor);

  // Derived glyph display names
  const glyphDisplay = useMemo(() => {
    if (Array.isArray(config.glyph)) {
      return `${config.glyph[0]} ⇄ ${config.glyph[1]}`;
    }
    return String(config.glyph);
  }, [config.glyph]);

  return (
    <div
      id="app-container"
      onDoubleClick={(e) => {
        // Double click anywhere restores UI if hidden
        if (isUIHidden) {
          setIsUIHidden(false);
          triggerToast('UI restored');
        }
      }}
      className={`relative w-screen h-screen overflow-hidden font-sans transition-colors duration-500 select-none ${
        isLight ? 'text-[#1c1917]' : 'text-[#f4f4f5]'
      }`}
      style={{
        backgroundColor: activeBgColor,
        transition: 'background-color 0.4s ease-out',
      }}
    >
      {/* 1. Fullscreen WebGL Point Cloud Engine Canvas */}
      <PointCloudComponent
        ref={compRef}
        {...config}
        onEngineReady={handleEngineReady}
        onChainUpdate={setChainTimelineState}
        onChakraUpdate={setChakraTimelineState}
        onCameraChange={setCameraState}
        positioning="absolute"
        className="w-full h-full inset-0 z-0"
      />

      {/* 3D Camera Gimbal & Orbit Control */}
      {config.spatialChakra?.enabled && (
        <CameraOrbControl
          cameraState={cameraState}
          onSetOrbit={(pitch, yaw) => compRef.current?.setCameraOrbit(pitch, yaw)}
          onSetPan={(panX, panY) => compRef.current?.setCameraPan(panX, panY)}
          onSetZoom={(zoom) => compRef.current?.setCameraZoom(zoom)}
          onReset={(preset) => compRef.current?.resetCamera(preset)}
          isLight={isLight}
          isUIHidden={isUIHidden}
        />
      )}

      {/* Discreet Toast Notification */}
      {showToast && (
        <div
          id="status-toast"
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full font-mono text-xs shadow-xl border pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
            isLight
              ? 'bg-white/95 text-stone-900 border-stone-300 shadow-stone-400/20'
              : 'bg-zinc-900/95 text-zinc-100 border-zinc-700 shadow-black/40'
          }`}
        >
          {showToast}
        </div>
      )}

      {/* Floating Restore UI Pill (When UI is Hidden) */}
      {isUIHidden && (
        <div className="fixed top-4 right-4 z-40 pointer-events-auto">
          <button
            id="restore-ui-btn"
            onClick={() => {
              setIsUIHidden(false);
              triggerToast('UI restored');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono rounded-full border backdrop-blur-md shadow-lg transition-all hover:scale-105 ${
              isLight
                ? 'bg-white/80 border-stone-300 text-stone-800 hover:bg-white'
                : 'bg-zinc-900/80 border-zinc-700 text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-500" />
            <span>Show UI (H)</span>
          </button>
        </div>
      )}

      {/* 2. Top Header Overlay (Hideable) */}
      <header
        id="app-header"
        className={`absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4 pointer-events-none transition-all duration-500 ${
          isUIHidden ? '-translate-y-24 opacity-0' : 'translate-y-0 opacity-100'
        }`}
      >
        <div className="flex items-center gap-4 pointer-events-auto">
          <div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full animate-pulse ${
                  isLight ? 'bg-black' : 'bg-white'
                }`}
              />
              <h1 className="text-xs tracking-[0.2em] font-mono uppercase font-bold">
                Fluid Dynamic Typographic Point-Cloud
              </h1>
            </div>
            <p className="text-[11px] font-mono opacity-50 tracking-wider mt-0.5">
              262,144 PARTICLES · GPGPU PING-PONG FBO · DYNAMIC ATTRACTORS & RELATIONAL FORCES
            </p>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Quick Glyph Pair Pills */}
          <div
            className={`hidden lg:flex items-center rounded-lg p-1 border ${
              isLight
                ? 'bg-white/80 border-stone-200 shadow-sm backdrop-blur-md'
                : 'bg-zinc-900/80 border-zinc-800 shadow-sm backdrop-blur-md'
            }`}
          >
            {GLYPH_PAIRS.map((pair) => {
              const isSelected =
                Array.isArray(config.glyph) &&
                config.glyph[0] === pair.val[0] &&
                config.glyph[1] === pair.val[1];
              return (
                <button
                  key={pair.label}
                  id={`glyph-pair-${pair.val[0]}-${pair.val[1]}`}
                  onClick={() => setConfig((prev) => ({ ...prev, glyph: pair.val }))}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-all ${
                    isSelected
                      ? isLight
                        ? 'bg-stone-900 text-white font-medium shadow-xs'
                        : 'bg-white text-zinc-950 font-medium shadow-xs'
                      : isLight
                      ? 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {pair.label}
                </button>
              );
            })}
          </div>

          {/* Relational Orbits Active Badge / Quick Toggle */}
          <button
            id="quick-toggle-relational-btn"
            onClick={() =>
              setConfig((prev) => ({
                ...prev,
                relational: {
                  ...prev.relational,
                  enabled: !prev.relational?.enabled,
                },
              }))
            }
            title={
              config.relational?.enabled
                ? 'Free Relational System: ACTIVE (Click to Disable)'
                : 'Free Relational System: OFF (Click to Enable multi-pole orbits)'
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded-lg border transition-all ${
              config.relational?.enabled
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500 font-semibold shadow-xs'
                : isLight
                ? 'bg-white/80 border-stone-200 text-stone-600 hover:bg-stone-100 shadow-xs'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-800 shadow-xs'
            }`}
          >
            <Orbit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {config.relational?.enabled ? 'Relational ON' : 'Relational'}
            </span>
          </button>

          {/* Chaining Mode Active Badge / Quick Toggle */}
          <button
            id="quick-toggle-chaining-btn"
            onClick={() =>
              setConfig((prev) => ({
                ...prev,
                chaining: {
                  ...(prev.chaining || DEFAULT_CONFIG.chaining!),
                  enabled: !prev.chaining?.enabled,
                },
              }))
            }
            title={
              config.chaining?.enabled
                ? 'Chaining Mode: ACTIVE (Click to Disable)'
                : 'Chaining Mode: OFF (Click to Enable multi-glyph sequence chaining)'
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded-lg border transition-all ${
              config.chaining?.enabled
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500 font-semibold shadow-xs'
                : isLight
                ? 'bg-white/80 border-stone-200 text-stone-600 hover:bg-stone-100 shadow-xs'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-800 shadow-xs'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {config.chaining?.enabled ? 'Chaining ON' : 'Chaining'}
            </span>
          </button>

          {/* Quick Chakra Body Toggle */}
          <button
            id="quick-toggle-chakra-btn"
            onClick={() => {
              const willEnable = !config.spatialChakra?.enabled;
              setConfig((prev) => ({
                ...prev,
                spatialChakra: {
                  ...(prev.spatialChakra || createDefaultChakraConfig()),
                  enabled: willEnable,
                },
              }));
              if (willEnable) {
                setActiveTab('chakra');
                setShowControlsDrawer(true);
              }
            }}
            title={
              config.spatialChakra?.enabled
                ? 'Chakral Body System: ACTIVE (Click to Disable)'
                : 'Chakral Body System: OFF (Click to Enable 7-Center Spatial Morphing)'
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded-lg border transition-all ${
              config.spatialChakra?.enabled
                ? 'bg-purple-500/20 border-purple-500/60 text-purple-400 font-semibold shadow-xs'
                : isLight
                ? 'bg-white/80 border-stone-200 text-stone-600 hover:bg-stone-100 shadow-xs'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-800 shadow-xs'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">
              {config.spatialChakra?.enabled ? 'Chakra ON' : 'Chakra'}
            </span>
          </button>

          {/* Quick Color System Toggle */}
          <button
            id="quick-toggle-color-btn"
            onClick={() => {
              const willEnable = !config.color?.enabled;
              setConfig((prev) => ({
                ...prev,
                color: {
                  ...(prev.color || DEFAULT_COLOR_CONFIG),
                  enabled: willEnable,
                },
              }));
              if (willEnable) {
                setActiveTab('color');
                setShowControlsDrawer(true);
              }
            }}
            title={
              config.color?.enabled
                ? 'Color System: ACTIVE (Click to toggle)'
                : 'Color System: OFF (Click to enable full procedural color field)'
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded-lg border transition-all ${
              config.color?.enabled
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500 font-semibold shadow-xs'
                : isLight
                ? 'bg-white/80 border-stone-200 text-stone-600 hover:bg-stone-100 shadow-xs'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-800 shadow-xs'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {config.color?.enabled ? 'Color ON' : 'Color'}
            </span>
          </button>

          {/* Style Mode Toggle */}
          <button
            id="toggle-style-btn"
            onClick={toggleStyle}
            title="Toggle between Stochastic Stipple & Ordered Halftone"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded-lg border transition-all ${
              isLight
                ? 'bg-white/80 border-stone-200 text-stone-800 hover:bg-stone-100 shadow-xs backdrop-blur-md'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-200 hover:bg-zinc-800 shadow-xs backdrop-blur-md'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{config.style === 'stipple' ? 'Stipple' : 'Halftone'}</span>
          </button>

          {/* Dot Shape Toggle */}
          <button
            id="toggle-dot-shape-btn"
            onClick={toggleDotShape}
            title="Toggle between Circular & Square dot shape"
            className={`p-2 text-xs rounded-lg border transition-all ${
              isLight
                ? 'bg-white/80 border-stone-200 text-stone-800 hover:bg-stone-100 shadow-xs backdrop-blur-md'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-200 hover:bg-zinc-800 shadow-xs backdrop-blur-md'
            }`}
          >
            {config.dotShape === 'square' ? (
              <Square className="w-3.5 h-3.5" />
            ) : (
              <Circle className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Color Mode Toggle */}
          <button
            id="toggle-color-mode-btn"
            onClick={toggleColorMode}
            title={isLight ? 'Switch to Dark Mode (#09090b)' : 'Switch to Light Mode (#fafaf9)'}
            className={`p-2 text-xs rounded-lg border transition-all ${
              isLight
                ? 'bg-white/80 border-stone-200 text-stone-800 hover:bg-stone-100 shadow-xs backdrop-blur-md'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-200 hover:bg-zinc-800 shadow-xs backdrop-blur-md'
            }`}
          >
            {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          </button>

          {/* Quick Canvas Atmosphere Indicator & Shortcut */}
          <button
            id="quick-canvas-bg-btn"
            onClick={() => {
              setActiveTab('color');
              setShowControlsDrawer(true);
            }}
            title={`Canvas Atmosphere: ${activeBgColor} (${config.backgroundMode || 'ambientGlow'}) - Click to customize atmosphere & back-light`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono uppercase rounded-lg border transition-all ${
              isLight
                ? 'bg-white/80 border-stone-200 text-stone-700 hover:bg-stone-100 shadow-xs backdrop-blur-md'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800 shadow-xs backdrop-blur-md'
            }`}
          >
            <span
              className="w-3 h-3 rounded-full border border-black/20 dark:border-white/30 shrink-0 shadow-xs"
              style={{ backgroundColor: activeBgColor }}
            />
            <span className="hidden md:inline text-[10px]">
              {config.backgroundMode === 'ambientGlow'
                ? 'Glow'
                : config.backgroundMode === 'vignette'
                ? 'Vignette'
                : config.backgroundMode === 'adaptive'
                ? 'Adaptive'
                : 'Solid'}
            </span>
          </button>

          {/* Vortex Dispersion Burst */}
          <button
            id="trigger-burst-btn"
            onClick={() => compRef.current?.triggerDisperse(3.8)}
            title="Trigger Fluid Vortex Burst"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded-lg border transition-all ${
              isLight
                ? 'bg-stone-900 text-white border-stone-900 hover:bg-black shadow-xs'
                : 'bg-zinc-100 text-zinc-950 border-white hover:bg-white shadow-xs'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Disperse</span>
          </button>

          {/* Zen Mode / Hide UI Button */}
          <button
            id="toggle-hide-ui-btn"
            onClick={() => {
              setIsUIHidden(true);
              triggerToast("UI hidden. Press 'H' or double-click anywhere to show.");
            }}
            title="Hide UI / Zen Mode (Press 'H')"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase rounded-lg border transition-all ${
              isLight
                ? 'bg-white/80 border-stone-200 text-stone-800 hover:bg-stone-100 shadow-xs backdrop-blur-md'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-200 hover:bg-zinc-800 shadow-xs backdrop-blur-md'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Hide UI (H)</span>
          </button>

          {/* Tweakpane Inspector Toggle */}
          <button
            id="toggle-inspector-btn"
            onClick={() => setShowInspector(!showInspector)}
            title="Toggle GPGPU Tweakpane Inspector"
            className={`p-2 text-xs rounded-lg border transition-all ${
              showInspector
                ? isLight
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-zinc-950 border-white'
                : isLight
                ? 'bg-white/80 border-stone-200 text-stone-800 hover:bg-stone-100 shadow-xs backdrop-blur-md'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-200 hover:bg-zinc-800 shadow-xs backdrop-blur-md'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* Architecture & Code Modal */}
          <button
            id="show-code-btn"
            onClick={() => setShowCodeModal(true)}
            title="View Architecture & Integration Code"
            className={`p-2 text-xs rounded-lg border transition-all ${
              isLight
                ? 'bg-white/80 border-stone-200 text-stone-800 hover:bg-stone-100 shadow-xs backdrop-blur-md'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-200 hover:bg-zinc-800 shadow-xs backdrop-blur-md'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 3. Center Screen Pointer Interaction Hint (Hideable) */}
      <div
        className={`absolute inset-0 pointer-events-none flex flex-col justify-end pb-8 items-center transition-opacity duration-300 ${
          isUIHidden ? 'opacity-0' : 'opacity-25 hover:opacity-75'
        }`}
      >
        <p className="text-[10px] font-mono tracking-widest uppercase">
          MOVE CURSOR / DRAG TOUCH TO INJECT FLUID VELOCITY · PRESS 'H' TO TOGGLE CLEAN CANVAS
        </p>
      </div>

      {/* 4. Bottom-Right Control Panel (Hideable, Compact & Corner-Anchored) */}
      <div
        id="bottom-control-drawer"
        className={`fixed bottom-3 right-3 z-30 w-80 sm:w-[355px] max-w-[calc(100vw-1.5rem)] pointer-events-auto transition-all duration-300 ${
          isUIHidden ? 'translate-y-40 translate-x-12 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
        <div
          className={`rounded-xl border backdrop-blur-xl shadow-2xl transition-all overflow-hidden ${
            isLight ? 'bg-white/95 border-stone-200 shadow-stone-400/25' : 'bg-zinc-900/95 border-zinc-800 shadow-black/60'
          }`}
        >
          {/* Panel Top Navigation Bar */}
          <div
            className={`flex items-center justify-between px-2.5 py-1.5 border-b gap-1.5 ${
              isLight ? 'border-stone-200 bg-stone-50/50' : 'border-zinc-800 bg-zinc-950/40'
            }`}
          >
            {/* Tab Switches (Compact & Scrollable) */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar flex-1 mr-1">
              {[
                { id: 'presets', label: 'Presets', icon: Sparkles },
                { id: 'chakra', label: 'Chakra', icon: Flame, badge: config.spatialChakra?.enabled },
                { id: 'color', label: 'Color', icon: Palette, badge: config.color?.enabled },
                { id: 'chaining', label: 'Chaining', icon: Link2, badge: config.chaining?.enabled },
                { id: 'relational', label: 'Relational', icon: Orbit, badge: config.relational?.enabled },
                { id: 'fluid', label: 'Fluid', icon: Wind },
                { id: 'particle', label: 'Particles', icon: Circle },
                { id: 'interaction', label: 'Pointer', icon: Compass },
                { id: 'saved', label: 'Saved', icon: Bookmark },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`tab-${tab.id}`}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setShowControlsDrawer(true);
                    }}
                    className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono uppercase rounded-md whitespace-nowrap transition-all ${
                      isActive
                        ? isLight
                          ? 'bg-stone-900 text-white font-semibold shadow-xs'
                          : 'bg-white text-zinc-950 font-semibold shadow-xs'
                        : isLight
                        ? 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-2.5 h-2.5" />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block ml-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions: Auto-Morph & Collapse Chevron */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                id="toggle-auto-morph-btn"
                onClick={() =>
                  setConfig((prev) => ({ ...prev, autoMorph: !prev.autoMorph }))
                }
                className={`p-1 px-1.5 rounded-md border text-[10px] font-mono flex items-center gap-1 transition-all ${
                  config.autoMorph
                    ? isLight
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-zinc-950 border-white'
                    : isLight
                    ? 'border-stone-200 text-stone-600 hover:bg-stone-100'
                    : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                }`}
                title={config.autoMorph ? 'Pause Morphing' : 'Start Auto-Morph'}
              >
                {config.autoMorph ? (
                  <Pause className="w-2.5 h-2.5 text-emerald-400" />
                ) : (
                  <Play className="w-2.5 h-2.5" />
                )}
                <span className="text-[9px]">Morph</span>
              </button>

              <button
                id="toggle-drawer-btn"
                onClick={() => setShowControlsDrawer(!showControlsDrawer)}
                title={showControlsDrawer ? 'Minimize controls' : 'Expand controls'}
                className={`p-1 rounded-md text-xs opacity-70 hover:opacity-100 transition-opacity`}
              >
                {showControlsDrawer ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Glyphs & Symbols Compact Ribbon */}
          <div
            className={`px-2.5 py-1.5 border-b flex flex-col gap-1.5 text-[10px] font-mono ${
              isLight ? 'bg-stone-50/40 border-stone-200' : 'bg-zinc-950/30 border-zinc-800'
            }`}
          >
            {/* Row 1: Active Glyph Slots & Free Word Baker */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1 shrink-0">
                <span className="opacity-50 text-[9px] uppercase">Glyphs:</span>
                <input
                  id="glyph-slot-a-input"
                  type="text"
                  value={glyphInputA}
                  onFocus={() => setFocusedGlyphSlot('A')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGlyphInputA(val);
                    applyGlyphPair(val, glyphInputB);
                  }}
                  placeholder="A"
                  title="Glyph / Word A (Click to type or pick a symbol below)"
                  className={`w-9 px-1 py-0.5 text-center font-mono rounded border font-bold text-[11px] outline-none transition-all ${
                    focusedGlyphSlot === 'A' ? 'ring-1 ring-emerald-500 border-emerald-500' : ''
                  } ${
                    isLight
                      ? 'bg-white border-stone-300 text-stone-900'
                      : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
                <span className="opacity-40 text-[9px]">⇄</span>
                <input
                  id="glyph-slot-b-input"
                  type="text"
                  value={glyphInputB}
                  onFocus={() => setFocusedGlyphSlot('B')}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGlyphInputB(val);
                    applyGlyphPair(glyphInputA, val);
                  }}
                  placeholder="B"
                  title="Glyph / Word B (Click to type or pick a symbol below)"
                  className={`w-9 px-1 py-0.5 text-center font-mono rounded border font-bold text-[11px] outline-none transition-all ${
                    focusedGlyphSlot === 'B' ? 'ring-1 ring-emerald-500 border-emerald-500' : ''
                  } ${
                    isLight
                      ? 'bg-white border-stone-300 text-stone-900'
                      : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
              </div>

              {/* Free Text Word / Phrase Form */}
              <form onSubmit={handleBakeFreeText} className="flex items-center gap-1 flex-1 justify-end">
                <input
                  id="free-text-input"
                  type="text"
                  value={freeTextWord}
                  onChange={(e) => setFreeTextWord(e.target.value)}
                  placeholder="Bake word/phrase..."
                  className={`w-28 sm:w-32 px-1.5 py-0.5 text-[10px] font-mono rounded border outline-none ${
                    isLight
                      ? 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400'
                      : 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500'
                  }`}
                />
                <button
                  id="bake-free-text-btn"
                  type="submit"
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all ${
                    isLight
                      ? 'bg-stone-900 text-white hover:bg-black'
                      : 'bg-white text-zinc-950 hover:bg-zinc-200'
                  }`}
                >
                  Bake
                </button>
              </form>
            </div>

            {/* Row 2: Special Characters Quick Palette */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              <span className="opacity-40 text-[9px] uppercase tracking-wider shrink-0">
                [{focusedGlyphSlot}]:
              </span>
              {['✦', '✧', '★', '∞', 'Ω', '∑', '∫', '⌘', '⌥', '⏣', '☯', '♠', 'λ', '§', '¶'].map(
                (char) => (
                  <button
                    key={char}
                    id={`quick-char-${char}`}
                    type="button"
                    onClick={() => handleInsertChar(char)}
                    title={`Insert "${char}" into Glyph Slot ${focusedGlyphSlot}`}
                    className={`w-5 h-5 shrink-0 flex items-center justify-center rounded border text-[10px] transition-all hover:scale-110 ${
                      isLight
                        ? 'bg-white border-stone-200 text-stone-800 hover:border-stone-400'
                        : 'bg-zinc-800/80 border-zinc-700 text-zinc-200 hover:border-zinc-500'
                    }`}
                  >
                    {char}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Drawer Body (Expandable & Highly Compact) */}
          {showControlsDrawer && (
            <div className="p-2.5 max-h-[34vh] overflow-y-auto">
              {/* Tab 1: Presets Showcase */}
              {activeTab === 'presets' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESETS.map((preset) => {
                      const isSelected = activePreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          id={`preset-card-${preset.id}`}
                          onClick={() => applyPreset(preset)}
                          className={`text-left p-2 rounded-lg border transition-all ${
                            isSelected
                              ? isLight
                                ? 'bg-stone-100 border-stone-900/80 ring-1 ring-stone-900/20 shadow-xs'
                                : 'bg-zinc-800 border-white/80 ring-1 ring-white/20 shadow-xs'
                              : isLight
                              ? 'bg-stone-50/60 border-stone-200/80 hover:bg-stone-100 hover:border-stone-300'
                              : 'bg-zinc-950/60 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-mono font-bold tracking-tight truncate">
                              {preset.name}
                            </span>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 ml-1" />
                            )}
                          </div>
                          <p className="text-[9px] opacity-70 leading-tight line-clamp-1">
                            {preset.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Special Characters Categories Drawer */}
                  <div className="pt-2 border-t border-inherit">
                    <span className="text-[9px] font-mono font-bold block mb-1 opacity-70 uppercase tracking-wider">
                      Extended Characters Library:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {SPECIAL_CHAR_CATEGORIES.map((cat) => (
                        <div
                          key={cat.name}
                          className={`p-1.5 rounded-lg border ${
                            isLight
                              ? 'bg-stone-50/70 border-stone-200'
                              : 'bg-zinc-950/50 border-zinc-800'
                          }`}
                        >
                          <span className="text-[8.5px] font-mono font-semibold uppercase opacity-60 block mb-1">
                            {cat.name}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {cat.chars.map((c) => (
                              <button
                                key={c}
                                id={`cat-char-${c}`}
                                type="button"
                                onClick={() => handleInsertChar(c)}
                                title={`Insert "${c}" into Slot ${focusedGlyphSlot}`}
                                className={`w-5 h-5 flex items-center justify-center rounded border text-[10px] font-mono transition-all hover:scale-110 ${
                                  isLight
                                    ? 'bg-white border-stone-200 text-stone-900 hover:border-stone-900'
                                    : 'bg-zinc-900 border-zinc-700 text-white hover:border-white'
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Spatial Chakral Body & Kundalini Transit */}
              {activeTab === 'chakra' && (
                <ChakraPanel
                  config={config}
                  setConfig={setConfig}
                  timelineState={chakraTimelineState}
                  onJumpToNode={(idx) => compRef.current?.jumpToChakraNode(idx)}
                  onStepNode={(dir) => compRef.current?.stepChakra(dir)}
                  isLight={isLight}
                />
              )}

              {/* Tab: Full Procedural Color System */}
              {activeTab === 'color' && (
                <ColorSystemPanel
                  config={config}
                  setConfig={setConfig}
                  isLight={isLight}
                />
              )}

              {/* Tab: Chaining Mode & Multi-Glyph Sequence */}
              {activeTab === 'chaining' && (
                <ChainingPanel
                  config={config}
                  setConfig={setConfig}
                  timelineState={chainTimelineState}
                  onJumpToLink={(idx) => compRef.current?.jumpToChainLink(idx)}
                  onStepChain={(dir) => compRef.current?.stepChain(dir)}
                  onTogglePause={() => {
                    const nextPaused = !config.chaining?.paused;
                    setConfig((prev) => ({
                      ...prev,
                      chaining: {
                        ...(prev.chaining || DEFAULT_CONFIG.chaining!),
                        paused: nextPaused,
                      },
                    }));
                    compRef.current?.setChainPaused(nextPaused);
                  }}
                  onScrubProgress={(p) => compRef.current?.scrubChainProgress(p)}
                  onTriggerDisperse={(s) => compRef.current?.triggerDisperse(s)}
                  isLight={isLight}
                />
              )}

              {/* Tab 2: Free Relational System & Attractors */}
              {activeTab === 'relational' && (
                <div className="space-y-2">
                  {/* Master Toggle & Mode Picker */}
                  <div
                    className={`flex flex-col gap-1.5 p-2 rounded-lg border ${
                      isLight ? 'bg-stone-50 border-stone-200' : 'bg-zinc-950 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        id="relational-master-toggle"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            relational: {
                              ...prev.relational,
                              enabled: !prev.relational?.enabled,
                            },
                          }))
                        }
                        className={`px-2 py-0.5 text-[9.5px] font-mono uppercase rounded border font-bold transition-all flex items-center gap-1.5 ${
                          config.relational?.enabled
                            ? 'bg-emerald-500 text-black border-emerald-500 shadow-xs'
                            : isLight
                            ? 'bg-stone-200 border-stone-300 text-stone-700'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <Orbit className="w-3 h-3" />
                        {config.relational?.enabled ? 'Relational ON' : 'Relational OFF'}
                      </button>

                      <div className="flex items-center gap-1">
                        {[
                          { id: 'orbital', label: 'Orbital' },
                          { id: 'chaos', label: 'Chaos' },
                          { id: 'nbody', label: 'N-Body' },
                        ].map((m) => (
                          <button
                            key={m.id}
                            id={`relational-mode-${m.id}`}
                            onClick={() =>
                              setConfig((prev) => ({
                                ...prev,
                                relational: {
                                  ...prev.relational,
                                  mode: m.id as any,
                                },
                              }))
                            }
                            className={`px-1.5 py-0.5 text-[9px] font-mono uppercase rounded border transition-all ${
                              config.relational?.mode === m.id
                                ? isLight
                                  ? 'bg-stone-900 text-white border-stone-900 font-medium'
                                  : 'bg-white text-zinc-950 border-white font-medium'
                                : isLight
                                ? 'border-stone-200 text-stone-700 hover:bg-stone-100'
                                : 'border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Relational Parameters Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Attractor Count */}
                    <div>
                      <div className="flex justify-between items-center text-[9.5px] font-mono mb-0.5">
                        <span className="opacity-80">Attractor Poles</span>
                        <EditableNumber
                          value={config.relational?.attractorCount ?? 3}
                          precision={0}
                          isLight={isLight}
                          className="text-[9.5px]"
                          onChange={(val) =>
                            setConfig((prev) => ({
                              ...prev,
                              relational: {
                                ...prev.relational,
                                attractorCount: Math.round(Math.max(1, Math.min(6, val))),
                              },
                            }))
                          }
                        />
                      </div>
                      <input
                        id="slider-attractor-count"
                        type="range"
                        min={1}
                        max={6}
                        step={1}
                        value={config.relational?.attractorCount ?? 3}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            relational: {
                              ...prev.relational,
                              attractorCount: parseInt(e.target.value, 10),
                            },
                          }))
                        }
                        className="w-full accent-current cursor-pointer"
                      />
                    </div>

                    {/* Attractor Gravity */}
                    <div>
                      <div className="flex justify-between items-center text-[9.5px] font-mono mb-0.5">
                        <span className="opacity-80">Gravity</span>
                        <EditableNumber
                          value={config.relational?.attractorGravity ?? 1.6}
                          precision={2}
                          isLight={isLight}
                          className="text-[9.5px]"
                          onChange={(val) =>
                            setConfig((prev) => ({
                              ...prev,
                              relational: { ...prev.relational, attractorGravity: val },
                            }))
                          }
                        />
                      </div>
                      <input
                        id="slider-attractor-gravity"
                        type="range"
                        min={-15.0}
                        max={25.0}
                        step={0.1}
                        value={config.relational?.attractorGravity ?? 1.6}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            relational: {
                              ...prev.relational,
                              attractorGravity: parseFloat(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-current cursor-pointer"
                      />
                    </div>

                    {/* Orbit Angular Speed */}
                    <div>
                      <div className="flex justify-between items-center text-[9.5px] font-mono mb-0.5">
                        <span className="opacity-80">Orbit Speed</span>
                        <EditableNumber
                          value={config.relational?.orbitSpeed ?? 0.8}
                          precision={2}
                          isLight={isLight}
                          className="text-[9.5px]"
                          onChange={(val) =>
                            setConfig((prev) => ({
                              ...prev,
                              relational: { ...prev.relational, orbitSpeed: val },
                            }))
                          }
                        />
                      </div>
                      <input
                        id="slider-orbit-speed"
                        type="range"
                        min={-10.0}
                        max={10.0}
                        step={0.1}
                        value={config.relational?.orbitSpeed ?? 0.8}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            relational: {
                              ...prev.relational,
                              orbitSpeed: parseFloat(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-current cursor-pointer"
                      />
                    </div>

                    {/* Orbit Radius / Distance */}
                    <div>
                      <div className="flex justify-between items-center text-[9.5px] font-mono mb-0.5">
                        <span className="opacity-80">Orbit Radius</span>
                        <EditableNumber
                          value={config.relational?.orbitRadius ?? 240}
                          precision={0}
                          unit="px"
                          isLight={isLight}
                          className="text-[9.5px]"
                          onChange={(val) =>
                            setConfig((prev) => ({
                              ...prev,
                              relational: { ...prev.relational, orbitRadius: val },
                            }))
                          }
                        />
                      </div>
                      <input
                        id="slider-orbit-radius"
                        type="range"
                        min={0}
                        max={1200}
                        step={10}
                        value={config.relational?.orbitRadius ?? 240}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            relational: {
                              ...prev.relational,
                              orbitRadius: parseFloat(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-current cursor-pointer"
                      />
                    </div>

                    {/* Relational Spin Torque */}
                    <div>
                      <div className="flex justify-between items-center text-[9.5px] font-mono mb-0.5">
                        <span className="opacity-80">Swirl Torque</span>
                        <EditableNumber
                          value={config.relational?.relationalSpin ?? 1.4}
                          precision={2}
                          isLight={isLight}
                          className="text-[9.5px]"
                          onChange={(val) =>
                            setConfig((prev) => ({
                              ...prev,
                              relational: { ...prev.relational, relationalSpin: val },
                            }))
                          }
                        />
                      </div>
                      <input
                        id="slider-relational-spin"
                        type="range"
                        min={-20.0}
                        max={20.0}
                        step={0.1}
                        value={config.relational?.relationalSpin ?? 1.4}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            relational: {
                              ...prev.relational,
                              relationalSpin: parseFloat(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-current cursor-pointer"
                      />
                    </div>

                    {/* Chaos Factor */}
                    <div>
                      <div className="flex justify-between items-center text-[9.5px] font-mono mb-0.5">
                        <span className="opacity-80">Chaos Factor</span>
                        <EditableNumber
                          value={config.relational?.chaosFactor ?? 0.2}
                          precision={2}
                          isLight={isLight}
                          className="text-[9.5px]"
                          onChange={(val) =>
                            setConfig((prev) => ({
                              ...prev,
                              relational: { ...prev.relational, chaosFactor: val },
                            }))
                          }
                        />
                      </div>
                      <input
                        id="slider-chaos-factor"
                        type="range"
                        min={0.0}
                        max={15.0}
                        step={0.1}
                        value={config.relational?.chaosFactor ?? 0.2}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            relational: {
                              ...prev.relational,
                              chaosFactor: parseFloat(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-current cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Fluid Dynamics Sliders (Unclamped) */}
              {activeTab === 'fluid' && (
                <div className="grid grid-cols-2 gap-2">
                  {/* Curl Noise Scale */}
                  <div>
                    <div className="flex justify-between items-center text-[9.5px] font-mono mb-0.5">
                      <span className="opacity-80">Curl Frequency</span>
                      <EditableNumber
                        value={config.fluid.curlScale}
                        precision={2}
                        isLight={isLight}
                        className="text-[9.5px]"
                        onChange={(val) =>
                          setConfig((prev) => ({
                            ...prev,
                            fluid: { ...prev.fluid, curlScale: val },
                          }))
                        }
                      />
                    </div>
                    <input
                      id="slider-curl-scale"
                      type="range"
                      min={0.0}
                      max={15.0}
                      step={0.05}
                      value={config.fluid.curlScale}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          fluid: { ...prev.fluid, curlScale: parseFloat(e.target.value) },
                        }))
                      }
                      className="w-full accent-current cursor-pointer"
                    />
                  </div>

                  {/* Vorticity / Swirl Torque */}
                  <div>
                    <div className="flex justify-between items-center text-[9.5px] font-mono mb-0.5">
                      <span className="opacity-80">Swirl Torque</span>
                      <EditableNumber
                        value={config.fluid.vortexStrength}
                        precision={2}
                        isLight={isLight}
                        className="text-[9.5px]"
                        onChange={(val) =>
                          setConfig((prev) => ({
                            ...prev,
                            fluid: { ...prev.fluid, vortexStrength: val },
                          }))
                        }
                      />
                    </div>
                    <input
                      id="slider-vortex-strength"
                      type="range"
                      min={-20.0}
                      max={25.0}
                      step={0.1}
                      value={config.fluid.vortexStrength}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          fluid: { ...prev.fluid, vortexStrength: parseFloat(e.target.value) },
                        }))
                      }
                      className="w-full accent-current cursor-pointer"
                    />
                  </div>

                  {/* Lateral Dispersion Jet */}
                  <div>
                    <div className="flex justify-between items-center text-[9.5px] font-mono mb-0.5">
                      <span className="opacity-80">Advection Drift</span>
                      <EditableNumber
                        value={config.fluid.dispersion}
                        precision={2}
                        isLight={isLight}
                        className="text-[9.5px]"
                        onChange={(val) =>
                          setConfig((prev) => ({
                            ...prev,
                            fluid: { ...prev.fluid, dispersion: val },
                          }))
                        }
                      />
                    </div>
                    <input
                      id="slider-dispersion"
                      type="range"
                      min={-5.0}
                      max={15.0}
                      step={0.05}
                      value={config.fluid.dispersion}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          fluid: { ...prev.fluid, dispersion: parseFloat(e.target.value) },
                        }))
                      }
                      className="w-full accent-current cursor-pointer"
                    />
                  </div>

                  {/* Hooke's Return Snap */}
                  <div>
                    <div className="flex justify-between items-center text-[9.5px] font-mono mb-0.5">
                      <span className="opacity-80">Spring Snap (k)</span>
                      <EditableNumber
                        value={config.fluid.returnSpeed}
                        precision={2}
                        isLight={isLight}
                        className="text-[9.5px]"
                        onChange={(val) =>
                          setConfig((prev) => ({
                            ...prev,
                            fluid: { ...prev.fluid, returnSpeed: val },
                          }))
                        }
                      />
                    </div>
                    <input
                      id="slider-return-speed"
                      type="range"
                      min={-5.0}
                      max={25.0}
                      step={0.1}
                      value={config.fluid.returnSpeed}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          fluid: { ...prev.fluid, returnSpeed: parseFloat(e.target.value) },
                        }))
                      }
                      className="w-full accent-current cursor-pointer"
                    />
                  </div>

                  {/* Turbulence */}
                  <div>
                    <div className="flex justify-between items-center text-[9.5px] font-mono mb-0.5">
                      <span className="opacity-80">Turbulence</span>
                      <EditableNumber
                        value={config.fluid.turbulence}
                        precision={2}
                        isLight={isLight}
                        className="text-[9.5px]"
                        onChange={(val) =>
                          setConfig((prev) => ({
                            ...prev,
                            fluid: { ...prev.fluid, turbulence: val },
                          }))
                        }
                      />
                    </div>
                    <input
                      id="slider-turbulence"
                      type="range"
                      min={0.0}
                      max={20.0}
                      step={0.1}
                      value={config.fluid.turbulence}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          fluid: { ...prev.fluid, turbulence: parseFloat(e.target.value) },
                        }))
                      }
                      className="w-full accent-current cursor-pointer"
                    />
                  </div>

                  {/* Viscosity Damping */}
                  <div>
                    <div className="flex justify-between items-center text-[9.5px] font-mono mb-0.5">
                      <span className="opacity-80">Viscosity Damping</span>
                      <EditableNumber
                        value={config.fluid.viscosity}
                        precision={3}
                        isLight={isLight}
                        className="text-[9.5px]"
                        onChange={(val) =>
                          setConfig((prev) => ({
                            ...prev,
                            fluid: { ...prev.fluid, viscosity: val },
                          }))
                        }
                      />
                    </div>
                    <input
                      id="slider-viscosity"
                      type="range"
                      min={0.05}
                      max={1.02}
                      step={0.005}
                      value={config.fluid.viscosity}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          fluid: { ...prev.fluid, viscosity: parseFloat(e.target.value) },
                        }))
                      }
                      className="w-full accent-current cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {/* Tab 4: Particle & Sizing (Curved Non-Linear Sliders) */}
              {activeTab === 'particle' && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Min Dot Size with curved slider */}
                    <div>
                      <div className="flex justify-between items-center text-[9.5px] font-mono mb-0.5">
                        <span className="opacity-80">Min Dot Size</span>
                        <EditableNumber
                          value={config.particleSize.min}
                          precision={2}
                          unit="px"
                          isLight={isLight}
                          className="text-[9.5px]"
                          onChange={(val) =>
                            setConfig((prev) => ({
                              ...prev,
                              particleSize: { ...prev.particleSize, min: Math.max(0.05, val) },
                            }))
                          }
                        />
                      </div>
                      <CurvedSlider
                        id="slider-min-size"
                        value={config.particleSize.min}
                        minVal={0.1}
                        breakpoint={3.0}
                        maxVal={25.0}
                        splitPercent={65}
                        curvePower={2.2}
                        onChange={(val) =>
                          setConfig((prev) => ({
                            ...prev,
                            particleSize: { ...prev.particleSize, min: val },
                          }))
                        }
                      />
                      <div className="flex justify-between text-[8px] font-mono opacity-50 mt-0.5">
                        <span>0.1px</span>
                        <span className="text-emerald-500/90 font-medium">0–3px refined curve</span>
                        <span>25px</span>
                      </div>
                    </div>

                    {/* Max Dot Size with curved slider */}
                    <div>
                      <div className="flex justify-between items-center text-[9.5px] font-mono mb-0.5">
                        <span className="opacity-80">Max Dot Size</span>
                        <EditableNumber
                          value={config.particleSize.max}
                          precision={2}
                          unit="px"
                          isLight={isLight}
                          className="text-[9.5px]"
                          onChange={(val) =>
                            setConfig((prev) => ({
                              ...prev,
                              particleSize: { ...prev.particleSize, max: Math.max(0.1, val) },
                            }))
                          }
                        />
                      </div>
                      <CurvedSlider
                        id="slider-max-size"
                        value={config.particleSize.max}
                        minVal={0.2}
                        breakpoint={3.2}
                        maxVal={45.0}
                        splitPercent={65}
                        curvePower={2.2}
                        onChange={(val) =>
                          setConfig((prev) => ({
                            ...prev,
                            particleSize: { ...prev.particleSize, max: val },
                          }))
                        }
                      />
                      <div className="flex justify-between text-[8px] font-mono opacity-50 mt-0.5">
                        <span>0.2px</span>
                        <span className="text-emerald-500/90 font-medium">0–3.2px refined curve</span>
                        <span>45px</span>
                      </div>
                    </div>
                  </div>

                  {/* Secondary row: Morph duration & quick toggles */}
                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-inherit">
                    {/* Morph Duration */}
                    <div>
                      <div className="flex justify-between items-center text-[9.5px] font-mono mb-0.5">
                        <span className="opacity-80">Morph Cycle</span>
                        <EditableNumber
                          value={config.autoMorphDuration ?? 4.0}
                          precision={1}
                          unit="s"
                          isLight={isLight}
                          className="text-[9.5px]"
                          onChange={(val) =>
                            setConfig((prev) => ({
                              ...prev,
                              autoMorphDuration: val,
                            }))
                          }
                        />
                      </div>
                      <input
                        id="slider-morph-duration"
                        type="range"
                        min={0.2}
                        max={30.0}
                        step={0.2}
                        value={config.autoMorphDuration ?? 4.0}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            autoMorphDuration: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full accent-current cursor-pointer"
                      />
                    </div>

                    {/* Quick Shape & Style Toggles */}
                    <div className="flex items-center gap-1 self-end pb-0.5">
                      <button
                        type="button"
                        onClick={toggleStyle}
                        className={`flex-1 py-1 px-1.5 text-[9px] font-mono uppercase rounded border text-center transition-all ${
                          isLight
                            ? 'border-stone-300 text-stone-700 hover:bg-stone-100'
                            : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {config.style}
                      </button>
                      <button
                        type="button"
                        onClick={toggleDotShape}
                        className={`flex-1 py-1 px-1.5 text-[9px] font-mono uppercase rounded border text-center transition-all ${
                          isLight
                            ? 'border-stone-300 text-stone-700 hover:bg-stone-100'
                            : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {config.dotShape}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Pointer Interaction Forces */}
              {activeTab === 'interaction' && (
                <div className="space-y-2">
                  {/* Mode selector */}
                  <div>
                    <span className="block text-[9.5px] font-mono mb-1 opacity-80">Interaction Mode</span>
                    <div className="grid grid-cols-3 gap-1">
                      {(['repel', 'attract', 'vortex'] as const).map((m) => (
                        <button
                          key={m}
                          id={`btn-mode-${m}`}
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              interaction: { ...prev.interaction, mode: m },
                            }))
                          }
                          className={`py-1 text-[9.5px] font-mono uppercase rounded border transition-all ${
                            config.interaction.mode === m
                              ? isLight
                                ? 'bg-stone-900 text-white border-stone-900 font-medium'
                                : 'bg-white text-zinc-950 border-white font-medium'
                              : isLight
                              ? 'border-stone-200 text-stone-700 hover:bg-stone-100'
                              : 'border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Interaction Radius */}
                    <div>
                      <div className="flex justify-between items-center text-[9.5px] font-mono mb-0.5">
                        <span className="opacity-80">Radius</span>
                        <EditableNumber
                          value={config.interaction.radius}
                          precision={0}
                          unit="px"
                          isLight={isLight}
                          className="text-[9.5px]"
                          onChange={(val) =>
                            setConfig((prev) => ({
                              ...prev,
                              interaction: { ...prev.interaction, radius: Math.round(val) },
                            }))
                          }
                        />
                      </div>
                      <input
                        id="slider-interaction-radius"
                        type="range"
                        min={10}
                        max={1500}
                        step={10}
                        value={config.interaction.radius}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            interaction: { ...prev.interaction, radius: parseInt(e.target.value, 10) },
                          }))
                        }
                        className="w-full accent-current cursor-pointer"
                      />
                    </div>

                    {/* Interaction Strength */}
                    <div>
                      <div className="flex justify-between items-center text-[9.5px] font-mono mb-0.5">
                        <span className="opacity-80">Force</span>
                        <EditableNumber
                          value={config.interaction.strength}
                          precision={2}
                          isLight={isLight}
                          className="text-[9.5px]"
                          onChange={(val) =>
                            setConfig((prev) => ({
                              ...prev,
                              interaction: { ...prev.interaction, strength: val },
                            }))
                          }
                        />
                      </div>
                      <input
                        id="slider-interaction-strength"
                        type="range"
                        min={-10.0}
                        max={15.0}
                        step={0.1}
                        value={config.interaction.strength}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            interaction: { ...prev.interaction, strength: parseFloat(e.target.value) },
                          }))
                        }
                        className="w-full accent-current cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: Saved Setting States Management */}
              {activeTab === 'saved' && (
                <div className="space-y-2">
                  {/* Save current state bar */}
                  <form
                    onSubmit={handleSaveCurrentState}
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border ${
                      isLight ? 'bg-stone-50 border-stone-200' : 'bg-zinc-950 border-zinc-800'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5 opacity-60 shrink-0" />
                    <input
                      id="save-state-name-input"
                      type="text"
                      placeholder="State name..."
                      value={newSaveName}
                      onChange={(e) => setNewSaveName(e.target.value)}
                      className={`flex-1 px-2 py-1 text-[10px] font-mono rounded border outline-none ${
                        isLight
                          ? 'bg-white border-stone-300 text-stone-900'
                          : 'bg-zinc-900 border-zinc-700 text-white'
                      }`}
                    />
                    <button
                      id="save-current-state-btn"
                      type="submit"
                      className={`px-2 py-1 text-[10px] font-mono uppercase rounded font-medium transition-all shrink-0 ${
                        isLight
                          ? 'bg-stone-900 text-white hover:bg-black'
                          : 'bg-white text-zinc-950 hover:bg-zinc-200'
                      }`}
                    >
                      Save
                    </button>
                    <button
                      id="import-json-btn"
                      type="button"
                      onClick={() => setShowImportModal(true)}
                      className={`p-1 text-[10px] font-mono uppercase rounded border transition-all shrink-0 ${
                        isLight
                          ? 'border-stone-300 hover:bg-stone-100'
                          : 'border-zinc-700 hover:bg-zinc-800'
                      }`}
                      title="Import JSON"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  {/* List of Saved States */}
                  {savedStates.length === 0 ? (
                    <div
                      className={`p-3 text-center rounded-lg border text-[10px] font-mono opacity-60 ${
                        isLight ? 'border-dashed border-stone-300' : 'border-dashed border-zinc-800'
                      }`}
                    >
                      No saved states yet. Adjust values, name state, click "Save".
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {savedStates.map((st) => (
                        <div
                          key={st.id}
                          className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${
                            isLight
                              ? 'bg-stone-50/80 border-stone-200'
                              : 'bg-zinc-950/80 border-zinc-800'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-bold text-[10px] truncate">
                                {st.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[8.5px] font-mono opacity-60">
                              <span>
                                {Array.isArray(st.config.glyph)
                                  ? st.config.glyph.join('⇄')
                                  : st.config.glyph}
                              </span>
                              <span>·</span>
                              <span>{st.config.style}</span>
                              {st.config.relational?.enabled && (
                                <span className="text-emerald-500 font-semibold">· Orbit</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              id={`load-state-${st.id}`}
                              onClick={() => handleLoadState(st)}
                              className={`px-2 py-0.5 text-[9.5px] font-mono uppercase rounded font-medium transition-all ${
                                isLight
                                  ? 'bg-stone-900 text-white hover:bg-black'
                                  : 'bg-white text-zinc-950 hover:bg-zinc-200'
                              }`}
                            >
                              Load
                            </button>

                            <button
                              id={`export-json-${st.id}`}
                              onClick={() => handleExportStateJson(st)}
                              title="Copy JSON"
                              className="p-1 rounded border border-inherit opacity-70 hover:opacity-100 transition-opacity"
                            >
                              {copiedNotification === st.id ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              id={`delete-state-${st.id}`}
                              onClick={() => handleDeleteState(st.id, st.name)}
                              title="Delete state"
                              className="p-1 rounded border border-inherit text-red-500 opacity-70 hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. Tweakpane Debug Inspector */}
      <TweakpaneDebug
        engine={engine}
        config={config}
        onConfigChange={(partial) => {
          setConfig((prev) => ({
            ...prev,
            ...partial,
            particleSize: { ...prev.particleSize, ...(partial.particleSize || {}) },
            fluid: { ...prev.fluid, ...(partial.fluid || {}) },
            interaction: { ...prev.interaction, ...(partial.interaction || {}) },
            relational: { ...prev.relational, ...(partial.relational || {}) },
          }));
        }}
        visible={showInspector && !isUIHidden}
        onClose={() => setShowInspector(false)}
      />

      {/* 6. Import State JSON Modal */}
      {showImportModal && (
        <div
          id="import-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowImportModal(false)}
        >
          <div
            id="import-modal-window"
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl flex flex-col ${
              isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-zinc-900 border-zinc-800 text-zinc-100'
            }`}
          >
            <h3 className="text-sm font-mono font-bold uppercase mb-1">
              Import Configuration State
            </h3>
            <p className="text-xs opacity-60 font-mono mb-3">
              Paste valid PointCloudConfig JSON below to immediately load parameters:
            </p>
            <textarea
              id="import-json-textarea"
              rows={8}
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              placeholder="{\n  &quot;glyph&quot;: [&quot;✦&quot;, &quot;✧&quot;],\n  &quot;fluid&quot;: { ... }\n}"
              className={`w-full p-3 font-mono text-xs rounded-xl border outline-none mb-4 ${
                isLight ? 'bg-stone-50 border-stone-300' : 'bg-black border-zinc-700'
              }`}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-3.5 py-1.5 text-xs font-mono uppercase rounded-lg border border-inherit"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportJson}
                className={`px-4 py-1.5 text-xs font-mono uppercase rounded-lg font-medium ${
                  isLight ? 'bg-stone-900 text-white' : 'bg-white text-zinc-950'
                }`}
              >
                Apply JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Integration & Architecture Modal */}
      {showCodeModal && (
        <div
          id="code-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowCodeModal(false)}
        >
          <div
            id="code-modal-window"
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl max-h-[85vh] rounded-2xl border p-6 shadow-2xl flex flex-col overflow-hidden ${
              isLight ? 'bg-white border-stone-200 text-stone-900' : 'bg-zinc-900 border-zinc-800 text-zinc-100'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-inherit">
              <div>
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider">
                  Component API & Relational Mechanics
                </h2>
                <p className="text-xs opacity-60 mt-0.5 font-mono">
                  Drop-in Vanilla JS and React export targets
                </p>
              </div>
              <button
                id="close-code-modal-btn"
                onClick={() => setShowCodeModal(false)}
                className="text-xs font-mono px-2.5 py-1 rounded-md border border-inherit hover:bg-stone-500/10"
              >
                ESC
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 py-4 pr-1 text-xs">
              <div>
                <h3 className="font-mono font-semibold uppercase mb-1.5 text-stone-500">
                  1. React Integration with Free Relational Dynamics
                </h3>
                <pre
                  className={`p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto border ${
                    isLight ? 'bg-stone-50 border-stone-200' : 'bg-black border-zinc-800'
                  }`}
                >
{`import { PointCloudComponent } from './components/PointCloudComponent';

export function FluidTypographyHero() {
  return (
    <PointCloudComponent
      glyph={['✦', '✧']}
      particleCount={200000}
      colorMode="blackOnWhite"
      style="stipple"
      relational={{
        enabled: true,
        mode: 'orbital',
        attractorCount: 2,
        attractorGravity: 3.2,
        orbitSpeed: 1.2,
        orbitRadius: 280,
      }}
      fluid={{
        curlScale: 1.2,
        vortexStrength: 1.45,
        viscosity: 0.94,
        returnSpeed: 0.6,
      }}
      positioning="fixed"
    />
  );
}`}
                </pre>
              </div>

              <div>
                <h3 className="font-mono font-semibold uppercase mb-1.5 text-stone-500">
                  2. Relational Dynamics & Multi-Attractor Mechanics
                </h3>
                <div
                  className={`p-3.5 rounded-xl font-mono text-[11px] leading-relaxed border space-y-1 ${
                    isLight ? 'bg-stone-50 border-stone-200' : 'bg-black border-zinc-800'
                  }`}
                >
                  <p>• <strong>Multi-Attractor Centroid Extraction</strong>: When typing strings or symbols, the sampler analyzes character bounding boxes and extracts up to 6 gravitational pole coordinates.</p>
                  <p>• <strong>Keplerian Orbitals & Lemniscate Rosettes</strong>: Mathematical orbital trajectories (standard circular, harmonic wandering chaos, or figure-8 lemniscates) gravitationally pull particles between letterforms.</p>
                  <p>• <strong>Plummer-Sphere Gravity & Swirl</strong>: Softened gravitational potential wells prevent numerical singularities while injecting local tangential swirl.</p>
                  <p>• <strong>Unconstrained Range Testing</strong>: Spring constants can become negative for explosive kinetic dissipation, and viscosity can exceed 1.0 for self-sustaining energy bursts.</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-inherit flex justify-end">
              <button
                id="modal-done-btn"
                onClick={() => setShowCodeModal(false)}
                className={`px-4 py-1.5 text-xs font-mono uppercase rounded-lg font-medium ${
                  isLight ? 'bg-stone-900 text-white' : 'bg-white text-zinc-950'
                }`}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
