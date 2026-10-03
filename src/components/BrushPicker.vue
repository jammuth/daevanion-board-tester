<script setup lang="ts">
import { PAINT_STATES, TILE_COST, type PaintState } from '../lib/board'
import { TILE_CLASS, TILE_LABEL } from '../tileStyles'

const brush = defineModel<PaintState>({ required: true })
</script>

<template>
  <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Brush">
    <button
      v-for="state in PAINT_STATES"
      :key="state"
      type="button"
      role="radio"
      :aria-checked="brush === state"
      class="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition"
      :class="
        brush === state
          ? 'border-amber-300 bg-slate-800 text-white'
          : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
      "
      @click="brush = state"
    >
      <span class="size-4 rounded-sm border" :class="TILE_CLASS[state]" />
      {{ TILE_LABEL[state] }}
      <span class="text-xs text-slate-400">
        {{ TILE_COST[state] === null ? '—' : `${TILE_COST[state]} pt` }}
      </span>
    </button>
  </div>
</template>
