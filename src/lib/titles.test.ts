import { describe, expect, it } from 'vitest'
import { defaultBoardTitle } from './titles'

describe('defaultBoardTitle', () => {
  it('starts at Board #1 when nothing is saved', () => {
    expect(defaultBoardTitle([])).toBe('Board #1')
  })

  it('uses the saved count plus one', () => {
    expect(defaultBoardTitle(['PvE', 'PvP'])).toBe('Board #3')
  })

  it('skips numbers that are already taken', () => {
    expect(defaultBoardTitle(['Board #2'])).toBe('Board #3')
    expect(defaultBoardTitle(['Board #2', 'Board #3', 'Board #4'])).toBe('Board #5')
  })
})
