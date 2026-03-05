/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import fs from "fs";

const buildTarget = process.env.BUILD_TARGET || "ha";

function readAppVersion(): string {
  const candidates = [
    path.resolve(__dirname, "../ha-addon/gilberts-todo/config.yaml"),
    path.resolve(__dirname, "gilberts-todo/config.yaml"), // Docker fallback
  ];
  for (const p of candidates) {
    try {
      const yaml = fs.readFileSync(p, "utf-8");
      const match = yaml.match(/^version:\s*"?([^"\n]+)"?/m);
      if (match?.[1]) return match[1];
    } catch {
      /* try next */
    }
  }
  return "unknown";
}

export default defineConfig({
  base: "./",
  define: {
    __APP_VERSION__: JSON.stringify(readAppVersion()),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
    __BUILD_TARGET__: JSON.stringify(buildTarget),
  },
  plugins: [
    react(),
    tailwindcss(),
    ...(buildTarget !== "nextcloud"
      ? [
          VitePWA({
            registerType: "autoUpdate",
            workbox: {
              globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
            },
            manifest: {
              name: "Gilberts To-Do List",
              short_name: "Gilberts ToDo",
              description:
                "A modern to-do list app with tags, drag & drop, and offline support.",
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
        ]
      : []),
  ],
  build:
    buildTarget === "nextcloud"
      ? {
          rollupOptions: {
            output: {
              entryFileNames: "gilbertstodo.js",
              assetFileNames: "gilbertstodo.[ext]",
            },
          },
        }
      : undefined,
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
