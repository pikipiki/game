import { defineConfig, mergeConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { sharedUserConfig } from './vite.base';

/** Build offline : un seul HTML embarquant JS, CSS et assets. */
export default defineConfig(
  mergeConfig(sharedUserConfig, {
    plugins: [...(sharedUserConfig.plugins ?? []), viteSingleFile()],
    build: {
      rollupOptions: {
        output: { inlineDynamicImports: true },
      },
    },
  }),
);
