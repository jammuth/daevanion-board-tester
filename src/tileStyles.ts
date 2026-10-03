import type { TileState } from './lib/board'

export const TILE_LABEL: Record<TileState, string> = {
  off: 'Off',
  on: 'On',
  passive: 'Passive',
  skill: 'Skill',
  important: 'Important',
  start: 'Start',
}

export const TILE_CLASS: Record<TileState, string> = {
  off: 'bg-black border-slate-800',
  on: 'bg-slate-500 border-slate-400',
  passive: 'bg-green-600 border-green-400',
  skill: 'bg-blue-600 border-blue-400',
  important: 'bg-orange-500 border-orange-300',
  start: 'bg-amber-300 border-amber-100',
}
