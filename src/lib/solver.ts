import { type Board, type TileState, TILE_COST, centreIndex, isTarget, neighbours } from './board'

export type SolveResult =
  | {
      status: 'ok'
      /** Every allocated tile, including the start tile and all targets. */
      allocated: number[]
      /** The grey tiles the solver chose to connect the targets. */
      connectors: number[]
      cost: number
    }
  | { status: 'unreachable'; unreachable: number[] }

/**
 * Shortest-path heuristic for the node-weighted Steiner tree: grow a tree from the
 * start tile by repeatedly attaching the cheapest-to-reach remaining target, then drop
 * any grey tile the tree doesn't need. Not guaranteed optimal.
 */
export function solveHeuristic(board: Board): SolveResult {
  const { size, tiles } = board
  const root = centreIndex(size)
  const targets = tiles.flatMap((state, i) => (isTarget(state) ? [i] : []))

  const reachable = reachableFrom(board, root, () => true)
  const unreachable = targets.filter((t) => !reachable.has(t))
  if (unreachable.length > 0) return { status: 'unreachable', unreachable }

  const tree = new Set<number>([root])
  const remaining = new Set(targets)

  while (remaining.size > 0) {
    const path = cheapestPathToTarget(board, tree, remaining)
    for (const index of path) {
      tree.add(index)
      remaining.delete(index)
    }
  }

  pruneRedundantConnectors(board, root, tree)
  return buildResult(tiles, tree)
}

/**
 * Targets are always paid for, so passing through one is free from the optimiser's point
 * of view; only grey tiles add marginal cost. That makes this a 0-1 BFS.
 */
function marginalCost(state: TileState): number {
  return state === 'on' ? 1 : 0
}

function cheapestPathToTarget(board: Board, tree: Set<number>, remaining: Set<number>): number[] {
  const { size, tiles } = board
  const dist = new Map<number, number>()
  const prev = new Map<number, number>()
  const deque: number[] = []
  for (const index of tree) {
    dist.set(index, 0)
    deque.push(index)
  }

  while (deque.length > 0) {
    const current = deque.shift()!
    if (remaining.has(current)) {
      const path: number[] = []
      for (
        let at: number | undefined = current;
        at !== undefined && !tree.has(at);
        at = prev.get(at)
      ) {
        path.push(at)
      }
      return path
    }
    const currentDist = dist.get(current)!
    for (const next of neighbours(size, current)) {
      const state = tiles[next]!
      if (TILE_COST[state] === null) continue
      const weight = marginalCost(state)
      const candidate = currentDist + weight
      if (candidate < (dist.get(next) ?? Infinity)) {
        dist.set(next, candidate)
        prev.set(next, current)
        if (weight === 0) deque.unshift(next)
        else deque.push(next)
      }
    }
  }

  throw new Error('Remaining target is unreachable; reachability should have been checked first')
}

function pruneRedundantConnectors(board: Board, root: number, tree: Set<number>): void {
  let changed = true
  while (changed) {
    changed = false
    for (const index of [...tree]) {
      if (board.tiles[index] !== 'on') continue
      tree.delete(index)
      if (reachableFrom(board, root, (i) => tree.has(i)).size === tree.size) {
        changed = true
      } else {
        tree.add(index)
      }
    }
  }
}

function reachableFrom(
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

function buildResult(tiles: TileState[], tree: Set<number>): SolveResult {
  const allocated = [...tree].sort((a, b) => a - b)
  return {
    status: 'ok',
    allocated,
    connectors: allocated.filter((i) => tiles[i] === 'on'),
    cost: allocated.reduce((sum, i) => sum + TILE_COST[tiles[i]!]!, 0),
  }
}
