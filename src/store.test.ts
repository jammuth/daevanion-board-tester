import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { type Board, createBoard } from './lib/board'
import type { SolveResult } from './lib/solver/common'
import { solveExact } from './lib/solver/exact'
import type { ExactRunner } from './lib/solver/runExact'
import { buildShareHash } from './lib/share'
import { loadWorkingBoard } from './lib/storage'
import { SCREENSHOT_BOARD } from './lib/testing/asciiBoard'
import { createBoardStore } from './store'

describe('board store', () => {
  beforeEach(() => localStorage.clear())

  it('starts with an empty 11x11 board', () => {
    const store = createBoardStore()
    expect(store.state.board).toEqual(createBoard(11))
    expect(store.loadedFromShare).toBe(false)
  })

  it('paints with the selected brush', () => {
    const store = createBoardStore()
    store.state.brush = 'skill'
    store.paint(3)
    expect(store.state.board.tiles[3]).toBe('skill')
  })

  it('clears the result when the board changes', async () => {
    const store = createBoardStore()
    store.calculate()
    expect(store.state.result).not.toBeNull()
    store.paint(3)
    await nextTick()
    expect(store.state.result).toBeNull()
  })

  function manualRunner() {
    const runs: { board: Board; resolve: (r: SolveResult) => void; reject: (e: Error) => void }[] =
      []
    const runner: ExactRunner = (board) => {
      let resolve!: (r: SolveResult) => void
      let reject!: (e: Error) => void
      const promise = new Promise<SolveResult>((res, rej) => {
        resolve = res
        reject = rej
      })
      runs.push({ board, resolve, reject })
      return { promise, cancel: vi.fn() }
    }
    return { runs, runner }
  }

  it('shows the heuristic answer first, then the exact one', async () => {
    const { runs, runner } = manualRunner()
    const store = createBoardStore(buildShareHash({ title: '', board: SCREENSHOT_BOARD }), runner)
    const done = store.calculate()

    expect(store.state.solving).toBe(true)
    expect(store.state.result).toMatchObject({ status: 'ok', optimal: false })
    expect(runs).toHaveLength(1)
    expect(runs[0]!.board).toEqual(SCREENSHOT_BOARD)

    runs[0]!.resolve(solveExact(runs[0]!.board))
    await done
    expect(store.state.solving).toBe(false)
    expect(store.state.result).toMatchObject({ status: 'ok', optimal: true, cost: 106 })
  })

  it('skips the exact solver when targets are unreachable', async () => {
    const { runs, runner } = manualRunner()
    const store = createBoardStore('', runner)
    store.state.brush = 'skill'
    store.paint(0)
    await store.calculate()
    expect(store.state.result?.status).toBe('unreachable')
    expect(runs).toHaveLength(0)
  })

  it('cancels and discards the exact run when the board changes', async () => {
    const { runs, runner } = manualRunner()
    const store = createBoardStore('', runner)
    const done = store.calculate()
    store.paint(3)
    await nextTick()
    expect(store.state.solving).toBe(false)
    expect(store.state.result).toBeNull()

    runs[0]!.resolve(solveExact(createBoard(11)))
    await done
    expect(store.state.result).toBeNull()
  })

  it('keeps the heuristic answer if the exact solver fails', async () => {
    const { runs, runner } = manualRunner()
    const store = createBoardStore('', runner)
    const done = store.calculate()
    runs[0]!.reject(new Error('boom'))
    await done
    expect(store.state.solving).toBe(false)
    expect(store.state.result).toMatchObject({ status: 'ok', optimal: false })
  })

  it('autosaves and restores the working board', async () => {
    const first = createBoardStore()
    first.state.title = 'Draft'
    first.paint(0)
    await nextTick()
    expect(loadWorkingBoard()?.title).toBe('Draft')
    expect(createBoardStore().state.board.tiles[0]).toBe('on')
  })

  it('loads a shared board from the URL hash in preference to the working board', () => {
    createBoardStore().paint(0)
    const store = createBoardStore(buildShareHash({ title: 'Shared', board: SCREENSHOT_BOARD }))
    expect(store.loadedFromShare).toBe(true)
    expect(store.state.title).toBe('Shared')
    expect(store.state.board).toEqual(SCREENSHOT_BOARD)
  })

  it('refuses to save without a title', () => {
    const store = createBoardStore()
    store.state.title = '   '
    expect(store.save()).toBe(false)
    expect(store.state.savedBoards).toEqual([])
  })

  it('saves, loads and deletes boards', () => {
    const store = createBoardStore()
    store.state.title = ' PvE '
    store.paint(0)
    expect(store.save()).toBe(true)
    expect(store.state.savedBoards.map((s) => s.title)).toEqual(['PvE'])

    store.resetBoard(13)
    store.load(store.state.savedBoards[0]!)
    expect(store.state.board.size).toBe(11)
    expect(store.state.board.tiles[0]).toBe('on')

    store.paint(1)
    expect(store.state.savedBoards[0]!.board.tiles[1]).toBe('off')

    store.remove('PvE')
    expect(store.state.savedBoards).toEqual([])
  })
})
