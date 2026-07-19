import { defineConfig } from 'vite';

// Static, no-framework site. Vite just serves index.html with hot reload in dev
// and produces a plain dist/ folder on build.
export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
