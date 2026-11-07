import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import type { UserConfig } from 'vite'
import type { InlineConfig } from 'vitest/node'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const config: UserConfig & { test: InlineConfig } = {
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: 'src/test/setup.ts',
      globals: true,
      css: false,
    },
  }
  return config
})
