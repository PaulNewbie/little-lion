import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Keeps your port at 3000 so you don't have to change other configs
    open: true, // Opens browser automatically
  },
});