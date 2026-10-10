import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Unit tests for the kit's pure logic. Lives outside src/kit so it never ships in the registry.
export default defineConfig({
  resolve: { alias: { '@kit': fileURLToPath(new URL('./src/kit', import.meta.url)) } },
  test: { include: ['tests/**/*.test.ts'], environment: 'happy-dom' },
})
