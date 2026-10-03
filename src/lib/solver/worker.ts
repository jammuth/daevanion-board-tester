import type { Board } from '../board'
import { solveExact } from './exact'

self.onmessage = (event: MessageEvent<Board>) => {
  self.postMessage(solveExact(event.data))
}
