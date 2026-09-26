import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'flow-sdk': resolve(__dirname, './components/mock-flow-sdk.ts'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
});
