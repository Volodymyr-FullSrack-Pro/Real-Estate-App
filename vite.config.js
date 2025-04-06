import postcss from '@vituum/vite-plugin-postcss'
import posthtml from '@vituum/vite-plugin-posthtml'
import { copyFileSync, cpSync, existsSync, mkdirSync } from 'fs'
import vituum from 'vituum'

export default {
  plugins: [
    vituum(),
    postcss(),
    posthtml({ root: './src' }),

    {
      name: 'custom-hmr',
      enforce: 'post',
      handleHotUpdate({ file, server }) {
        if (file.endsWith('.html')) {
          server.ws.send({
            type: 'full-reload',
            path: '*',
          })
        }
      },
    },

    {
      name: 'copy-static-files',
      apply: 'build',
      writeBundle() {
        try {
          // ✅ Копируем JSON
          copyFileSync('src/properties.json', 'dist/properties.json')

          // ✅ Копируем favicon и иконки
          const icons = [
            'favicon.ico',
            'apple-touch-icon.png',
            'android-chrome-192x192.png',
            'android-chrome-512x512.png',
            'site.webmanifest'
          ]
          icons.forEach(icon => {
            const src = `src/${icon}`
            const dest = `dist/${icon}`
            if (existsSync(src)) copyFileSync(src, dest)
          })

          // ✅ Копируем изображения
          const imagesSrc = 'src/assets/images'
          const imagesDest = 'dist/assets/images'
          if (existsSync(imagesSrc)) {
            mkdirSync(imagesDest, { recursive: true })
            cpSync(imagesSrc, imagesDest, { recursive: true })
          }

        } catch (err) {
          console.error('❌ Error copying static files:', err)
        }
      }
    }
  ],

  build: {
    rollupOptions: {
      output: {
        assetFileNames: (asset) => {
          const ext = asset.name?.split('.').pop()
          const name = asset.name?.split('/').pop()

          if (!name) return '[name][extname]'

          if (['png', 'jpg', 'webp', 'svg'].includes(ext)) {
            return `assets/images/${name}`
          }

          if (ext === 'css') {
            return `css/${name}`
          }

          if (ext === 'woff2') {
            return `fonts/${name}`
          }

          return `[name][extname]`
        },
        preserveModuleDirectories: true,
      },
    },
  },

  publicDir: 'public',
}
