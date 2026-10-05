import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    // documentation.md lives at the repository root, one level above the app.
    fs: { allow: ['..'] },
  },
})
