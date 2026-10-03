import { describe, expect, it } from 'vitest'
import { createBoard } from '../board'
import { SCREENSHOT_BOARD, asciiBoard } from '../testing/asciiBoard'
import {
  bruteForceMinConnectors,
  expectValidAllocation,
  fixedTargetCost,
  randomBoard,
  seededRandom,
} from '../testing/solverChecks'
import { solveExact } from './exact'
import { solveHeuristic } from './heuristic'

const EMPTY_ROW = 'x x x x x x x x x x x'

describe('solveExact', () => {
  it('allocates only the start tile when there are no targets', () => {
    expect(solveExact(createBoard(11))).toEqual({
      status: 'ok',
      allocated: [60],
      connectors: [],
      cost: 0,
      optimal: true,
    })
  })

  it('reports targets cut off by off tiles', () => {
    const board = asciiBoard([
      'b x x x x x x x x x x',
      ...Array(4).fill(EMPTY_ROW),
      'x x x x x S o g x x x',
      ...Array(4).fill(EMPTY_ROW),
      'x x x x x x x x x x r',
    ])
    expect(solveExact(board)).toEqual({ status: 'unreachable', unreachable: [0, 120] })
  })

  it('takes the route with fewer grey tiles', () => {
    const result = solveExact(
      asciiBoard([
        ...Array(3).fill(EMPTY_ROW),
        'x x x o o o b x x x x',
        'x x x o x x o x x x x',
        'x x x o o S o x x x x',
        ...Array(5).fill(EMPTY_ROW),
      ]),
    )
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.connectors).toEqual([50, 61])
    expect(result.cost).toBe(5)
  })

  it('matches brute force where targets can share a trunk', () => {
    const board = asciiBoard([
      EMPTY_ROW,
      'x x x x x x x x x x x',
      'x x g o o o o o g x x',
      'x x o x x o x x o x x',
      'x x o x x x x x o x x',
      'x x o o o S o o o x x',
      ...Array(5).fill(EMPTY_ROW),
    ])
    const exact = solveExact(board)
    const heuristic = solveHeuristic(board)
    if (exact.status !== 'ok' || heuristic.status !== 'ok') throw new Error('expected ok')
    expectValidAllocation(board, exact.allocated)
    expect(exact.connectors).toHaveLength(bruteForceMinConnectors(board)!)
    expect(exact.cost).toBeLessThanOrEqual(heuristic.cost)
  })

  const smallBoards = Array.from({ length: 200 }, (_, seed) =>
    randomBoard(11, seededRandom(seed), { off: 3, on: 6, passive: 1, skill: 1, important: 1 }, 3),
  )
    .filter((board) => board.tiles.filter((t) => t === 'on').length <= 16)
    .slice(0, 150)

  it.each(smallBoards.map((board, i) => [i, board] as const))(
    'matches brute force on small random board %i',
    (_, board) => {
      const result = solveExact(board)
      const expected = bruteForceMinConnectors(board)
      if (expected === null) {
        expect(result.status).toBe('unreachable')
        return
      }
      if (result.status !== 'ok') throw new Error('expected ok')
      expectValidAllocation(board, result.allocated)
      expect(result.connectors).toHaveLength(expected)
      expect(result.cost).toBe(fixedTargetCost(board) + expected)
    },
  )

  it.each([
    [11, 1],
    [11, 2],
    [13, 3],
    [13, 4],
    [13, 5],
  ] as const)('is valid and never worse than the heuristic on a full %ix%i board', (size, seed) => {
    const board = randomBoard(size, seededRandom(1000 + seed), {
      off: 2,
      on: 5,
      passive: 1,
      skill: 1,
      important: 0.3,
    })
    const exact = solveExact(board)
    const heuristic = solveHeuristic(board)
    expect(exact.status).toBe(heuristic.status)
    if (exact.status !== 'ok' || heuristic.status !== 'ok') return
    expectValidAllocation(board, exact.allocated)
    expect(exact.cost).toBeLessThanOrEqual(heuristic.cost)
  })

  it('solves the screenshot board at least as well as the heuristic', () => {
    const exact = solveExact(SCREENSHOT_BOARD)
    const heuristic = solveHeuristic(SCREENSHOT_BOARD)
    if (exact.status !== 'ok' || heuristic.status !== 'ok') throw new Error('expected ok')
    expectValidAllocation(SCREENSHOT_BOARD, exact.allocated)
    expect(exact.optimal).toBe(true)
    expect(exact.cost).toBe(fixedTargetCost(SCREENSHOT_BOARD) + exact.connectors.length)
    expect(exact.cost).toBeLessThanOrEqual(heuristic.cost)
  })

  it('handles a fully open 11x11 board with targets in every corner', () => {
    const board = createBoard(11)
    board.tiles.fill('on')
    board.tiles[60] = 'start'
    for (const corner of [0, 10, 110, 120]) board.tiles[corner] = 'important'
    const result = solveExact(board)
    if (result.status !== 'ok') throw new Error('expected ok')
    expectValidAllocation(board, result.allocated)
    // The minimum rectilinear Steiner tree on a square's corners is an "H": two full sides
    // (11 + 11) joined through the centre row (9) = 31 tiles, less 4 corners and the start.
    expect(result.connectors).toHaveLength(26)
  })

  it('finds the 2-point saving on the screenshot board', () => {
    const result = solveExact(SCREENSHOT_BOARD)
    if (result.status !== 'ok') throw new Error('expected ok')
    expect(result.cost).toBe(106)
  })
})
