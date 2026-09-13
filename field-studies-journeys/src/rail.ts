import type {Tool} from './model.js';
export type RailItem = Tool | 'objects';
/** Repeated activation is a three-position switch, not an idempotent open command. */
export function railClick(current: RailItem, requested: RailItem, expanded: boolean): 'activate'|'close'|'interact' {
  if (requested === 'interact') return 'interact';
  if (requested !== current) return 'activate';
  return expanded ? 'close' : 'interact';
}
