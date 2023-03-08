import { defineConfig } from 'vite';
import Vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Pages from 'vite-plugin-pages';
import Components from 'unplugin-vue-components/vite';
import Vuetify from 'vite-plugin-vuetify';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      Vue(),
      Vuetify(),
      AutoImport({
        dts: './src/auto-imports.d.ts',
        imports: [
          'vue',
          'vue-router',
          'pinia',
          '@vueuse/core',
        ],
        dirs: ['./src/**'],
        cache: false,
        vueTemplate: true,
      }),
      Components({
        dts: './src/components.d.ts',
      }),
      Pages({
        dirs: [
          { dir: 'src/pages', baseRoute: '' },
        ],
      }),
    ],
  };
});
