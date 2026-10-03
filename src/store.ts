import { reactive, toRaw, watch } from 'vue'
import { type Board, type BoardSize, type PaintState, createBoard, paintTile } from './lib/board'
import { buildShareHash, parseShareHash } from './lib/share'
import type { SolveResult } from './lib/solver/common'
import { solveHeuristic } from './lib/solver/heuristic'
import { type ExactRun, type ExactRunner, runExactInWorker } from './lib/solver/runExact'
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
  /** True while the exact solver is still working on the current board. */
  solving: boolean
  savedBoards: SavedBoard[]
}

export type BoardStore = ReturnType<typeof createBoardStore>

/** A share link in the URL wins over the autosaved working board. */
export function createBoardStore(initialHash = '', runExact: ExactRunner = runExactInWorker) {
  const shared = parseShareHash(initialHash)
  const initial = shared ?? loadWorkingBoard() ?? { title: '', board: createBoard(11) }

  const state = reactive<BoardStoreState>({
    title: initial.title,
    board: initial.board,
    brush: 'on',
    result: null,
    solving: false,
    savedBoards: loadSavedBoards(),
  })

  watch(
    () => [state.title, state.board] as const,
    () => saveWorkingBoard(state.title, state.board),
    { deep: true, immediate: true },
  )
  let activeRun: ExactRun | null = null
  const cancelExact = () => {
    activeRun?.cancel()
    activeRun = null
    state.solving = false
  }

  watch(
    () => state.board,
    () => {
      cancelExact()
      state.result = null
    },
    // Sync so an edit followed immediately by calculate() can't wipe the fresh result.
    { deep: true, flush: 'sync' },
  )

  return {
    state,
    loadedFromShare: shared !== null,

    paint(index: number) {
      paintTile(state.board, index, state.brush)
    },

    resetBoard(size: BoardSize = state.board.size) {
      state.board = createBoard(size)
    },

    /** Shows the instant heuristic answer, then replaces it with the proven optimum. */
    async calculate() {
      cancelExact()
      state.result = solveHeuristic(state.board)
      if (state.result.status !== 'ok') return

      const run = runExact(cloneBoard(state.board))
      activeRun = run
      state.solving = true
      try {
        const exact = await run.promise
        if (activeRun === run) state.result = exact
      } catch {
        // Keep the heuristic answer; it is still a valid allocation.
      } finally {
        if (activeRun === run) {
          activeRun = null
          state.solving = false
        }
      }
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
