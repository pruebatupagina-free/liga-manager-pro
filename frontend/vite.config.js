import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/liga-manager-pro/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
