import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (
            id.includes("@react-pdf")
          ) {
            return "react-pdf-vendor";
          }

          if (id.includes("pdfjs")) {
            return "pdfjs-vendor";
          }

          if (id.includes("unpdf")) {
            return "unpdf-vendor";
          }

          if (
            id.includes("react-dom") ||
            id.includes("/react/") ||
            id.includes("react-router-dom")
          ) {
            return "react-vendor";
          }

          if (
            id.includes("@supabase") ||
            id.includes("@tanstack") ||
            id.includes("zod")
          ) {
            return "data-vendor";
          }

          if (id.includes("@radix-ui")) {
            return "radix-vendor";
          }

          if (
            id.includes("motion") ||
            id.includes("lenis") ||
            id.includes("lucide-react")
          ) {
            return "ui-vendor";
          }

          if (
            id.includes("@langchain") ||
            id.includes("react-markdown")
          ) {
            return "content-vendor";
          }

          return "vendor";
        },
      },
    },
  },
}));
