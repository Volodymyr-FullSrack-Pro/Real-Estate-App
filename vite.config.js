import postcss from '@vituum/vite-plugin-postcss'
import posthtml from '@vituum/vite-plugin-posthtml'
import { copyFileSync, cpSync, existsSync, mkdirSync } from 'fs'
import vituum from 'vituum'

export default {
  plugins: [
    vituum(),
    postcss(),
    posthtml({
      root: './src',
    }),

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
      writeBundle() {
        copyFileSync('src/android-chrome-192x192.png', 'dist/android-chrome-192x192.png')
        copyFileSync('src/android-chrome-512x512.png', 'dist/android-chrome-512x512.png')

        try {
          if (!existsSync('dist/assets')) {
            mkdirSync('dist/assets', { recursive: true })
          }
          if (!existsSync('dist/assets/images')) {
            mkdirSync('dist/assets/images', { recursive: true })
          }
          cpSync('src/assets/images', 'dist/assets/images', { recursive: true, force: true })
        } catch (err) {
          console.error('Error copying images:', err)
        }
      },
    },
  ],

  build: {
    root: './src',
    rollupOptions: {
      output: {
        assetFileNames: (asset) => {
          const filePath = asset.name.split('/')
          const fileName = filePath.pop()
          const nestedPath = filePath.join('/')
          const outputPath = `${nestedPath ? nestedPath + '/' : ''
            }[name][extname]`

          if (asset.name.includes('favicon') || asset.name.includes('apple-touch-icon') || asset.name.includes('android-chrome')) {
            return `${outputPath}`
          }

          console.log(`${asset} - ${asset.name} - ${asset.type}`)
          console.dir(`${asset}`)

          if (asset.type === 'asset') {
            switch (asset.name.split('.').pop()) {
              case 'css':
                return `css/${outputPath}`
              case 'png':
              case 'jpg':
              case 'webp':
              case 'svg':
                return `assets/images/${fileName}`
              case 'woff2':
                return `fonts/${outputPath}`
              case 'webmanifest':
                return `${outputPath}`
              default:
                return `other/${outputPath}`
            }
          }
        },
        preserveModuleDirectories: true,
      }
    },
  },
};

