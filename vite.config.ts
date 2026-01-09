import { defineConfig } from 'vite';

export default defineConfig({
  base: '/cozy-garden/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2015',
    copyPublicDir: true
  },
  server: {
    port: 3000,
    open: true,
    host: true
  }
});
