import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative base so the build works unchanged under a GitHub Pages sub-path.
  base: './',
  plugins: [vue(), tailwindcss()],
  test: {
    environment: 'jsdom',
  },
})
