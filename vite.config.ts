import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: [
        // Workspace root
        path.resolve(__dirname, '..'),
        // Your project dependencies
        'node_modules',
      ],
    },
  },
  optimizeDeps: {
    include: ['monaco-editor/esm/vs/editor/editor.api'],
  },
  build: {
    commonjsOptions: {
      include: [/monaco-editor/],
    },
  },
}); 