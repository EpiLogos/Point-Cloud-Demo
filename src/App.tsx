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
} from 'lucide-react';
import { PointCloudConfig, PointCloudRelationalConfig } from './engine/types';
import { DEFAULT_CONFIG, PointCloudField } from './engine/PointCloudField';
import { PointCloudComponent, PointCloudComponentRef } from './components/PointCloudComponent';
import { TweakpaneDebug } from './components/TweakpaneDebug';
import { EditableNumber } from './components/EditableNumber';

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
];

const GLYPH_PAIRS = [
  { label: 'O ⇄ I', val: ['O', 'I'] },
  { label: '✦ ⇄ ✧', val: ['✦', '✧'] },
  { label: '∞ ⇄ 8', val: ['∞', '8'] },
  { label: 'Ω ⇄ A', val: ['Ω', 'A'] },
  { label: '& ⇄ @', val: ['&', '@'] },
  { label: '∑ ⇄ ∫', val: ['∑', '∫'] },
  { label: 'S ⇄ Z', val: ['S', 'Z'] },
  { label: '⌘ ⇄ ⌥', val: ['⌘', '⌥'] },
];

const SPECIAL_CHAR_CATEGORIES = [
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
  const [activeTab, setActiveTab] = useState<'presets' | 'relational' | 'fluid' | 'particle' | 'interaction' | 'saved'>('presets');

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
    }));
  };

  // Toggle color mode
  const toggleColorMode = () => {
    setConfig((prev) => ({
      ...prev,
      colorMode: prev.colorMode === 'blackOnWhite' ? 'whiteOnBlack' : 'blackOnWhite',
    }));
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

  const isLight = config.colorMode === 'blackOnWhite';

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
        isLight ? 'bg-[#fafaf9] text-[#1c1917]' : 'bg-[#09090b] text-[#f4f4f5]'
      }`}
    >
      {/* 1. Fullscreen WebGL Point Cloud Engine Canvas */}
      <PointCloudComponent
        ref={compRef}
        {...config}
        onEngineReady={handleEngineReady}
        positioning="absolute"
        className="w-full h-full inset-0 z-0"
      />

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
            title="Toggle Monochrome Color Mode"
            className={`p-2 text-xs rounded-lg border transition-all ${
              isLight
                ? 'bg-white/80 border-stone-200 text-stone-800 hover:bg-stone-100 shadow-xs backdrop-blur-md'
                : 'bg-zinc-900/80 border-zinc-800 text-zinc-200 hover:bg-zinc-800 shadow-xs backdrop-blur-md'
            }`}
          >
            {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
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
        className={`absolute inset-0 pointer-events-none flex flex-col justify-end pb-32 items-center transition-opacity duration-300 ${
          isUIHidden ? 'opacity-0' : 'opacity-30 hover:opacity-80'
        }`}
      >
        <p className="text-[11px] font-mono tracking-widest uppercase">
          MOVE CURSOR / DRAG TOUCH TO INJECT FLUID VELOCITY · PRESS 'H' TO TOGGLE CLEAN CANVAS
        </p>
      </div>

      {/* 4. Bottom Control Drawer (Hideable) */}
      <div
        id="bottom-control-drawer"
        className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[96%] max-w-5xl pointer-events-auto transition-all duration-500 ${
          isUIHidden ? 'translate-y-36 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
        }`}
      >
        <div
          className={`rounded-2xl border backdrop-blur-xl shadow-2xl transition-all overflow-hidden ${
            isLight ? 'bg-white/92 border-stone-200/90' : 'bg-zinc-900/92 border-zinc-800/90'
          }`}
        >
          {/* Drawer Top Navigation Bar */}
          <div
            className={`flex items-center justify-between px-4 py-2.5 border-b gap-2 flex-wrap sm:flex-nowrap ${
              isLight ? 'border-stone-200' : 'border-zinc-800'
            }`}
          >
            {/* Tab Switches */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
              {[
                { id: 'presets', label: 'Presets', icon: Sparkles },
                { id: 'relational', label: 'Relational System', icon: Orbit },
                { id: 'fluid', label: 'Fluid Dynamics', icon: Wind },
                { id: 'particle', label: 'Particles', icon: Circle },
                { id: 'interaction', label: 'Pointer', icon: Compass },
                { id: 'saved', label: 'Saved States', icon: Bookmark },
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
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono uppercase rounded-lg whitespace-nowrap transition-all ${
                      isActive
                        ? isLight
                          ? 'bg-stone-900 text-white font-medium shadow-xs'
                          : 'bg-white text-zinc-950 font-medium shadow-xs'
                        : isLight
                        ? 'text-stone-600 hover:text-stone-950 hover:bg-stone-100'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Auto-Morph Toggle & Expand/Collapse */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="toggle-auto-morph-btn"
                onClick={() =>
                  setConfig((prev) => ({ ...prev, autoMorph: !prev.autoMorph }))
                }
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all ${
                  config.autoMorph
                    ? isLight
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-zinc-950 border-white'
                    : isLight
                    ? 'border-stone-200 text-stone-600 hover:bg-stone-100'
                    : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                }`}
                title={config.autoMorph ? 'Pause Morph Oscillation' : 'Start Auto-Morph'}
              >
                {config.autoMorph ? (
                  <Pause className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Play className="w-3 h-3" />
                )}
                <span className="text-[11px] hidden md:inline">
                  {config.autoMorph ? 'Auto-Morphing' : 'Morph Paused'}
                </span>
              </button>

              {/* Drawer Expand/Collapse */}
              <button
                id="toggle-drawer-btn"
                onClick={() => setShowControlsDrawer(!showControlsDrawer)}
                className={`p-1.5 rounded-lg text-xs opacity-70 hover:opacity-100 transition-opacity`}
              >
                {showControlsDrawer ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronUp className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Glyphs / Word & Special Characters Ribbon */}
          <div
            className={`px-4 py-2 border-b flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
              isLight ? 'bg-stone-50/50 border-stone-200' : 'bg-zinc-950/40 border-zinc-800'
            }`}
          >
            {/* Glyph Slots A & B */}
            <div className="flex items-center gap-2">
              <span className="opacity-60 text-[11px]">Active Glyphs:</span>
              <div className="flex items-center gap-1.5">
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
                  title="Glyph / Word A (Click to type or pick a special symbol below)"
                  className={`w-14 px-2 py-1 text-center font-mono rounded-lg border font-bold text-xs outline-none transition-all ${
                    focusedGlyphSlot === 'A'
                      ? 'ring-2 ring-emerald-500'
                      : ''
                  } ${
                    isLight
                      ? 'bg-white border-stone-300 text-stone-900'
                      : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
                <span className="opacity-50">⇄</span>
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
                  title="Glyph / Word B (Click to type or pick a special symbol below)"
                  className={`w-14 px-2 py-1 text-center font-mono rounded-lg border font-bold text-xs outline-none transition-all ${
                    focusedGlyphSlot === 'B'
                      ? 'ring-2 ring-emerald-500'
                      : ''
                  } ${
                    isLight
                      ? 'bg-white border-stone-300 text-stone-900'
                      : 'bg-zinc-900 border-zinc-700 text-white'
                  }`}
                />
              </div>

              {/* Free Text Word / Phrase Form */}
              <form onSubmit={handleBakeFreeText} className="flex items-center gap-1.5 ml-2">
                <input
                  id="free-text-input"
                  type="text"
                  value={freeTextWord}
                  onChange={(e) => setFreeTextWord(e.target.value)}
                  placeholder="Type any word or phrase (e.g. FLUID, VOID, 42)..."
                  className={`w-40 sm:w-60 px-2.5 py-1 text-xs font-mono rounded-lg border outline-none ${
                    isLight
                      ? 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400'
                      : 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500'
                  }`}
                />
                <button
                  id="bake-free-text-btn"
                  type="submit"
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                    isLight
                      ? 'bg-stone-900 text-white hover:bg-black'
                      : 'bg-white text-zinc-950 hover:bg-zinc-200'
                  }`}
                >
                  Bake
                </button>
              </form>
            </div>

            {/* Quick Special Characters Palette */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="opacity-50 text-[10px] uppercase tracking-wider hidden xl:inline">
                Insert into [{focusedGlyphSlot}]:
              </span>
              {['✦', '✧', '★', '∞', 'Ω', '∑', '∫', '⌘', '⌥', '⏣', '☯', '♠', '♥', 'λ', '§'].map(
                (char) => (
                  <button
                    key={char}
                    id={`quick-char-${char}`}
                    type="button"
                    onClick={() => handleInsertChar(char)}
                    title={`Insert "${char}" into Glyph Slot ${focusedGlyphSlot}`}
                    className={`w-6 h-6 flex items-center justify-center rounded-md border text-xs transition-all hover:scale-110 ${
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

          {/* Drawer Body (Expandable) */}
          {showControlsDrawer && (
            <div className="p-4 sm:p-5 max-h-[38vh] overflow-y-auto">
              {/* Tab 1: Presets Showcase */}
              {activeTab === 'presets' && (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {PRESETS.map((preset) => {
                      const isSelected = activePreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          id={`preset-card-${preset.id}`}
                          onClick={() => applyPreset(preset)}
                          className={`text-left p-3 rounded-xl border transition-all ${
                            isSelected
                              ? isLight
                                ? 'bg-stone-100 border-stone-900/80 ring-1 ring-stone-900/20 shadow-xs'
                                : 'bg-zinc-800 border-white/80 ring-1 ring-white/20 shadow-xs'
                              : isLight
                              ? 'bg-stone-50/60 border-stone-200/80 hover:bg-stone-100 hover:border-stone-300'
                              : 'bg-zinc-950/60 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono font-bold tracking-tight">
                              {preset.name}
                            </span>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            )}
                          </div>
                          <p className="text-[11px] opacity-70 leading-relaxed line-clamp-2">
                            {preset.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Special Characters Categories Drawer */}
                  <div className="mt-4 pt-3 border-t border-inherit">
                    <span className="text-xs font-mono font-bold block mb-2 opacity-80">
                      Extended Special Characters Library:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {SPECIAL_CHAR_CATEGORIES.map((cat) => (
                        <div
                          key={cat.name}
                          className={`p-2.5 rounded-xl border ${
                            isLight
                              ? 'bg-stone-50/70 border-stone-200'
                              : 'bg-zinc-950/50 border-zinc-800'
                          }`}
                        >
                          <span className="text-[10px] font-mono font-semibold uppercase opacity-60 block mb-1.5">
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
                                className={`w-7 h-7 flex items-center justify-center rounded-lg border text-xs font-mono transition-all hover:scale-110 ${
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

              {/* Tab 2: Free Relational System & Attractors */}
              {activeTab === 'relational' && (
                <div className="space-y-4">
                  {/* Master Toggle & Mode Picker */}
                  <div
                    className={`flex flex-wrap items-center justify-between p-3.5 rounded-xl border ${
                      isLight ? 'bg-stone-50 border-stone-200' : 'bg-zinc-950 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
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
                        className={`px-3.5 py-1.5 text-xs font-mono uppercase rounded-lg border font-bold transition-all flex items-center gap-2 ${
                          config.relational?.enabled
                            ? 'bg-emerald-500 text-black border-emerald-500 shadow-sm'
                            : isLight
                            ? 'bg-stone-200 border-stone-300 text-stone-700'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                        }`}
                      >
                        <Orbit className="w-3.5 h-3.5" />
                        {config.relational?.enabled
                          ? 'Relational Orbits ACTIVE'
                          : 'Relational Orbits OFF'}
                      </button>
                      <p className="text-xs opacity-70 font-mono hidden md:inline">
                        Simulate non-linear multi-pole Keplerian gravity, figure-8 orbits, and strange chaotic attractors.
                      </p>
                    </div>

                    {/* Mode selector */}
                    <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
                      {[
                        { id: 'orbital', label: 'Orbital Gravity' },
                        { id: 'chaos', label: 'Harmonic Chaos' },
                        { id: 'nbody', label: 'N-Body Lemniscate' },
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
                          className={`px-2.5 py-1 text-xs font-mono uppercase rounded-lg border transition-all ${
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

                  {/* Relational Parameters Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Attractor Count */}
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1.5">
                        <span>Attractor Poles</span>
                        <EditableNumber
                          value={config.relational?.attractorCount ?? 3}
                          precision={0}
                          isLight={isLight}
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
                      <div className="flex justify-between text-xs font-mono mb-1.5">
                        <span>Attractor Gravity</span>
                        <EditableNumber
                          value={config.relational?.attractorGravity ?? 1.6}
                          precision={2}
                          isLight={isLight}
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
                      <div className="flex justify-between text-xs font-mono mb-1.5">
                        <span>Orbit Angular Velocity</span>
                        <EditableNumber
                          value={config.relational?.orbitSpeed ?? 0.8}
                          precision={2}
                          isLight={isLight}
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
                      <div className="flex justify-between text-xs font-mono mb-1.5">
                        <span>Orbit Separation (px)</span>
                        <EditableNumber
                          value={config.relational?.orbitRadius ?? 240}
                          precision={0}
                          unit="px"
                          isLight={isLight}
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
                      <div className="flex justify-between text-xs font-mono mb-1.5">
                        <span>Vortex Swirl Torque</span>
                        <EditableNumber
                          value={config.relational?.relationalSpin ?? 1.4}
                          precision={2}
                          isLight={isLight}
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
                      <div className="flex justify-between text-xs font-mono mb-1.5">
                        <span>Strange Chaos Factor</span>
                        <EditableNumber
                          value={config.relational?.chaosFactor ?? 0.2}
                          precision={2}
                          isLight={isLight}
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

                    {/* Harmonic Wander Rate */}
                    <div>
                      <div className="flex justify-between text-xs font-mono mb-1.5">
                        <span>Wander Drift Rate</span>
                        <EditableNumber
                          value={config.relational?.wanderSpeed ?? 0.5}
                          precision={2}
                          isLight={isLight}
                          onChange={(val) =>
                            setConfig((prev) => ({
                              ...prev,
                              relational: { ...prev.relational, wanderSpeed: val },
                            }))
                          }
                        />
                      </div>
                      <input
                        id="slider-wander-speed"
                        type="range"
                        min={0.0}
                        max={10.0}
                        step={0.1}
                        value={config.relational?.wanderSpeed ?? 0.5}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            relational: {
                              ...prev.relational,
                              wanderSpeed: parseFloat(e.target.value),
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Curl Noise Scale */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1.5">
                      <span>Curl Noise Frequency</span>
                      <EditableNumber
                        value={config.fluid.curlScale}
                        precision={2}
                        isLight={isLight}
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
                    <div className="flex justify-between text-xs font-mono mb-1.5">
                      <span>Swirl Torque (Vorticity)</span>
                      <EditableNumber
                        value={config.fluid.vortexStrength}
                        precision={2}
                        isLight={isLight}
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
                    <div className="flex justify-between text-xs font-mono mb-1.5">
                      <span>O→I Drift Advection</span>
                      <EditableNumber
                        value={config.fluid.dispersion}
                        precision={2}
                        isLight={isLight}
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
                    <div className="flex justify-between text-xs font-mono mb-1.5">
                      <span>Shape Spring Snap (k)</span>
                      <EditableNumber
                        value={config.fluid.returnSpeed}
                        precision={2}
                        isLight={isLight}
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

                  {/* Curl Speed */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1.5">
                      <span>Curl Evolution Rate</span>
                      <EditableNumber
                        value={config.fluid.curlSpeed}
                        precision={2}
                        isLight={isLight}
                        onChange={(val) =>
                          setConfig((prev) => ({
                            ...prev,
                            fluid: { ...prev.fluid, curlSpeed: val },
                          }))
                        }
                      />
                    </div>
                    <input
                      id="slider-curl-speed"
                      type="range"
                      min={-5.0}
                      max={10.0}
                      step={0.05}
                      value={config.fluid.curlSpeed}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          fluid: { ...prev.fluid, curlSpeed: parseFloat(e.target.value) },
                        }))
                      }
                      className="w-full accent-current cursor-pointer"
                    />
                  </div>

                  {/* Turbulence */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1.5">
                      <span>Turbulence Jitter</span>
                      <EditableNumber
                        value={config.fluid.turbulence}
                        precision={2}
                        isLight={isLight}
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
                    <div className="flex justify-between text-xs font-mono mb-1.5">
                      <span>Viscosity Damping</span>
                      <EditableNumber
                        value={config.fluid.viscosity}
                        precision={3}
                        isLight={isLight}
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

              {/* Tab 4: Particle & Sizing (Unclamped) */}
              {activeTab === 'particle' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Min Dot Size */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1.5">
                      <span>Min Dot Size</span>
                      <EditableNumber
                        value={config.particleSize.min}
                        precision={1}
                        unit="px"
                        isLight={isLight}
                        onChange={(val) =>
                          setConfig((prev) => ({
                            ...prev,
                            particleSize: { ...prev.particleSize, min: val },
                          }))
                        }
                      />
                    </div>
                    <input
                      id="slider-min-size"
                      type="range"
                      min={0.1}
                      max={25.0}
                      step={0.1}
                      value={config.particleSize.min}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          particleSize: { ...prev.particleSize, min: parseFloat(e.target.value) },
                        }))
                      }
                      className="w-full accent-current cursor-pointer"
                    />
                  </div>

                  {/* Max Dot Size */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1.5">
                      <span>Max Dot Size</span>
                      <EditableNumber
                        value={config.particleSize.max}
                        precision={1}
                        unit="px"
                        isLight={isLight}
                        onChange={(val) =>
                          setConfig((prev) => ({
                            ...prev,
                            particleSize: { ...prev.particleSize, max: val },
                          }))
                        }
                      />
                    </div>
                    <input
                      id="slider-max-size"
                      type="range"
                      min={0.2}
                      max={50.0}
                      step={0.2}
                      value={config.particleSize.max}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          particleSize: { ...prev.particleSize, max: parseFloat(e.target.value) },
                        }))
                      }
                      className="w-full accent-current cursor-pointer"
                    />
                  </div>

                  {/* Morph Cycle */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1.5">
                      <span>Morph Cycle</span>
                      <EditableNumber
                        value={config.autoMorphDuration ?? 4.0}
                        precision={1}
                        unit="s"
                        isLight={isLight}
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
                </div>
              )}

              {/* Tab 5: Pointer Interaction Forces (Unclamped) */}
              {activeTab === 'interaction' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Mode selector */}
                  <div>
                    <span className="block text-xs font-mono mb-1.5">Interaction Mode</span>
                    <div className="grid grid-cols-3 gap-1.5">
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
                          className={`py-1.5 text-xs font-mono uppercase rounded-lg border transition-all ${
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

                  {/* Interaction Radius */}
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1.5">
                      <span>Influence Radius</span>
                      <EditableNumber
                        value={config.interaction.radius}
                        precision={0}
                        unit="px"
                        isLight={isLight}
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
                    <div className="flex justify-between text-xs font-mono mb-1.5">
                      <span>Force Magnitude</span>
                      <EditableNumber
                        value={config.interaction.strength}
                        precision={2}
                        isLight={isLight}
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
              )}

              {/* Tab 6: Saved Setting States Management */}
              {activeTab === 'saved' && (
                <div className="space-y-4">
                  {/* Save current state bar */}
                  <form
                    onSubmit={handleSaveCurrentState}
                    className={`flex items-center gap-2 p-3 rounded-xl border ${
                      isLight ? 'bg-stone-50 border-stone-200' : 'bg-zinc-950 border-zinc-800'
                    }`}
                  >
                    <Save className="w-4 h-4 opacity-60" />
                    <input
                      id="save-state-name-input"
                      type="text"
                      placeholder="Name this setting state (e.g. Heavy Swirl & Binary Orbits)..."
                      value={newSaveName}
                      onChange={(e) => setNewSaveName(e.target.value)}
                      className={`flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border outline-none ${
                        isLight
                          ? 'bg-white border-stone-300 text-stone-900'
                          : 'bg-zinc-900 border-zinc-700 text-white'
                      }`}
                    />
                    <button
                      id="save-current-state-btn"
                      type="submit"
                      className={`px-4 py-1.5 text-xs font-mono uppercase rounded-lg font-medium transition-all ${
                        isLight
                          ? 'bg-stone-900 text-white hover:bg-black'
                          : 'bg-white text-zinc-950 hover:bg-zinc-200'
                      }`}
                    >
                      Save State
                    </button>
                    <button
                      id="import-json-btn"
                      type="button"
                      onClick={() => setShowImportModal(true)}
                      className={`px-3 py-1.5 text-xs font-mono uppercase rounded-lg border transition-all ${
                        isLight
                          ? 'border-stone-300 hover:bg-stone-100'
                          : 'border-zinc-700 hover:bg-zinc-800'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 inline mr-1" />
                      Import JSON
                    </button>
                  </form>

                  {/* List of Saved States */}
                  {savedStates.length === 0 ? (
                    <div
                      className={`p-6 text-center rounded-xl border text-xs font-mono opacity-60 ${
                        isLight ? 'border-dashed border-stone-300' : 'border-dashed border-zinc-800'
                      }`}
                    >
                      No saved setting states yet. Adjust your parameters, give it a title, and click "Save State".
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {savedStates.map((st) => (
                        <div
                          key={st.id}
                          className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                            isLight
                              ? 'bg-stone-50/80 border-stone-200'
                              : 'bg-zinc-950/80 border-zinc-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono font-bold text-xs truncate">
                                {st.name}
                              </span>
                              <span className="text-[10px] font-mono opacity-50">
                                {new Date(st.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono opacity-70 mb-3">
                              <span className="px-1.5 py-0.5 rounded border border-inherit">
                                {Array.isArray(st.config.glyph)
                                  ? st.config.glyph.join(' ⇄ ')
                                  : st.config.glyph}
                              </span>
                              <span className="px-1.5 py-0.5 rounded border border-inherit">
                                {st.config.style}
                              </span>
                              {st.config.relational?.enabled && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                                  Relational
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-inherit">
                            <button
                              id={`load-state-${st.id}`}
                              onClick={() => handleLoadState(st)}
                              className={`px-3 py-1 text-xs font-mono uppercase rounded-lg font-medium transition-all ${
                                isLight
                                  ? 'bg-stone-900 text-white hover:bg-black'
                                  : 'bg-white text-zinc-950 hover:bg-zinc-200'
                              }`}
                            >
                              Load
                            </button>

                            <div className="flex items-center gap-1">
                              <button
                                id={`export-json-${st.id}`}
                                onClick={() => handleExportStateJson(st)}
                                title="Copy state configuration as JSON to clipboard"
                                className="p-1.5 rounded-lg border border-inherit opacity-70 hover:opacity-100 transition-opacity"
                              >
                                {copiedNotification === st.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                id={`delete-state-${st.id}`}
                                onClick={() => handleDeleteState(st.id, st.name)}
                                title="Delete saved state"
                                className="p-1.5 rounded-lg border border-inherit text-red-500 opacity-70 hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
