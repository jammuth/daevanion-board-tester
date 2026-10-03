import { describe, expect, it } from 'vitest'
import { createBoard } from './board'
import { buildShareHash, decodeBoard, encodeBoard, parseShareHash } from './share'
import { SCREENSHOT_BOARD } from './testing/asciiBoard'

describe('board encoding', () => {
  it('round-trips the screenshot board', () => {
    expect(decodeBoard(encodeBoard(SCREENSHOT_BOARD))).toEqual(SCREENSHOT_BOARD)
  })

  it('round-trips a 13x13 board using every state', () => {
    const board = createBoard(13)
    board.tiles.forEach((_, i) => {
      if (board.tiles[i] !== 'start') {
        board.tiles[i] = (['off', 'on', 'passive', 'skill', 'important'] as const)[i % 5]!
      }
    })
    expect(decodeBoard(encodeBoard(board))).toEqual(board)
  })

  it('stays short enough for a URL', () => {
    expect(encodeBoard(createBoard(11))).toHaveLength(3 + 61)
    expect(encodeBoard(createBoard(13))).toHaveLength(3 + 85)
  })

  it.each(['', '12.AAAA', '11.AAA', `11.${'~'.repeat(61)}`, `11.${'z'.repeat(61)}`, '11.A.A'])(
    'rejects malformed input %j',
    (input) => {
      expect(decodeBoard(input)).toBeNull()
    },
  )
})

describe('share hash', () => {
  it('round-trips a title with special characters', () => {
    const shared = { title: 'Gladiator PvP & PvE #2', board: SCREENSHOT_BOARD }
    expect(parseShareHash(buildShareHash(shared))).toEqual(shared)
  })

  it('returns null when there is no board in the hash', () => {
    expect(parseShareHash('')).toBeNull()
    expect(parseShareHash('#t=hello')).toBeNull()
  })
})
