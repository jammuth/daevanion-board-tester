import { type Board, centreIndex, isTarget } from '../board'
import { type SolveResult, buildResult, findUnreachableTargets, marginalCost } from './common'
import { solveHeuristic } from './heuristic'

const LABEL_BASE = 16
const NEW_LABEL = LABEL_BASE - 1

interface Layer {
  prev: Int32Array
  selected: Uint8Array
}

/**
 * Exact minimum node-weighted Steiner tree via a frontier ("broken profile") DP.
 *
 * Cells are visited in row-major order. A DP state is the last `width` visited cells —
 * the only ones that can still touch an unvisited cell — each labelled with which
 * connected component it belongs to (0 = not allocated). Labels are renumbered in order of
 * first appearance so equivalent states collapse into one key. A component may only
 * leave the frontier if it is the sole component and nothing required is left to visit;
 * that is the moment a finished tree is recognised.
 */
export function solveExact(board: Board): SolveResult {
  const unreachable = findUnreachableTargets(board)
  if (unreachable.length > 0) return { status: 'unreachable', unreachable }

  const { size: width, tiles } = board
  const cellCount = width * width
  const root = centreIndex(width)
  const required = tiles.map((state, i) => i === root || isTarget(state))
  const lastRequired = required.lastIndexOf(true)

  const frontier = new Uint8Array(width)
  const scratch = new Uint8Array(width)
  const relabel = new Uint8Array(LABEL_BASE)

  // Keys stay below 16^13 = 2^52, inside the exact-integer range of a double.
  const encode = (labels: Uint8Array): number => {
    relabel.fill(0)
    let next = 1
    let key = 0
    let multiplier = 1
    for (let c = 0; c < width; c++) {
      const label = labels[c]!
      if (label !== 0 && relabel[label] === 0) relabel[label] = next++
      key += relabel[label]! * multiplier
      multiplier *= LABEL_BASE
    }
    return key
  }

  const decode = (key: number, into: Uint8Array): void => {
    for (let c = 0; c < width; c++) {
      into[c] = key % LABEL_BASE
      key = Math.floor(key / LABEL_BASE)
    }
  }

  // Any partial solution already dearer than a known full solution can be discarded.
  const heuristic = solveHeuristic(board)
  const upperBound = heuristic.status === 'ok' ? heuristic.connectors.length : Infinity

  let keys: number[] = [0]
  let costs: number[] = [0]
  const history: Layer[] = []
  let best = { cost: Infinity, layer: -1, state: -1 }

  for (let cell = 0; cell < cellCount; cell++) {
    const col = cell % width
    const tile = tiles[cell]!
    const stepCost = marginalCost(tile)

    const seen = new Map<number, number>()
    const nextKeys: number[] = []
    const nextCosts: number[] = []
    const nextPrev: number[] = []
    const nextSelected: number[] = []
    const offer = (key: number, cost: number, prev: number, selected: number) => {
      const at = seen.get(key)
      if (at === undefined) {
        seen.set(key, nextKeys.length)
        nextKeys.push(key)
        nextCosts.push(cost)
        nextPrev.push(prev)
        nextSelected.push(selected)
      } else if (cost < nextCosts[at]!) {
        nextCosts[at] = cost
        nextPrev[at] = prev
        nextSelected[at] = selected
      }
    }

    for (let s = 0; s < keys.length; s++) {
      const cost = costs[s]!
      decode(keys[s]!, frontier)
      // frontier[col] is the cell directly above, about to leave the frontier.
      const up = frontier[col]!
      const left = col > 0 ? frontier[col - 1]! : 0

      if (!required[cell]) {
        let upSurvives = up === 0
        let otherComponents = false
        for (let c = 0; c < width; c++) {
          if (c === col || frontier[c] === 0) continue
          otherComponents = true
          if (frontier[c] === up) upSurvives = true
        }
        if (upSurvives) {
          scratch.set(frontier)
          scratch[col] = 0
          offer(encode(scratch), cost, s, 0)
        } else if (!otherComponents && lastRequired < cell && cost < best.cost) {
          best = { cost, layer: cell - 1, state: s }
        }
      }

      if (tile !== 'off' && cost + stepCost <= upperBound) {
        scratch.set(frontier)
        let label: number
        if (up !== 0 && left !== 0) {
          label = left
          if (up !== left) {
            for (let c = 0; c < width; c++) if (scratch[c] === up) scratch[c] = left
          }
        } else {
          label = up || left || NEW_LABEL
        }
        scratch[col] = label
        offer(encode(scratch), cost + stepCost, s, 1)
      }
    }

    history.push({ prev: Int32Array.from(nextPrev), selected: Uint8Array.from(nextSelected) })
    keys = nextKeys
    costs = nextCosts
  }

  for (let s = 0; s < keys.length; s++) {
    decode(keys[s]!, frontier)
    // After normalisation a single component is always label 1.
    if (frontier.every((label) => label <= 1) && costs[s]! < best.cost) {
      best = { cost: costs[s]!, layer: cellCount - 1, state: s }
    }
  }

  if (best.layer < 0) throw new Error('No connected allocation found despite all targets reachable')

  const allocated: number[] = []
  let state = best.state
  for (let cell = best.layer; cell >= 0; cell--) {
    const layer = history[cell]!
    if (layer.selected[state]) allocated.push(cell)
    state = layer.prev[state]!
  }
  return buildResult(tiles, allocated, true)
}
