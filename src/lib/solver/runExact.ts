import type { Board } from '../board'
import type { SolveResult } from './common'
import { solveExact } from './exact'

export interface ExactRun {
  promise: Promise<SolveResult>
  cancel: () => void
}

export type ExactRunner = (board: Board) => ExactRun

/** Runs the exact solver off the main thread; dense boards can take several seconds. */
export const runExactInWorker: ExactRunner = (board) => {
  if (typeof Worker === 'undefined') {
    return { promise: Promise.resolve().then(() => solveExact(board)), cancel: () => {} }
  }
  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  const promise = new Promise<SolveResult>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<SolveResult>) => {
      resolve(event.data)
      worker.terminate()
    }
    worker.onerror = (event) => {
      reject(new Error(event.message || 'Exact solver failed'))
      worker.terminate()
    }
  })
  worker.postMessage(board)
  return { promise, cancel: () => worker.terminate() }
}
