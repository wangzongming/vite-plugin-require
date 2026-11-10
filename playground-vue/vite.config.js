import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vitePluginRequire from 'vite-plugin-require'

const requirePlugin =
  typeof vitePluginRequire === 'function'
    ? vitePluginRequire
    : vitePluginRequire.default

export default defineConfig({
  plugins: [
    vue(),
    // Must be placed after the vue plugin
    requirePlugin(),
  ],
})
