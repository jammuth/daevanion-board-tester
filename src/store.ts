import { reactive, toRaw, watch } from 'vue'
import { type Board, type BoardSize, type PaintState, createBoard, paintTile } from './lib/board'
import { buildShareHash, parseShareHash } from './lib/share'
import { type SolveResult, solveHeuristic } from './lib/solver'
import {
  type SavedBoard,
  deleteSavedBoard,
  loadSavedBoards,
  loadWorkingBoard,
  saveBoard,
  saveWorkingBoard,
} from './lib/storage'

export interface BoardStoreState {
  title: string
  board: Board
  brush: PaintState
  result: SolveResult | null
  savedBoards: SavedBoard[]
}

export type BoardStore = ReturnType<typeof createBoardStore>

/** A share link in the URL wins over the autosaved working board. */
export function createBoardStore(initialHash = '') {
  const shared = parseShareHash(initialHash)
  const initial = shared ?? loadWorkingBoard() ?? { title: '', board: createBoard(11) }

  const state = reactive<BoardStoreState>({
    title: initial.title,
    board: initial.board,
    brush: 'on',
    result: null,
    savedBoards: loadSavedBoards(),
  })

  watch(
    () => [state.title, state.board] as const,
    () => saveWorkingBoard(state.title, state.board),
    { deep: true, immediate: true },
  )
  watch(
    () => state.board,
    () => {
      state.result = null
    },
    { deep: true },
  )

  return {
    state,
    loadedFromShare: shared !== null,

    paint(index: number) {
      paintTile(state.board, index, state.brush)
    },

    resetBoard(size: BoardSize) {
      state.board = createBoard(size)
    },

    calculate() {
      state.result = solveHeuristic(state.board)
    },

    save() {
      const title = state.title.trim()
      if (!title) return false
      state.title = title
      state.savedBoards = saveBoard(title, cloneBoard(state.board))
      return true
    },

    load(saved: SavedBoard) {
      state.title = saved.title
      state.board = cloneBoard(saved.board)
    },

    remove(title: string) {
      state.savedBoards = deleteSavedBoard(title)
    },

    shareHash() {
      return buildShareHash({ title: state.title.trim(), board: state.board })
    },
  }
}

function cloneBoard(board: Board): Board {
  return structuredClone(toRaw(board))
}
