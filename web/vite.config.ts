import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  // documentation.md lives at the repository root, one level above the app.
  server: { fs: { allow: ['..'] } },
})
