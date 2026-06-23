import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  // Project is deployed to GitHub Pages under https://nastasiiacherniak.github.io/Portfolio/
  base: '/Portfolio/',
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    rollupOptions: {
      output: {
        // Split heavy, rarely-changing libraries into their own chunks so the browser can
        // fetch them in parallel and cache them across deploys (app code changes far more often).
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('lottie')) return 'lottie'
          if (/[\\/]node_modules[\\/]motion/.test(id) || id.includes('framer-motion')) return 'motion'
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/.test(id)) return 'react'
          return 'vendor'
        },
      },
    },
  },
})
