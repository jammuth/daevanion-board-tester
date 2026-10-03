import { describe, expect, it } from 'vitest'
import { type Board, TILE_COST, centreIndex, isTarget, neighbours } from './board'
import { solveHeuristic } from './solver'
import { SCREENSHOT_BOARD, asciiBoard } from './testing/asciiBoard'

function expectValidAllocation(board: Board, allocated: number[]) {
  const set = new Set(allocated)
  const root = centreIndex(board.size)
  expect(set.has(root)).toBe(true)
  board.tiles.forEach((state, i) => {
    if (isTarget(state)) expect(set.has(i)).toBe(true)
  })
  for (const i of set) expect(TILE_COST[board.tiles[i]!]).not.toBeNull()

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
  expect(seen.size).toBe(set.size)
}

const EMPTY_ROW = 'x x x x x x x x x x x'

describe('solveHeuristic', () => {
  it('allocates only the start tile when there are no targets', () => {
    const result = solveHeuristic(
      asciiBoard([
        ...Array(5).fill(EMPTY_ROW),
        'x x x x x S x x x x x',
        ...Array(5).fill(EMPTY_ROW),
      ]),
    )
    expect(result).toEqual({ status: 'ok', allocated: [60], connectors: [], cost: 0 })
  })

  it('charges the tile cost for each target and nothing for the start', () => {
    const result = solveHeuristic(
      asciiBoard([
        ...Array(4).fill(EMPTY_ROW),
        'x x x x x r x x x x x',
        'x x x x g S b x x x x',
        ...Array(5).fill(EMPTY_ROW),
      ]),
    )
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.cost).toBe(4 + 2 + 3)
    expect(result.connectors).toEqual([])
  })

  it('takes the route with fewer grey tiles', () => {
    const board = asciiBoard([
      ...Array(3).fill(EMPTY_ROW),
      'x x x o o o b x x x x',
      'x x x o x x o x x x x',
      'x x x o o S o x x x x',
      ...Array(5).fill(EMPTY_ROW),
    ])
    const result = solveHeuristic(board)
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.connectors).toEqual([50, 61])
    expect(result.cost).toBe(2 + 3)
  })

  it('routes through targets instead of extra grey tiles', () => {
    const board = asciiBoard([
      ...Array(3).fill(EMPTY_ROW),
      'x x x x b o o o x x x',
      'x x x x g x x o x x x',
      'x x x x o S o o x x x',
      ...Array(5).fill(EMPTY_ROW),
    ])
    const result = solveHeuristic(board)
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.connectors).toEqual([59])
    expect(result.cost).toBe(1 + 2 + 3)
  })

  it('shares connectors between targets', () => {
    const board = asciiBoard([
      ...Array(3).fill(EMPTY_ROW),
      'x x x x g o g x x x x',
      'x x x x x o x x x x x',
      'x x x x x S x x x x x',
      ...Array(5).fill(EMPTY_ROW),
    ])
    const result = solveHeuristic(board)
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expect(result.connectors).toEqual([38, 49])
    expect(result.cost).toBe(2 + 2 + 2)
  })

  it('reports targets cut off by off tiles', () => {
    const board = asciiBoard([
      'b x x x x x x x x x x',
      ...Array(4).fill(EMPTY_ROW),
      'x x x x x S o g x x x',
      ...Array(4).fill(EMPTY_ROW),
      'x x x x x x x x x x r',
    ])
    expect(solveHeuristic(board)).toEqual({ status: 'unreachable', unreachable: [0, 120] })
  })

  it('produces a connected allocation covering every target on the screenshot board', () => {
    const result = solveHeuristic(SCREENSHOT_BOARD)
    expect(result.status).toBe('ok')
    if (result.status !== 'ok') return
    expectValidAllocation(SCREENSHOT_BOARD, result.allocated)

    const targetCost = SCREENSHOT_BOARD.tiles.reduce(
      (sum, state) => sum + (isTarget(state) ? TILE_COST[state]! : 0),
      0,
    )
    expect(result.cost).toBe(targetCost + result.connectors.length)
  })

  it('leaves no grey tile that could be removed', () => {
    const result = solveHeuristic(SCREENSHOT_BOARD)
    if (result.status !== 'ok') throw new Error('expected ok')
    for (const connector of result.connectors) {
      const without = result.allocated.filter((i) => i !== connector)
      expect(() => expectValidAllocation(SCREENSHOT_BOARD, without)).toThrow()
    }
  })
})
