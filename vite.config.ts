import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  envPrefix: ['VITE_'],
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: [
        '**/.agents/**',
        '**/.codex/**',
        '**/.git/**',
        '**/.venv/**',
        '**/coverage/**',
        '**/dist/**',
        '**/node_modules/**',
      ],
    },
  },
})

