<script setup lang="ts">
import type { SavedBoard } from '../lib/storage'

defineProps<{ boards: SavedBoard[] }>()
const emit = defineEmits<{ load: [board: SavedBoard]; remove: [title: string] }>()
</script>

<template>
  <section class="rounded-lg border border-slate-700 bg-slate-900 p-4">
    <h2 class="mb-2 text-sm font-semibold text-slate-300">Saved boards</h2>
    <p v-if="boards.length === 0" class="text-sm text-slate-500">Nothing saved yet.</p>
    <ul v-else class="space-y-1">
      <li
        v-for="saved in boards"
        :key="saved.title"
        class="flex items-center justify-between gap-2 text-sm"
      >
        <span class="truncate" :title="saved.title">
          {{ saved.title }}
          <span class="text-xs text-slate-500">{{ saved.board.size }}×{{ saved.board.size }}</span>
        </span>
        <span class="flex shrink-0 gap-1">
          <button
            type="button"
            class="rounded px-2 py-0.5 text-slate-200 hover:bg-slate-700"
            @click="emit('load', saved)"
          >
            Load
          </button>
          <button
            type="button"
            class="rounded px-2 py-0.5 text-red-300 hover:bg-red-900/40"
            @click="emit('remove', saved.title)"
          >
            Delete
          </button>
        </span>
      </li>
    </ul>
  </section>
</template>
