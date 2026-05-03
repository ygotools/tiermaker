import { createRequire } from 'node:module'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const require = createRequire(import.meta.url)

function resolveReactCompilerPlugin(): string[] {
  try {
    require.resolve('babel-plugin-react-compiler')
    return ['babel-plugin-react-compiler']
  } catch {
    return []
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: resolveReactCompilerPlugin(),
      },
    }),
  ],
  build: {
    minify: 'esbuild',
    cssMinify: false,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
