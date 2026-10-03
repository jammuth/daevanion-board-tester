<script setup lang="ts">
import { computed } from 'vue'
import { type Board, PAINT_STATES, TILE_COST } from '../lib/board'
import type { SolveResult } from '../lib/solver'
import { TILE_CLASS, TILE_LABEL } from '../tileStyles'

const props = defineProps<{ board: Board; result: SolveResult }>()

const breakdown = computed(() => {
  if (props.result.status !== 'ok') return []
  const allocated = props.result.allocated
  return PAINT_STATES.flatMap((state) => {
    const count = allocated.filter((i) => props.board.tiles[i] === state).length
    return count > 0 ? [{ state, count, points: count * TILE_COST[state]! }] : []
  })
})
</script>

<template>
  <section class="rounded-lg border border-slate-700 bg-slate-900 p-4">
    <template v-if="result.status === 'ok'">
      <p class="text-lg">
        Total: <strong class="text-amber-300" data-testid="total-cost">{{ result.cost }}</strong>
        points
      </p>
      <ul class="mt-2 space-y-1 text-sm text-slate-300">
        <li v-for="row in breakdown" :key="row.state" class="flex items-center gap-2">
          <span class="size-3 rounded-sm border" :class="TILE_CLASS[row.state]" />
          {{ row.count }} × {{ TILE_LABEL[row.state] }} = {{ row.points }}
        </li>
      </ul>
      <p class="mt-3 text-xs text-slate-400">
        Grey tiles outlined in yellow are the connectors to take. Faded tiles are not needed.
        Heuristic result — close to minimal but not guaranteed optimal.
      </p>
    </template>
    <p v-else class="text-red-400" data-testid="unreachable-message">
      {{ result.unreachable.length }} target tile(s), outlined in red, can't be reached from the
      start tile.
    </p>
  </section>
</template>
