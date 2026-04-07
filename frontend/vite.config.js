import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.js', 'src/**/*.test.jsx'],
    environmentMatchGlobs: [
      ['src/**/*.test.jsx', 'jsdom'],
    ],
    globals: true,
    setupFiles: ['./src/setupTests.js'],
  },
})
