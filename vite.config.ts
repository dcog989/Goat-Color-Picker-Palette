import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    svelte()
  ],
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    include: ['culori', 'culori/all', 'culori/fn', 'color-name-list', 'apca-w3']
  },
  build: {
    target: 'esnext'
  }
})
