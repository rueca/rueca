import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { site } from './src/site.config'

export default defineConfig({
  // GitHub Pages serves a project site under /<repo>/; the deploy workflow sets BASE_PATH.
  base: process.env.BASE_PATH || '/',
  plugins: [
    react(),
    tailwindcss(),
    { name: 'site-title', transformIndexHtml: (html) => html.replace(/<title>.*<\/title>/, `<title>${site.name}</title>`) },
  ],
  resolve: {
    alias: {
      '@kit': fileURLToPath(new URL('./src/kit', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
