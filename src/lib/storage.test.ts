import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createBoard } from './board'
import {
  deleteSavedBoard,
  loadSavedBoards,
  loadWorkingBoard,
  saveBoard,
  saveWorkingBoard,
} from './storage'
import { SCREENSHOT_BOARD } from './testing/asciiBoard'

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('starts with no saved boards', () => {
    expect(loadSavedBoards()).toEqual([])
  })

  it('saves, lists alphabetically, and reloads boards', () => {
    const now = new Date('2026-10-03T12:00:00Z')
    saveBoard('Zeta', createBoard(13), now)
    saveBoard('Alpha', SCREENSHOT_BOARD, now)
    const saved = loadSavedBoards()
    expect(saved.map((s) => s.title)).toEqual(['Alpha', 'Zeta'])
    expect(saved[0]!.board).toEqual(SCREENSHOT_BOARD)
    expect(saved[0]!.savedAt).toBe(now.toISOString())
  })

  it('overwrites a board saved with the same title', () => {
    saveBoard('Build', createBoard(11))
    saveBoard('Build', SCREENSHOT_BOARD)
    const saved = loadSavedBoards()
    expect(saved).toHaveLength(1)
    expect(saved[0]!.board).toEqual(SCREENSHOT_BOARD)
  })

  it('deletes a board by title', () => {
    saveBoard('Keep', createBoard(11))
    saveBoard('Drop', createBoard(11))
    expect(deleteSavedBoard('Drop').map((s) => s.title)).toEqual(['Keep'])
    expect(loadSavedBoards().map((s) => s.title)).toEqual(['Keep'])
  })

  it('ignores corrupt stored data', () => {
    localStorage.setItem('daevanion.savedBoards.v1', '{not json')
    expect(loadSavedBoards()).toEqual([])
    localStorage.setItem(
      'daevanion.savedBoards.v1',
      JSON.stringify([{ title: 'ok', board: 'garbage', savedAt: 'x' }, 42]),
    )
    expect(loadSavedBoards()).toEqual([])
  })

  it('round-trips the working board', () => {
    expect(loadWorkingBoard()).toBeNull()
    saveWorkingBoard('Draft', SCREENSHOT_BOARD)
    expect(loadWorkingBoard()).toEqual({ title: 'Draft', board: SCREENSHOT_BOARD })
  })

  it('keeps working when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => saveBoard('x', createBoard(11))).not.toThrow()
    expect(loadSavedBoards()).toEqual([])
  })
})
