import { describe, expect, it } from 'vitest'
import { centreIndex, createBoard, neighbours, paintTile } from './board'

describe('board', () => {
  it('places the start tile in the centre of each size', () => {
    expect(centreIndex(11)).toBe(60)
    expect(centreIndex(13)).toBe(84)
    expect(createBoard(11).tiles[60]).toBe('start')
    expect(createBoard(13).tiles[84]).toBe('start')
  })

  it('creates every other tile as off', () => {
    const board = createBoard(11)
    expect(board.tiles.filter((t) => t === 'off')).toHaveLength(120)
  })

  it('paints tiles but never the start tile', () => {
    const board = createBoard(11)
    paintTile(board, 0, 'skill')
    paintTile(board, 60, 'on')
    expect(board.tiles[0]).toBe('skill')
    expect(board.tiles[60]).toBe('start')
  })

  it('returns only orthogonal in-bounds neighbours', () => {
    expect(neighbours(11, 0).sort((a, b) => a - b)).toEqual([1, 11])
    expect(neighbours(11, 10).sort((a, b) => a - b)).toEqual([9, 21])
    expect(neighbours(11, 60).sort((a, b) => a - b)).toEqual([49, 59, 61, 71])
  })
})
