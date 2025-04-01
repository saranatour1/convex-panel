import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: [
        // Adjust this path to include your node_modules directory
        resolve(__dirname, '../'),
      ],
    },
  },
  optimizeDeps: {
    include: [
      '@monaco-editor/react',
      'monaco-editor/esm/vs/editor/editor.api'
    ]
  },
  build: {
    commonjsOptions: {
      include: [/monaco-editor/, /node_modules/],
    }
  }
}); 