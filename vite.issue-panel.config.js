import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  root: 'static/issue-panel',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
