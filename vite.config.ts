/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
      },
      manifest: {
        name: "Gilberts To-Do List",
        short_name: "Gilberts ToDo",
        description: "A modern to-do list app with tags, drag & drop, and offline support.",
        theme_color: "#3b82f6",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": "http://localhost:8099",
    },
  },
  resolve: {
    alias: {
      "@/features": path.resolve(__dirname, "./src/features"),
      "@/shared": path.resolve(__dirname, "./src/shared"),
      "@/services": path.resolve(__dirname, "./src/services"),
      "@/app": path.resolve(__dirname, "./src/app"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
    coverage: {
      exclude: [
        "src/**/index.ts",
        "src/shared/locales/**",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/features/todos/components/sortable-todo-list.tsx",
        "src/features/todos/components/sortable-todo-item.tsx",
        "src/features/todos/components/drag-handle.tsx",
      ],
    },
  },
});
