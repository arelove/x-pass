import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(async () => ({

  plugins: [react({
    babel: {
      plugins: ['@emotion/babel-plugin'],  // Для MUI
    },
  })],
  build: {
    chunkSizeWarningLimit: 1000,  // Оптимизация чанков
    rollupOptions: {
      output: {
        manualChunks: {  // Code splitting для производительности
          vendor: ['react', 'react-dom', '@mui/material'],
          i18n: ['i18next', 'react-i18next'],
        },
      },
    },
    
    sourcemap: false,  // Отключить в prod для размера
  },
  clearScreen: false,
  server: {
    port: 1430,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1431,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
