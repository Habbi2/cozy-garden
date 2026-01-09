import { defineConfig } from 'vite';

export default defineConfig({
  base: '/cozy-garden/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2015'
  },
  server: {
    port: 3000,
    open: true,
    host: true
  }
});
