import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'
import { site } from './src/site.config'
import { ruecaNotes } from './src/kit/notes-server/vite'

export default defineConfig({
  // GitHub Pages serves a project site under /<repo>/; the deploy workflow sets BASE_PATH.
  base: process.env.BASE_PATH || '/',
  plugins: [
    react(),
    tailwindcss(),
    // "Send to agent" in the shells writes notes to .rueca/notes/ (dev server only)
    ruecaNotes(),
    // Title + link-preview meta from site.config (bots don't run JS, so it must be in the HTML).
    { name: 'site-meta', transformIndexHtml: (html) => {
      const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
      const title = `${site.name} · ${site.tagline.replace(/\.$/, '')}`
      const meta = [
        `<meta name="description" content="${esc(site.description)}" />`,
        `<link rel="canonical" href="${site.url}/" />`,
        `<meta name="theme-color" content="#111111" />`,
        `<meta property="og:type" content="website" />`,
        `<meta property="og:site_name" content="${esc(site.name)}" />`,
        `<meta property="og:title" content="${esc(title)}" />`,
        `<meta property="og:description" content="${esc(site.description)}" />`,
        `<meta property="og:url" content="${site.url}/" />`,
        `<meta name="twitter:card" content="summary" />`,
        `<meta name="twitter:title" content="${esc(title)}" />`,
        `<meta name="twitter:description" content="${esc(site.description)}" />`,
      ]
        // index.html's own tags win (the share image and its card are set there): add only what it doesn't have,
        // or link previews see two og:title / twitter:card values and many take the first (launch check)
        .filter((tag) => { const key = tag.match(/(?:name|property|rel)="[^"]+"/)?.[0]; return !key || !html.includes(key) })
        .join('\n    ')
      return html.replace(/<title>.*<\/title>/, `<title>${esc(title)}</title>\n    ${meta}`)
    } },
  ],
  resolve: {
    alias: {
      '@kit': fileURLToPath(new URL('./src/kit', import.meta.url)),
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
