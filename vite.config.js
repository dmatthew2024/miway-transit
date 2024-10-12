import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration for GitHub Pages deployment
export default defineConfig({
  base: '/miway-transit/',  // Ensure the base matches your GitHub repo name
  plugins: [react()]
});
