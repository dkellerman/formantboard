/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import React from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      React(),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      include: ['src/test/**/*.spec.ts'],
    },
  };
});
