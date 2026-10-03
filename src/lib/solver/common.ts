import { type Board, type TileState, TILE_COST, centreIndex, isTarget, neighbours } from '../board'

export type SolveResult =
  | {
      status: 'ok'
      /** Every allocated tile, including the start tile and all targets. */
      allocated: number[]
      /** The grey tiles the solver chose to connect the targets. */
      connectors: number[]
      cost: number
      /** True when the cost is proven to be the minimum. */
      optimal: boolean
    }
  | { status: 'unreachable'; unreachable: number[] }

/**
 * Targets are always paid for, so passing through one is free from the optimiser's point
 * of view; only grey tiles add marginal cost.
 */
export function marginalCost(state: TileState): number {
  return state === 'on' ? 1 : 0
}

export function reachableFrom(
  board: Board,
  root: number,
  allowed: (index: number) => boolean,
): Set<number> {
  const seen = new Set<number>([root])
  const stack = [root]
  while (stack.length > 0) {
    const current = stack.pop()!
    for (const next of neighbours(board.size, current)) {
      if (seen.has(next) || TILE_COST[board.tiles[next]!] === null || !allowed(next)) continue
      seen.add(next)
      stack.push(next)
    }
  }
  return seen
}

export function findUnreachableTargets(board: Board): number[] {
  const reachable = reachableFrom(board, centreIndex(board.size), () => true)
  return board.tiles.flatMap((state, i) => (isTarget(state) && !reachable.has(i) ? [i] : []))
}

export function buildResult(
  tiles: TileState[],
  allocatedTiles: Iterable<number>,
  optimal: boolean,
): SolveResult {
  const allocated = [...allocatedTiles].sort((a, b) => a - b)
  return {
    status: 'ok',
    allocated,
    connectors: allocated.filter((i) => tiles[i] === 'on'),
    cost: allocated.reduce((sum, i) => sum + TILE_COST[tiles[i]!]!, 0),
    optimal,
  }
}
