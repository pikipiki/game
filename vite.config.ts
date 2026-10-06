import { defineConfig, mergeConfig } from 'vite';
import { sharedUserConfig } from './vite.base';

/** Build Netlify / preview : JS découpé, assets en fichiers (cache navigateur). */
export default defineConfig(mergeConfig(sharedUserConfig, {}));
