import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  server: { watch: { usePolling: true, interval: 700 } },
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
});
