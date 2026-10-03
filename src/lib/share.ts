import { type Board, PAINT_STATES, centreIndex, createBoard, isBoardSize } from './board'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'
const STATE_COUNT = PAINT_STATES.length

/**
 * Packs two tiles per URL-safe character (5 states × 5 states = 25 < 64), giving
 * `<size>.<61 or 85 chars>`. The start tile is always the centre, so it isn't stored.
 */
export function encodeBoard(board: Board): string {
  const centre = centreIndex(board.size)
  const codes = board.tiles.map((state, i) =>
    i === centre || state === 'start' ? 0 : PAINT_STATES.indexOf(state),
  )
  let packed = ''
  for (let i = 0; i < codes.length; i += 2) {
    packed += ALPHABET[codes[i]! * STATE_COUNT + (codes[i + 1] ?? 0)]
  }
  return `${board.size}.${packed}`
}

export function decodeBoard(encoded: string): Board | null {
  const [sizeText, packed, ...rest] = encoded.split('.')
  const size = Number(sizeText)
  if (rest.length > 0 || packed === undefined || !isBoardSize(size)) return null
  const tileCount = size * size
  if (packed.length !== Math.ceil(tileCount / 2)) return null

  const board = createBoard(size)
  const centre = centreIndex(size)
  for (let c = 0; c < packed.length; c++) {
    const value = ALPHABET.indexOf(packed[c]!)
    if (value < 0 || value >= STATE_COUNT * STATE_COUNT) return null
    const pair = [Math.floor(value / STATE_COUNT), value % STATE_COUNT]
    pair.forEach((code, offset) => {
      const index = c * 2 + offset
      if (index < tileCount && index !== centre) board.tiles[index] = PAINT_STATES[code]!
    })
  }
  return board
}

export interface SharedBoard {
  title: string
  board: Board
}

export function buildShareHash({ title, board }: SharedBoard): string {
  return '#' + new URLSearchParams({ t: title, b: encodeBoard(board) }).toString()
}

export function parseShareHash(hash: string): SharedBoard | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const encoded = params.get('b')
  if (!encoded) return null
  const board = decodeBoard(encoded)
  if (!board) return null
  return { title: params.get('t') ?? '', board }
}
