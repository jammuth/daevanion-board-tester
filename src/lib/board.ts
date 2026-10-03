export const PAINT_STATES = ['off', 'on', 'passive', 'skill', 'important'] as const
export type PaintState = (typeof PAINT_STATES)[number]
export type TileState = PaintState | 'start'

export const BOARD_SIZES = [11, 13] as const
export type BoardSize = (typeof BOARD_SIZES)[number]

export interface Board {
  size: BoardSize
  tiles: TileState[]
}

/** Points spent to allocate a tile; `null` means the tile can never be allocated. */
export const TILE_COST: Record<TileState, number | null> = {
  off: null,
  on: 1,
  passive: 2,
  skill: 3,
  important: 4,
  start: 0,
}

export function isBoardSize(value: unknown): value is BoardSize {
  return BOARD_SIZES.includes(value as BoardSize)
}

export function centreIndex(size: BoardSize): number {
  const mid = (size - 1) / 2
  return mid * size + mid
}

export function isTarget(state: TileState): boolean {
  return state === 'passive' || state === 'skill' || state === 'important'
}

/** New boards default to all grey: carving out the few black tiles is less work than painting every node. */
export function createBoard(size: BoardSize, fill: PaintState = 'on'): Board {
  const tiles: TileState[] = Array.from({ length: size * size }, () => fill)
  tiles[centreIndex(size)] = 'start'
  return { size, tiles }
}

export function isFreshBoard(board: Board): boolean {
  const centre = centreIndex(board.size)
  return board.tiles.every((tile, i) => (i === centre ? tile === 'start' : tile === 'on'))
}

export function paintTile(board: Board, index: number, state: PaintState): void {
  if (index === centreIndex(board.size)) return
  board.tiles[index] = state
}

export function neighbours(size: BoardSize, index: number): number[] {
  const row = Math.floor(index / size)
  const col = index % size
  const result: number[] = []
  if (row > 0) result.push(index - size)
  if (row < size - 1) result.push(index + size)
  if (col > 0) result.push(index - 1)
  if (col < size - 1) result.push(index + 1)
  return result
}
