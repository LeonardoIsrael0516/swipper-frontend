import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      // Desabilitar HMR via ngrok para evitar requisições excessivas e erros de WebSocket
      // O HMR só funciona bem em localhost com HTTP
      // Quando acessado via ngrok (HTTPS), o cliente do Vite detecta automaticamente
      // e não tenta conectar, mas ainda tenta. Vamos desabilitar completamente.
      // A detecção será feita no cliente via script injection
      clientPort: 8080,
      protocol: 'ws',
    },
      watch: {
        // Reduzir polling para evitar muitas requisições
        usePolling: false,
        interval: 1000,
      },
    },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separar vendor libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'query-vendor': ['@tanstack/react-query'],
          // Separar componentes de reels (páginas públicas)
          'reels-components': [
            './src/components/reels/ReelSlide.tsx',
            './src/components/reels/ReelContent.tsx',
            './src/components/reels/ReelQuestion.tsx',
            './src/components/reels/elements',
          ],
        },
      },
    },
    // Otimizações de build
    chunkSizeWarningLimit: 1000,
    sourcemap: mode === 'development',
  },
}));
