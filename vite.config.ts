import { resolve } from 'path';
import { defineConfig } from 'vite';
import Vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Pages from 'vite-plugin-pages';
import Components from 'unplugin-vue-components/vite';


// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/pages/index.vue'),
        sandbox: resolve(__dirname, 'src/pages/sandbox.vue'),
      },
    },
  },
  plugins: [
    Vue(),
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
      dts: true,
    }),
    Pages({
      dirs: ['src/pages'],
    }),
  ],
});
