import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 明确指定构建输出目录为 dist
  build: {
    outDir: 'dist' 
  },
  // 重要：如果你的网站不是部署在根域名，而是子路径（如 /app），需要设置 base
  // base: '/app/', 
  // 如果是根域名，保持默认 '/' 即可
  base: '/'
})
