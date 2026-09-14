import type { Entity, SequenceState } from './fieldModel';
import { effectiveLinks, resolveSequence } from './fieldModel';

export interface EvaluatedEntityPose {
  entityId: string;
  x: number;
  y: number;
  z: number;
  sequence: SequenceState;
}

/**
 * Single source of truth for an entity's authored/evaluated world centre.
 * Formations, pins, force emitters and semantic carriers consume this same pose.
 */
export function resolveEntityPose(
  entity: Entity,
  simTime: number,
  drivePhase: number,
  manualMorph: number,
  holdRatio: number
): EvaluatedEntityPose {
  const sequence = resolveSequence(entity, simTime, drivePhase, manualMorph, holdRatio);
  const links = effectiveLinks(entity);
  const a = links[sequence.linkIndex];
  const b = links[sequence.nextIndex];
  const t = sequence.progress;
  return {
    entityId: entity.id,
    x: entity.x + (a?.x ?? 0) * (1 - t) + (b?.x ?? 0) * t,
    y: entity.y + (a?.y ?? 0) * (1 - t) + (b?.y ?? 0) * t,
    z: entity.z + (a?.z ?? 0) * (1 - t) + (b?.z ?? 0) * t,
    sequence,
  };
}
