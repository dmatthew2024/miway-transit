import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // This ensures the correct base URL for GitHub Pages or any subdirectory deployment
  base: '/miway-transit/',

  // Adding React plugin for Vite
  plugins: [react()],

  // Server configuration for development
  server: {
    proxy: {
      '/api': {
        target: 'https://www.miapp.ca',  // Replace this with your target API domain
        changeOrigin: true,               // Change the origin header to match the target
        rewrite: (path) => path.replace(/^\/api/, '')  // Rewrite the path to remove `/api`
      }
    }
  }
});
