<script setup lang="ts">
import { computed, ref } from 'vue'
import BoardGrid from './components/BoardGrid.vue'
import BrushPicker from './components/BrushPicker.vue'
import ResultPanel from './components/ResultPanel.vue'
import SavedBoards from './components/SavedBoards.vue'
import { BOARD_SIZES, type BoardSize, isFreshBoard } from './lib/board'
import type { SavedBoard } from './lib/storage'
import { createBoardStore } from './store'

const store = createBoardStore(window.location.hash)
const { state } = store

const notice = ref(
  store.loadedFromShare
    ? `Loaded shared board${state.title ? ` "${state.title}"` : ''}. Save it to keep a copy.`
    : '',
)
const shareLink = ref('')

// A stale share hash would overwrite edits on refresh, so drop it once loaded.
if (store.loadedFromShare) {
  history.replaceState(null, '', window.location.pathname + window.location.search)
}

const isFresh = computed(() => isFreshBoard(state.board))

function changeSize(size: BoardSize) {
  if (size === state.board.size) return
  if (!isFresh.value && !confirm(`Switch to ${size}×${size}? This clears the current board.`)) {
    return
  }
  store.resetBoard(size)
}

function clearBoard() {
  if (isFresh.value) return
  if (!confirm('Clear the board? Every tile goes back to grey.')) return
  store.resetBoard()
  notice.value = 'Board cleared.'
}

function save() {
  const title = state.title.trim()
  if (!title) {
    notice.value = 'Enter a title before saving.'
    return
  }
  if (
    state.savedBoards.some((saved) => saved.title === title) &&
    !confirm(`Overwrite the saved board "${title}"?`)
  ) {
    return
  }
  store.save()
  notice.value = `Saved "${title}".`
}

function load(saved: SavedBoard) {
  store.load(saved)
  shareLink.value = ''
  notice.value = `Loaded "${saved.title}".`
}

function remove(title: string) {
  if (!confirm(`Delete the saved board "${title}"?`)) return
  store.remove(title)
  notice.value = `Deleted "${title}".`
}

async function share() {
  shareLink.value = window.location.origin + window.location.pathname + store.shareHash()
  try {
    await navigator.clipboard.writeText(shareLink.value)
    notice.value = 'Share link copied to clipboard.'
  } catch {
    notice.value = 'Copy the share link below.'
  }
}
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-4">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-xl font-semibold">Daevanion Board Tester</h1>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="rounded-md border border-red-800 px-3 py-1.5 text-sm text-red-300 hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          :disabled="isFresh"
          data-testid="clear-board"
          @click="clearBoard"
        >
          Clear
        </button>
        <div class="flex rounded-md border border-slate-700" role="group" aria-label="Board size">
          <button
            v-for="size in BOARD_SIZES"
            :key="size"
            type="button"
            class="px-3 py-1.5 text-sm first:rounded-l-md last:rounded-r-md"
            :class="
              state.board.size === size ? 'bg-amber-300 text-slate-900' : 'hover:bg-slate-800'
            "
            :aria-pressed="state.board.size === size"
            @click="changeSize(size)"
          >
            {{ size }}×{{ size }}
          </button>
        </div>
      </div>
    </header>

    <BrushPicker v-model="state.brush" />

    <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
      <BoardGrid
        :board="state.board"
        :result="state.result"
        class="lg:flex-1"
        @paint="store.paint"
      />

      <aside class="flex w-full flex-col gap-4 lg:w-80">
        <button
          type="button"
          class="rounded-md bg-amber-300 px-4 py-2 font-semibold text-slate-900 hover:bg-amber-200"
          @click="store.calculate"
        >
          Calculate
        </button>

        <ResultPanel
          v-if="state.result"
          :board="state.board"
          :result="state.result"
          :solving="state.solving"
        />

        <section class="flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-900 p-4">
          <label class="text-sm font-semibold text-slate-300" for="board-title">Title</label>
          <input
            id="board-title"
            v-model="state.title"
            type="text"
            maxlength="60"
            placeholder="e.g. Gladiator PvE"
            class="rounded border border-slate-700 bg-slate-950 px-2 py-1"
          />
          <div class="flex gap-2">
            <button
              type="button"
              class="flex-1 rounded-md border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
              @click="save"
            >
              Save
            </button>
            <button
              type="button"
              class="flex-1 rounded-md border border-slate-600 px-3 py-1.5 text-sm hover:bg-slate-800"
              @click="share"
            >
              Copy share link
            </button>
          </div>
          <input
            v-if="shareLink"
            :value="shareLink"
            readonly
            aria-label="Share link"
            class="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-400"
            @focus="($event.target as HTMLInputElement).select()"
          />
          <p v-if="notice" class="text-sm text-slate-400" role="status">{{ notice }}</p>
        </section>

        <SavedBoards :boards="state.savedBoards" @load="load" @remove="remove" />
      </aside>
    </div>
  </div>
</template>
