import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@main': resolve(__dirname, 'src/main'),
        '@utils': resolve(__dirname, 'src/utils')
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@preload': resolve(__dirname, 'src/preload'),
        '@utils': resolve(__dirname, 'src/utils')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer/src'),
        '@renderer': resolve(__dirname, 'src/renderer/src'),
        '@utils': resolve(__dirname, 'src/utils')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
