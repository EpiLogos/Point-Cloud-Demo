/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  ArrowUp,
  ArrowDown,
  Repeat,
  Play,
  Sliders,
  Compass,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Flame,
  Radio,
  Eye,
  Zap,
  Disc,
} from 'lucide-react';
import {
  PointCloudConfig,
  SpatialChakraConfig,
  SpatialChakraNode,
  SpatialChakraTimelineState,
} from '../engine/types';
import {
  CANONICAL_CHAKRAS,
  createDefaultChakraConfig,
  CHAKRA_SPATIAL_PRESETS,
} from '../engine/chakraSystem';
import { EditableNumber } from './EditableNumber';

export interface ChakraPanelProps {
  config: PointCloudConfig;
  setConfig: React.Dispatch<React.SetStateAction<PointCloudConfig>>;
  timelineState: SpatialChakraTimelineState | null;
  onJumpToNode: (index: number) => void;
  onStepNode: (direction: 1 | -1) => void;
  isLight: boolean;
}

export const ChakraPanel: React.FC<ChakraPanelProps> = ({
  config,
  setConfig,
  timelineState,
  onJumpToNode,
  onStepNode,
  isLight,
}) => {
  const chakraConfig = config.spatialChakra || createDefaultChakraConfig();
  const [activeSubTab, setActiveSubTab] = useState<'system' | 'spine' | 'coordinates' | 'presets'>('system');
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);

  const updateChakra = (updates: Partial<SpatialChakraConfig>) => {
    setConfig((prev) => ({
      ...prev,
      spatialChakra: {
        ...(prev.spatialChakra || createDefaultChakraConfig()),
        ...updates,
      },
    }));
  };

  const updateNode = (id: string, updates: Partial<SpatialChakraNode>) => {
    const nodes = (chakraConfig.nodes || CANONICAL_CHAKRAS).map((n) =>
      n.id === id ? { ...n, ...updates } : n
    );
    updateChakra({ nodes });
  };

  const applySpatialPreset = (presetNodes: SpatialChakraNode[]) => {
    updateChakra({
      nodes: presetNodes.map((n) => ({ ...n })),
    });
  };

  const currentNode = timelineState?.currentNode || CANONICAL_CHAKRAS[timelineState?.currentIndex ?? 6] || CANONICAL_CHAKRAS[6];
  const nextNode = timelineState?.nextNode || CANONICAL_CHAKRAS[timelineState?.nextIndex ?? 5] || CANONICAL_CHAKRAS[5];

  return (
    <div className="space-y-3 font-mono text-xs">
      {/* 1. Master Chakra Mode Activation Banner */}
      <div
        className={`p-3 rounded-lg border transition-all ${
          chakraConfig.enabled
            ? 'bg-purple-950/20 border-purple-500/50 shadow-sm'
            : isLight
            ? 'bg-stone-50 border-stone-200'
            : 'bg-zinc-900/50 border-zinc-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center ${
                chakraConfig.enabled
                  ? 'bg-purple-600 text-white shadow-xs'
                  : isLight
                  ? 'bg-stone-200 text-stone-600'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                Chakral Body System
              </div>
              <div className="text-[10px] opacity-70">
                Spatial coordinate morphing across 7 subtle centers
              </div>
            </div>
          </div>
          <button
            id="chakra-master-enable-toggle"
            onClick={() => updateChakra({ enabled: !chakraConfig.enabled })}
            className={`px-3 py-1 text-[11px] font-bold rounded uppercase transition-all ${
              chakraConfig.enabled
                ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-xs'
                : isLight
                ? 'bg-stone-200 hover:bg-stone-300 text-stone-700'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
            }`}
          >
            {chakraConfig.enabled ? 'ACTIVE' : 'ENABLE'}
          </button>
        </div>
      </div>

      {/* 2. Sub-tab Navigation */}
      <div
        className={`flex items-center p-0.5 rounded-lg border ${
          isLight ? 'bg-stone-100 border-stone-200' : 'bg-zinc-900 border-zinc-800'
        }`}
      >
        {[
          { id: 'system', label: 'Playback' },
          { id: 'spine', label: 'Spine Transit' },
          { id: 'coordinates', label: 'Nodes / Space' },
          { id: 'presets', label: 'Layouts' },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`chakra-subtab-${tab.id}`}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex-1 py-1 text-[10px] font-mono uppercase rounded transition-all text-center ${
              activeSubTab === tab.id
                ? isLight
                  ? 'bg-white text-stone-950 font-bold shadow-xs'
                  : 'bg-zinc-800 text-white font-bold shadow-xs'
                : 'opacity-60 hover:opacity-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: SYSTEM / PLAYBACK */}
      {activeSubTab === 'system' && (
        <div className="space-y-3">
          {/* Playback Mode Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider opacity-70 block mb-1">
              Spatial Manifestation Mode
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                id="chakra-mode-simultaneous-btn"
                onClick={() => updateChakra({ playbackMode: 'simultaneousBody' })}
                className={`p-2 rounded-lg border text-left transition-all ${
                  chakraConfig.playbackMode === 'simultaneousBody'
                    ? 'border-purple-500 bg-purple-950/30 text-purple-200'
                    : isLight
                    ? 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                <div className="font-bold text-[11px] flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-purple-400" />
                  <span>Simultaneous Body</span>
                </div>
                <p className="text-[9px] opacity-70 mt-1 leading-tight">
                  All 7 chakras active in space simultaneously with per-chakra chromatic radiance.
                </p>
              </button>

              <button
                id="chakra-mode-sequential-btn"
                onClick={() => updateChakra({ playbackMode: 'sequentialMorph' })}
                className={`p-2 rounded-lg border text-left transition-all ${
                  chakraConfig.playbackMode === 'sequentialMorph'
                    ? 'border-purple-500 bg-purple-950/30 text-purple-200'
                    : isLight
                    ? 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                <div className="font-bold text-[11px] flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Sequential Kundalini</span>
                </div>
                <p className="text-[9px] opacity-70 mt-1 leading-tight">
                  Morphs between shapes and spatial positions along the spinal meridian.
                </p>
              </button>
            </div>
          </div>

          {/* Sacred Yantra Geometric Form */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider opacity-70 block mb-1">
              Chakra Geometry Form
            </label>
            <div className={`p-2.5 rounded-lg border text-left flex items-center justify-between ${
              isLight
                ? 'border-purple-200 bg-purple-50/80 text-purple-900'
                : 'border-purple-900/60 bg-purple-950/20 text-purple-200'
            }`}>
              <div>
                <div className="font-bold text-[11px] flex items-center gap-1.5">
                  <span>☸ Sacred Yantra Geometric Form</span>
                </div>
                <p className="text-[9px] opacity-75 mt-0.5 leading-tight">
                  Authentic vector mandalas: Lotus Petals, Shatkona, Inverted Triangles, Crescent Moon & Sun Wheel.
                </p>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 whitespace-nowrap">
                Yantra Only
              </span>
            </div>
          </div>

          {/* 3D Planar Alignment: Horizontal vs Vertical */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider opacity-70 block mb-1">
              Geometric Plane Alignment
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                id="chakra-plane-horizontal-btn"
                onClick={() => updateChakra({ plane: 'horizontal' })}
                className={`p-2 rounded-lg border text-left transition-all ${
                  (chakraConfig.plane ?? 'horizontal') === 'horizontal'
                    ? 'border-purple-500 bg-purple-950/30 text-purple-200 font-bold'
                    : isLight
                    ? 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                <div className="text-[10px] flex items-center gap-1.5">
                  <Layers className="w-3 h-3 text-emerald-400" />
                  <span>Horizontal (Flat Discs)</span>
                </div>
                <p className="text-[8.5px] opacity-70 mt-0.5 leading-tight">
                  Flat discs when viewed horizontally; spin around spinal axis with camera orb.
                </p>
              </button>

              <button
                type="button"
                id="chakra-plane-vertical-btn"
                onClick={() => updateChakra({ plane: 'vertical' })}
                className={`p-2 rounded-lg border text-left transition-all ${
                  chakraConfig.plane === 'vertical'
                    ? 'border-purple-500 bg-purple-950/30 text-purple-200 font-bold'
                    : isLight
                    ? 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                <div className="text-[10px] flex items-center gap-1.5">
                  <Disc className="w-3 h-3 text-cyan-400" />
                  <span>Vertical (Frontal Face)</span>
                </div>
                <p className="text-[8.5px] opacity-70 mt-0.5 leading-tight">
                  Upright front-facing mandalas aligned directly with the camera screen.
                </p>
              </button>
            </div>
          </div>

          {/* Vortex Center Swirl Strength */}
          <div>
            <div className="flex justify-between items-center text-[9px] uppercase tracking-wider mb-0.5">
              <span className="opacity-70">Per-Chakra Vortex Center Swirl</span>
              <EditableNumber
                value={chakraConfig.vortexStrength ?? 1.6}
                onChange={(v) => updateChakra({ vortexStrength: v })}
                min={0.0}
                max={5.0}
                step={0.1}
                unit="x"
                isLight={isLight}
              />
            </div>
            <input
              id="slider-chakra-vortex-strength"
              type="range"
              min={0.0}
              max={5.0}
              step={0.1}
              value={chakraConfig.vortexStrength ?? 1.6}
              onChange={(e) => updateChakra({ vortexStrength: parseFloat(e.target.value) })}
              className="w-full accent-purple-500 cursor-pointer h-1.5"
            />
            <p className="text-[8.5px] opacity-60 mt-0.5">
              Each yantra geometry maintains its own rotational vortex torque and center point.
            </p>
          </div>

          {/* Sequential Cycle Direction (When in sequential mode) */}
          {chakraConfig.playbackMode === 'sequentialMorph' && (
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider opacity-70 block mb-1">
                Kundalini Transit Direction
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'ascent', label: 'Ascent (Root➔Crown)', icon: ArrowUp },
                  { id: 'descent', label: 'Descent (Crown➔Root)', icon: ArrowDown },
                  { id: 'pingpong', label: 'Oscillation', icon: Repeat },
                ].map((dir) => {
                  const Icon = dir.icon;
                  return (
                    <button
                      key={dir.id}
                      id={`chakra-dir-${dir.id}`}
                      onClick={() => updateChakra({ cycleDirection: dir.id as any })}
                      className={`flex items-center justify-center gap-1 py-1.5 rounded-lg border transition-all ${
                        chakraConfig.cycleDirection === dir.id
                          ? 'border-purple-500 bg-purple-950/30 text-purple-200 font-bold'
                          : isLight
                          ? 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600'
                          : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="text-[10px]">{dir.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timing Controls */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] uppercase tracking-wider opacity-70 block mb-0.5">
                Hold Duration
              </label>
              <EditableNumber
                value={chakraConfig.holdDuration ?? 1.2}
                onChange={(v) => updateChakra({ holdDuration: v })}
                min={0.1}
                max={10.0}
                step={0.1}
                unit="s"
                isLight={isLight}
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider opacity-70 block mb-0.5">
                Transition Duration
              </label>
              <EditableNumber
                value={chakraConfig.transitionDuration ?? 2.4}
                onChange={(v) => updateChakra({ transitionDuration: v })}
                min={0.2}
                max={15.0}
                step={0.2}
                unit="s"
                isLight={isLight}
              />
            </div>
          </div>

          {/* Attractor Influence & Particle Cloud Sizing */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] uppercase tracking-wider opacity-70 block mb-0.5">
                Attractor Gravity
              </label>
              <EditableNumber
                value={chakraConfig.attractorInfluence ?? 1.5}
                onChange={(v) => updateChakra({ attractorInfluence: v })}
                min={0.2}
                max={4.0}
                step={0.1}
                unit="x"
                isLight={isLight}
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider opacity-70 block mb-0.5">
                Particle Cloud Spread
              </label>
              <EditableNumber
                value={chakraConfig.particlePartitionSpread ?? 1.0}
                onChange={(v) => updateChakra({ particlePartitionSpread: v })}
                min={0.3}
                max={2.5}
                step={0.05}
                unit="x"
                isLight={isLight}
              />
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SPINE TRANSIT / LIVE KUNDALINI HUD */}
      {activeSubTab === 'spine' && (
        <div className="space-y-3">
          {/* Active Chakra HUD Banner */}
          <div
            className="p-3 rounded-lg border transition-all"
            style={{
              borderColor: `${currentNode.color}80`,
              backgroundColor: `${currentNode.color}15`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white shadow-md text-xs"
                  style={{ backgroundColor: currentNode.color }}
                >
                  {currentNode.seedSyllable}
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: currentNode.color }}>
                    {currentNode.name} · {currentNode.sanskrit}
                  </div>
                  <div className="text-[9px] opacity-80">
                    {currentNode.element} · {currentNode.frequencyHz ? `${currentNode.frequencyHz} Hz` : ''}
                  </div>
                </div>
              </div>

              {chakraConfig.playbackMode === 'sequentialMorph' && (
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-wider font-mono opacity-70">
                    {timelineState?.phase === 'hold' ? 'HOLDING' : 'TRANSITING'}
                  </div>
                  <div className="text-xs font-bold font-mono">
                    {Math.round((timelineState?.progress ?? 0) * 100)}%
                  </div>
                </div>
              )}
            </div>

            {/* Live Progress Bar */}
            {chakraConfig.playbackMode === 'sequentialMorph' && (
              <div className="mt-2 h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-75"
                  style={{
                    width: `${(timelineState?.progress ?? 0) * 100}%`,
                    backgroundColor: currentNode.color,
                  }}
                />
              </div>
            )}
          </div>

          {/* Spine Quick Step Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              id="chakra-step-prev-btn"
              onClick={() => onStepNode(-1)}
              className={`flex-1 py-1.5 rounded-lg border text-center font-bold transition-all ${
                isLight ? 'bg-stone-50 border-stone-200 hover:bg-stone-100' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              ▲ Ascent / Prev Center
            </button>
            <button
              id="chakra-step-next-btn"
              onClick={() => onStepNode(1)}
              className={`flex-1 py-1.5 rounded-lg border text-center font-bold transition-all ${
                isLight ? 'bg-stone-50 border-stone-200 hover:bg-stone-100' : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              ▼ Descent / Next Center
            </button>
          </div>

          {/* Interactive Visual Spine Diagram */}
          <div className="space-y-1">
            {(chakraConfig.nodes || CANONICAL_CHAKRAS).map((node, index) => {
              const isCurrent = timelineState?.currentIndex === index;
              return (
                <div
                  key={node.id}
                  onClick={() => onJumpToNode(index)}
                  className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                    isCurrent
                      ? 'border-purple-500 bg-purple-950/30 shadow-xs'
                      : isLight
                      ? 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                      : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: node.color }}
                    />
                    <span className="font-bold text-[11px]">{node.seedSyllable}</span>
                    <span className="text-[10px]">{node.name}</span>
                    <span className="text-[8px] opacity-60">({node.sanskrit})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] opacity-70 font-mono">y: {Math.round(node.y)}</span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                      style={{
                        backgroundColor: `${node.color}20`,
                        color: node.color,
                      }}
                    >
                      {node.frequencyHz} Hz
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: COORDINATES & SPATIAL PLACEMENT */}
      {activeSubTab === 'coordinates' && (
        <div className="space-y-2">
          <div className="text-[10px] opacity-70 mb-1">
            Place shapes anywhere in 2D space. Each node acts as an attractor vortex and morph anchor.
          </div>

          {(chakraConfig.nodes || CANONICAL_CHAKRAS).map((node) => {
            const isExpanded = expandedNodeId === node.id;
            return (
              <div
                key={node.id}
                className={`rounded-lg border transition-all overflow-hidden ${
                  isLight ? 'border-stone-200 bg-stone-50/50' : 'border-zinc-800 bg-zinc-900/40'
                }`}
              >
                <div
                  className="flex items-center justify-between p-2 cursor-pointer hover:opacity-90"
                  onClick={() => setExpandedNodeId(isExpanded ? null : node.id)}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: node.color }}
                    />
                    <span className="font-bold text-[10px]">{node.name}</span>
                    <span className="text-[9px] opacity-60">
                      ({Math.round(node.x)}, {Math.round(node.y)})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={node.active}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateNode(node.id, { active: e.target.checked });
                      }}
                      className="rounded border-zinc-700 text-purple-600 focus:ring-0"
                    />
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </div>
                </div>

                {isExpanded && (
                  <div
                    className={`p-2.5 pt-0 space-y-2 border-t ${
                      isLight ? 'border-stone-200 bg-stone-50' : 'border-zinc-800 bg-zinc-900'
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] opacity-70 block mb-0.5">X Position</label>
                        <EditableNumber
                          value={Math.round(node.x)}
                          onChange={(v) => updateNode(node.id, { x: v })}
                          min={-600}
                          max={600}
                          step={10}
                          isLight={isLight}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] opacity-70 block mb-0.5">Y Position</label>
                        <EditableNumber
                          value={Math.round(node.y)}
                          onChange={(v) => updateNode(node.id, { y: v })}
                          min={-600}
                          max={600}
                          step={10}
                          isLight={isLight}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] opacity-70 block mb-0.5">Scale Size</label>
                        <EditableNumber
                          value={node.scale ?? 1.0}
                          onChange={(v) => updateNode(node.id, { scale: v })}
                          min={0.2}
                          max={3.0}
                          step={0.1}
                          unit="x"
                          isLight={isLight}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] opacity-70 block mb-0.5">Attractor Gravity</label>
                        <EditableNumber
                          value={node.attractorStrength ?? 2.0}
                          onChange={(v) => updateNode(node.id, { attractorStrength: v })}
                          min={0.0}
                          max={5.0}
                          step={0.2}
                          unit="g"
                          isLight={isLight}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] opacity-70 block mb-0.5">Signature Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={node.color}
                          onChange={(e) => updateNode(node.id, { color: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="font-mono text-[10px]">{node.color}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SUB-TAB 4: PRESETS & SPATIAL ALIGNMENTS */}
      {activeSubTab === 'presets' && (
        <div className="space-y-2">
          <div className="text-[10px] opacity-70 mb-1">
            Choose pre-calculated spiritual and geometric alignments for the subtle body.
          </div>

          <div className="space-y-1.5">
            {[
              {
                id: 'spine_straight',
                name: 'Classical Spine Alignment',
                desc: 'Vertical meridian alignment spanning from root pelvic base (-260px) to crown lotus (+240px).',
                nodes: CHAKRA_SPATIAL_PRESETS.spine_straight,
              },
              {
                id: 'compact_torso',
                name: 'Compact Human Torso',
                desc: 'Tighter proportional spacing centered on the heart chakra.',
                nodes: CHAKRA_SPATIAL_PRESETS.compact_torso,
              },
              {
                id: 'kundalini_serpentine',
                name: 'Serpentine Kundalini Arc',
                desc: 'Sinusoidal Ida & Pingala subtle energetic spiral curving through space.',
                nodes: CHAKRA_SPATIAL_PRESETS.kundalini_serpentine,
              },
              {
                id: 'heart_centered_expansion',
                name: 'Heart-Centered Radial Mandala',
                desc: 'Anahata at origin (0, 0) with peripheral centers arranged in sacred symmetry.',
                nodes: CHAKRA_SPATIAL_PRESETS.heart_centered_expansion,
              },
            ].map((preset) => (
              <div
                key={preset.id}
                className={`p-2.5 rounded-lg border transition-all ${
                  isLight ? 'border-stone-200 bg-stone-50 hover:bg-stone-100' : 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[11px] text-purple-400">{preset.name}</div>
                    <div className="text-[9px] opacity-70 mt-0.5 leading-tight">{preset.desc}</div>
                  </div>
                  <button
                    id={`apply-chakra-preset-${preset.id}`}
                    onClick={() => applySpatialPreset(preset.nodes)}
                    className="px-2.5 py-1 text-[10px] font-bold rounded bg-purple-600 hover:bg-purple-500 text-white transition-all ml-2"
                  >
                    APPLY
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
