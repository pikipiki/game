import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: { '@': path.resolve(rootDir, 'src') },
  },
  server: { watch: { usePolling: true, interval: 700 } },
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup/vitest-setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'tests/**',
        'src/vite-env.d.ts',
        'src/main.tsx',
        'src/app/**',
        'src/audio/types.ts',
        'src/game/types/**',
        'src/game/battle/types/**',
        'src/game/engine-load.ts',
        'src/render/types/**',
        'src/render/adventure.ts',
        'src/render/scene.ts',
        'src/render/scene/**',
        'src/render/town.ts',
        'src/render/town/**',
        'src/render/battle-space.ts',
        'src/render/kingdom-models.ts',
        'src/render/material-textures.ts',
        'src/i18n/locale-storage.ts',
      ],
      thresholds: {
        lines: 96,
        functions: 100,
        statements: 96,
        branches: 94,
      },
    },
  },
});
