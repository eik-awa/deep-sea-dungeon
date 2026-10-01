import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// WKWebView loads the build over file://, where a `crossorigin` attribute
// forces a CORS-mode fetch that file:// responses can never satisfy,
// so the module script (and the whole app) silently fails to load.
function stripCrossorigin() {
  return {
    name: 'strip-crossorigin',
    transformIndexHtml(html) {
      return html.replace(/\s+crossorigin(="[^"]*")?/g, '')
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), stripCrossorigin()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // WKWebView 用に Xcode へ手動コピーするので、エントリ名は毎回同じにして
        // project.pbxproj のリソース参照を貼り替えずに済むようにする。
        // フォント等の他アセットは fontsource のバージョン固定でハッシュが安定する。
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (info) => {
          const name = info.names?.[0] || info.name || ''
          if (name.endsWith('.css')) return 'assets/index.css'
          // アイコン画像もハッシュ無しの固定名にする。WebApp/ へ上書きコピーするだけで済み、
          // 古いハッシュ付きファイルが溜まらない。
          if (/\.(webp|png|jpe?g|svg)$/.test(name)) return 'assets/[name][extname]'
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
})
