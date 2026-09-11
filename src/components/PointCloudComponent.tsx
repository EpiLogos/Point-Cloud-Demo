/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import { PointCloudConfig, ChainTimelineState, BackgroundAtmosphereMode } from '../engine/types';
import { PointCloudField, DEFAULT_CONFIG } from '../engine/PointCloudField';
import { computeBackgroundCSS } from '../engine/colorPalettes';

export interface PointCloudComponentProps extends Partial<PointCloudConfig> {
  className?: string;
  styleObj?: React.CSSProperties;
  backgroundColor?: string;
  backgroundMode?: BackgroundAtmosphereMode;
  backgroundGlowIntensity?: number;
  onEngineReady?: (engine: PointCloudField) => void;
  onChainUpdate?: (state: ChainTimelineState) => void;
}

export interface PointCloudComponentRef {
  getEngine: () => PointCloudField | null;
  triggerDisperse: (strength?: number) => void;
  setMorphProgress: (progress: number) => void;
  jumpToChainLink: (index: number) => void;
  stepChain: (direction: 1 | -1) => void;
  setChainPaused: (paused: boolean) => void;
  scrubChainProgress: (progress: number) => void;
}

export const PointCloudComponent = forwardRef<PointCloudComponentRef, PointCloudComponentProps>(
  (props, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const engineRef = useRef<PointCloudField | null>(null);

    const {
      className = '',
      styleObj,
      onEngineReady,
      onChainUpdate,
      positioning = 'absolute',
      ...configOverrides
    } = props;

    useImperativeHandle(ref, () => ({
      getEngine: () => engineRef.current,
      triggerDisperse: (strength?: number) => {
        engineRef.current?.triggerDisperse(strength);
      },
      setMorphProgress: (progress: number) => {
        engineRef.current?.setMorphProgress(progress);
      },
      jumpToChainLink: (index: number) => {
        engineRef.current?.jumpToChainLink(index);
      },
      stepChain: (direction: 1 | -1) => {
        engineRef.current?.stepChain(direction);
      },
      setChainPaused: (paused: boolean) => {
        engineRef.current?.setChainPaused(paused);
      },
      scrubChainProgress: (progress: number) => {
        engineRef.current?.scrubChainProgress(progress);
      },
    }));

    useEffect(() => {
      if (!canvasRef.current) return;

      const engine = new PointCloudField(canvasRef.current, {
        ...DEFAULT_CONFIG,
        ...configOverrides,
        positioning,
      });

      engineRef.current = engine;
      if (onEngineReady) {
        onEngineReady(engine);
      }
      if (onChainUpdate) {
        engine.setOnChainUpdate(onChainUpdate);
      }

      // ResizeObserver to handle fluid container resizing
      const resizeObserver = new ResizeObserver(() => {
        engine.resize();
      });

      if (canvasRef.current.parentElement) {
        resizeObserver.observe(canvasRef.current.parentElement);
      }

      return () => {
        resizeObserver.disconnect();
        engine.destroy();
        engineRef.current = null;
      };
    }, []);

    // Update onChainUpdate listener if it changes
    useEffect(() => {
      if (engineRef.current && onChainUpdate) {
        engineRef.current.setOnChainUpdate(onChainUpdate);
      }
    }, [onChainUpdate]);

    // Reactively update config when props change without tearing down the WebGL context
    useEffect(() => {
      if (engineRef.current) {
        engineRef.current.updateConfig(configOverrides);
      }
    }, [
      props.glyph,
      props.particleCount,
      props.fontFamily,
      props.colorMode,
      props.style,
      props.dotShape,
      props.particleSize?.min,
      props.particleSize?.max,
      props.fluid?.curlScale,
      props.fluid?.curlSpeed,
      props.fluid?.vortexStrength,
      props.fluid?.viscosity,
      props.fluid?.returnSpeed,
      props.fluid?.turbulence,
      props.fluid?.dispersion,
      props.interaction?.radius,
      props.interaction?.strength,
      props.interaction?.mode,
      props.relational?.enabled,
      props.relational?.mode,
      props.relational?.attractorCount,
      props.relational?.attractorGravity,
      props.relational?.orbitSpeed,
      props.relational?.orbitRadius,
      props.relational?.relationalSpin,
      props.relational?.chaosFactor,
      props.relational?.wanderSpeed,
      props.chaining?.enabled,
      props.chaining?.mode,
      props.chaining?.stepHoldDuration,
      props.chaining?.transitionDuration,
      props.chaining?.easing,
      props.chaining?.timingJitter,
      props.chaining?.disperseImpulse,
      props.chaining?.paused,
      JSON.stringify(props.chaining?.chain),
      props.color?.enabled,
      props.color?.mode,
      props.color?.primaryColor,
      props.color?.secondaryColor,
      props.color?.accentColor,
      props.color?.cycleSpeed,
      props.color?.waveFrequency,
      props.color?.angle,
      props.color?.turbulenceModulation,
      props.color?.speedReactiveIntensity,
      props.color?.densityWeight,
      props.color?.hueShiftSpeed,
      props.color?.contrast,
      props.color?.fieldCenterOffset?.[0],
      props.color?.fieldCenterOffset?.[1],
      props.color?.backgroundColor,
      props.color?.backgroundMode,
      props.color?.backgroundGlowIntensity,
      props.backgroundColor,
      props.backgroundMode,
      props.backgroundGlowIntensity,
      props.autoMorph,
      props.autoMorphDuration,
    ]);

    const positionClass =
      positioning === 'fixed'
        ? 'fixed inset-0'
        : positioning === 'relative'
        ? 'relative'
        : 'absolute inset-0';

    const effectiveBgColor = props.backgroundColor || props.color?.backgroundColor;
    const effectiveBgMode = props.backgroundMode || props.color?.backgroundMode || 'ambientGlow';
    const effectiveGlowIntensity =
      props.backgroundGlowIntensity ?? props.color?.backgroundGlowIntensity ?? 0.45;

    const backgroundCss = useMemo(() => {
      return computeBackgroundCSS({
        backgroundColor: effectiveBgColor,
        backgroundMode: effectiveBgMode,
        glowColor: props.color?.primaryColor || '#00f0ff',
        accentColor: props.color?.accentColor || '#ffe600',
        glowIntensity: effectiveGlowIntensity,
        isLightModeFallback: props.colorMode === 'blackOnWhite',
      });
    }, [
      effectiveBgColor,
      effectiveBgMode,
      effectiveGlowIntensity,
      props.color?.primaryColor,
      props.color?.accentColor,
      props.colorMode,
    ]);

    return (
      <canvas
        ref={canvasRef}
        id="point-cloud-canvas"
        className={`w-full h-full block select-none pointer-events-auto touch-none ${positionClass} ${className}`}
        style={{
          background: backgroundCss,
          transition: 'background 0.4s ease-out',
          ...styleObj,
        }}
      />
    );
  }
);

PointCloudComponent.displayName = 'PointCloudField';
export default PointCloudComponent;
