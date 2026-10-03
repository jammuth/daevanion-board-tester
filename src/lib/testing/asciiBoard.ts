import { type Board, type TileState, isBoardSize } from '../board'

const SYMBOLS: Record<string, TileState> = {
  x: 'off',
  o: 'on',
  g: 'passive',
  b: 'skill',
  r: 'important',
  S: 'start',
}

/** Builds a board from rows of symbols, e.g. `'r o g x ...'`. Whitespace is ignored. */
export function asciiBoard(rows: string[]): Board {
  const size = rows.length
  if (!isBoardSize(size)) throw new Error(`Unsupported board size ${size}`)
  const tiles = rows.flatMap((row) =>
    row
      .replace(/\s+/g, '')
      .split('')
      .map((symbol) => {
        const state = SYMBOLS[symbol]
        if (!state) throw new Error(`Unknown symbol "${symbol}"`)
        return state
      }),
  )
  if (tiles.length !== size * size) throw new Error('Board rows must be square')
  return { size, tiles }
}

/** Example board taken from an in-game screenshot. */
export const SCREENSHOT_BOARD = asciiBoard([
  'r o g x o b o g o o r',
  'o x o o o x o x o x o',
  'o b o x b o o o b o g',
  'x o x x o x g x x o x',
  'o o o g o o o o b o o',
  'b x x o x S x o x x b',
  'o o b o o o o g o o o',
  'x o x x g x o x x o x',
  'g o b o o o b x o b o',
  'o x o x o x o o o x o',
  'r o o g o b o x g o r',
])
