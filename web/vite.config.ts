import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    // documentation.md lives at the repository root, one level above the app.
    fs: { allow: ['..'] },
    // Lesson 8.7 talks to a local G2ELin API (start-windows.bat, port 8000). The
    // proxy avoids CORS in development; set VITE_G2ELIN_URL to point elsewhere.
    proxy: {
      '/g2elin': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/g2elin/, ''),
      },
    },
  },
})
