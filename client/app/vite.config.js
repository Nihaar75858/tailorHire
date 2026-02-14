import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,  // ← ADD THIS for Windows/Docker
      interval: 1000     // ← Check every second
    },
    hmr: {
      overlay: true
    }
  },
  test: {
    globals: true,
    environment: "jsdom", // ✅ This is key
    setupFiles: "./tests/setup.js",
  }
})
