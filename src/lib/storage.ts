import type { Board } from './board'
import { decodeBoard, encodeBoard } from './share'

const SAVED_KEY = 'daevanion.savedBoards.v1'
const WORKING_KEY = 'daevanion.workingBoard.v1'

export interface SavedBoard {
  title: string
  board: Board
  savedAt: string
}

interface StoredEntry {
  title: string
  board: string
  savedAt: string
}

// Storage can throw (private mode, quota, blocked site data); the app must keep working.
function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

function isStoredEntry(value: unknown): value is StoredEntry {
  if (typeof value !== 'object' || value === null) return false
  const entry = value as Record<string, unknown>
  return (
    typeof entry.title === 'string' &&
    typeof entry.board === 'string' &&
    typeof entry.savedAt === 'string'
  )
}

export function loadSavedBoards(): SavedBoard[] {
  const stored = read(SAVED_KEY)
  if (!Array.isArray(stored)) return []
  return stored.flatMap((entry) => {
    if (!isStoredEntry(entry)) return []
    const board = decodeBoard(entry.board)
    return board ? [{ title: entry.title, board, savedAt: entry.savedAt }] : []
  })
}

/** Saves under `title`, replacing any existing board with the same title. */
export function saveBoard(title: string, board: Board, now = new Date()): SavedBoard[] {
  const others = loadSavedBoards().filter((saved) => saved.title !== title)
  const updated = [...others, { title, board, savedAt: now.toISOString() }].sort((a, b) =>
    a.title.localeCompare(b.title),
  )
  persist(updated)
  return updated
}

export function deleteSavedBoard(title: string): SavedBoard[] {
  const updated = loadSavedBoards().filter((saved) => saved.title !== title)
  persist(updated)
  return updated
}

function persist(boards: SavedBoard[]): void {
  write(
    SAVED_KEY,
    boards.map((saved) => ({ ...saved, board: encodeBoard(saved.board) })),
  )
}

export function loadWorkingBoard(): { title: string; board: Board } | null {
  const stored = read(WORKING_KEY)
  if (typeof stored !== 'object' || stored === null) return null
  const { title, board } = stored as Record<string, unknown>
  if (typeof title !== 'string' || typeof board !== 'string') return null
  const decoded = decodeBoard(board)
  return decoded ? { title, board: decoded } : null
}

export function saveWorkingBoard(title: string, board: Board): void {
  write(WORKING_KEY, { title, board: encodeBoard(board) })
}
