/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { PointCloudConfig } from '../engine/types';
import { PointCloudField, DEFAULT_CONFIG } from '../engine/PointCloudField';

export interface PointCloudComponentProps extends Partial<PointCloudConfig> {
  className?: string;
  styleObj?: React.CSSProperties;
  onEngineReady?: (engine: PointCloudField) => void;
}

export interface PointCloudComponentRef {
  getEngine: () => PointCloudField | null;
  triggerDisperse: (strength?: number) => void;
  setMorphProgress: (progress: number) => void;
}

export const PointCloudComponent = forwardRef<PointCloudComponentRef, PointCloudComponentProps>(
  (props, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const engineRef = useRef<PointCloudField | null>(null);

    const {
      className = '',
      styleObj,
      onEngineReady,
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
      props.autoMorph,
      props.autoMorphDuration,
    ]);

    const positionClass =
      positioning === 'fixed'
        ? 'fixed inset-0'
        : positioning === 'relative'
        ? 'relative'
        : 'absolute inset-0';

    return (
      <canvas
        ref={canvasRef}
        id="point-cloud-canvas"
        className={`w-full h-full block select-none pointer-events-auto touch-none ${positionClass} ${className}`}
        style={styleObj}
      />
    );
  }
);

PointCloudComponent.displayName = 'PointCloudField';
export default PointCloudComponent;
