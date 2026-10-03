import { expect } from 'vitest'
import {
  type Board,
  type BoardSize,
  type PaintState,
  TILE_COST,
  centreIndex,
  createBoard,
  isTarget,
  neighbours,
} from '../board'

export function isConnectedAllocation(board: Board, allocated: Iterable<number>): boolean {
  const set = new Set(allocated)
  const root = centreIndex(board.size)
  if (!set.has(root)) return false
  if (board.tiles.some((state, i) => isTarget(state) && !set.has(i))) return false
  if ([...set].some((i) => TILE_COST[board.tiles[i]!] === null)) return false

  const seen = new Set([root])
  const stack = [root]
  while (stack.length) {
    for (const next of neighbours(board.size, stack.pop()!)) {
      if (set.has(next) && !seen.has(next)) {
        seen.add(next)
        stack.push(next)
      }
    }
  }
  return seen.size === set.size
}

export function expectValidAllocation(board: Board, allocated: number[]): void {
  expect(isConnectedAllocation(board, allocated)).toBe(true)
}

export function fixedTargetCost(board: Board): number {
  return board.tiles.reduce((sum, state) => sum + (isTarget(state) ? TILE_COST[state]! : 0), 0)
}

/** Deterministic PRNG (mulberry32) so random-board tests are reproducible. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomBoard(
  size: BoardSize,
  random: () => number,
  weights: Partial<Record<PaintState, number>>,
  radius = Infinity,
): Board {
  const board = createBoard(size)
  const mid = (size - 1) / 2
  const entries = Object.entries(weights) as [PaintState, number][]
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  board.tiles.forEach((state, i) => {
    const distance = Math.abs(Math.floor(i / size) - mid) + Math.abs((i % size) - mid)
    if (state === 'start' || distance > radius) return
    let roll = random() * total
    for (const [paint, weight] of entries) {
      roll -= weight
      if (roll < 0) {
        board.tiles[i] = paint
        break
      }
    }
  })
  return board
}

/** Tries every subset of grey tiles; only usable when there are few of them. */
export function bruteForceMinConnectors(board: Board): number | null {
  const greys = board.tiles.flatMap((state, i) => (state === 'on' ? [i] : []))
  if (greys.length > 16) throw new Error('Too many grey tiles to brute force')
  const base = board.tiles.flatMap((state, i) => (state === 'start' || isTarget(state) ? [i] : []))

  let best: number | null = null
  for (let mask = 0; mask < 1 << greys.length; mask++) {
    let count = 0
    const chosen = [...base]
    greys.forEach((index, bit) => {
      if (mask & (1 << bit)) {
        chosen.push(index)
        count++
      }
    })
    if ((best === null || count < best) && isConnectedAllocation(board, chosen)) best = count
  }
  return best
}
