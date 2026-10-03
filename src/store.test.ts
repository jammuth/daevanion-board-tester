import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { createBoard } from './lib/board'
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
