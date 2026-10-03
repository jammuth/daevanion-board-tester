import { type Board, TILE_COST, centreIndex, isTarget, neighbours } from '../board'
import {
  type SolveResult,
  buildResult,
  findUnreachableTargets,
  marginalCost,
  reachableFrom,
} from './common'

/**
 * Shortest-path heuristic for the node-weighted Steiner tree: grow a tree from the
 * start tile by repeatedly attaching the cheapest-to-reach remaining target, then drop
 * any grey tile the tree doesn't need. Not guaranteed optimal.
 */
export function solveHeuristic(board: Board): SolveResult {
  const unreachable = findUnreachableTargets(board)
  if (unreachable.length > 0) return { status: 'unreachable', unreachable }

  const root = centreIndex(board.size)
  const tree = new Set<number>([root])
  const remaining = new Set(board.tiles.flatMap((state, i) => (isTarget(state) ? [i] : [])))

  while (remaining.size > 0) {
    const path = cheapestPathToTarget(board, tree, remaining)
    for (const index of path) {
      tree.add(index)
      remaining.delete(index)
    }
  }

  pruneRedundantConnectors(board, root, tree)
  return buildResult(board.tiles, tree, false)
}

/** 0-1 BFS, since marginal costs are only ever 0 or 1. */
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
