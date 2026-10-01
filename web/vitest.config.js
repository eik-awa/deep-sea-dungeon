import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 本番ビルド用の vite.config.js とは分離した、テスト専用の設定。
// happy-dom 上で実コンポーネントをレンダーし、実際のクリックで状態不整合の
// 回帰(複製・取りこぼし・一括ロスト)を検出する(tests/*.test.jsx)。
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.jsx'],
    setupFiles: ['./tests/setup.js'],
    globals: false,
  },
})
