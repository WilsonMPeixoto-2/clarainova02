import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
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
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    drop: ["debugger"],
    legalComments: "none",
  },
  build: {
    target: "esnext",
    sourcemap: false,
    rolldownOptions: {
      treeshake: true,
      output: {
        codeSplitting: {
          groups: [
            {
              name: "vendor-react",
              test: /node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
              priority: 60,
            },
            {
              name: "vendor-ui",
              test: /node_modules[\\/]@radix-ui[\\/]react-(dialog|popover|tooltip)[\\/]/,
              priority: 55,
            },
            {
              name: "vendor-motion",
              test: /node_modules[\\/]motion[\\/]/,
              priority: 50,
            },
            {
              name: "vendor-query",
              test: /node_modules[\\/]@tanstack[\\/]react-query[\\/]/,
              priority: 45,
            },
            {
              name: "vendor-supabase",
              test: /node_modules[\\/]@supabase[\\/]supabase-js[\\/]/,
              priority: 40,
            },
            {
              name: "chat-pdf",
              test: /node_modules[\\/](@react-pdf|fontkit|unicode-properties|unicode-trie|brotli|linebreak|yoga-layout|is-url|jay-peg)[\\/]/,
              priority: 35,
              maxSize: 475_000,
            },
            {
              name: "admin-pdf-runtime",
              test: /node_modules[\\/]unpdf[\\/]dist[\\/]pdfjs/,
              priority: 34,
              maxSize: 475_000,
            },
            {
              name: "admin-pdf",
              test: /node_modules[\\/]unpdf[\\/]/,
              priority: 33,
            },
            {
              name: "admin-textsplitters",
              test: /node_modules[\\/]@langchain[\\/]textsplitters[\\/]/,
              priority: 32,
            },
            {
              name: "admin-ingestion",
              test: /src[\\/]lib[\\/]admin-ingestion/,
              priority: 31,
            },
            {
              name: "admin-panels",
              test: /src[\\/]components[\\/]admin[\\/]AdminDocumentsCard|src[\\/]components[\\/]UsageStatsCard/,
              priority: 30,
            },
          ],
        },
      },
    },
  },
}));
