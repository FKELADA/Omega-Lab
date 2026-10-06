import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Served from a sub-path on GitHub Pages (/Omega-Lab/): set BASE at build time. Routes use the hash.
  base: process.env.BASE ?? '/',
  plugins: [svelte()],
  server: {
    // documentation.md lives at the repository root, one level above the app.
    fs: { allow: ['..'] },
  },
})
