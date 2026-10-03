<script setup lang="ts">
import { computed } from 'vue'
import type { Board } from '../lib/board'
import type { SolveResult } from '../lib/solver/common'
import { TILE_CLASS, TILE_LABEL } from '../tileStyles'

const props = defineProps<{ board: Board; result: SolveResult | null }>()
const emit = defineEmits<{ paint: [index: number] }>()

const allocated = computed(
  () => new Set(props.result?.status === 'ok' ? props.result.allocated : []),
)
const unreachable = computed(
  () => new Set(props.result?.status === 'unreachable' ? props.result.unreachable : []),
)

function tileClass(index: number): string[] {
  const state = props.board.tiles[index]!
  const classes = [TILE_CLASS[state]]
  if (props.result?.status === 'ok' && state !== 'off') {
    if (!allocated.value.has(index)) classes.push('opacity-25')
    else if (state === 'on') classes.push('ring-4 ring-inset ring-yellow-300')
  }
  if (unreachable.value.has(index)) classes.push('ring-4 ring-inset ring-red-500 animate-pulse')
  return classes
}

function tileTitle(index: number): string {
  const label = TILE_LABEL[props.board.tiles[index]!]
  const row = Math.floor(index / props.board.size) + 1
  const col = (index % props.board.size) + 1
  const suffix = allocated.value.has(index)
    ? ' (allocated)'
    : unreachable.value.has(index)
      ? ' (unreachable)'
      : ''
  return `Row ${row}, column ${col}: ${label}${suffix}`
}
</script>

<template>
  <div
    class="grid w-full max-w-[min(90vw,40rem)] gap-1"
    :style="{ gridTemplateColumns: `repeat(${board.size}, minmax(0, 1fr))` }"
  >
    <button
      v-for="(state, index) in board.tiles"
      :key="index"
      type="button"
      class="aspect-square rounded-sm border transition hover:brightness-125 disabled:cursor-default disabled:hover:brightness-100"
      :class="tileClass(index)"
      :title="tileTitle(index)"
      :aria-label="tileTitle(index)"
      :disabled="state === 'start'"
      :data-testid="`tile-${index}`"
      @click="emit('paint', index)"
    />
  </div>
</template>
