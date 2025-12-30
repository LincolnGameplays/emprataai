import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  
  build: {
    target: 'esnext', // Código moderno, menor bundle
    minify: 'esbuild', // Faster than terser, good enough for production
    rollupOptions: {
      output: {
        manualChunks: {
          // Separa bibliotecas pesadas em chunks diferentes
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
  
  // Otimização de Dev Server
  server: {
    hmr: {
      overlay: true,
    },
  },
});
