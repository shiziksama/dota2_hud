import { defineConfig } from "vite";
import path from "node:path";

const root = path.resolve(__dirname, "src");
const outDir = path.resolve(__dirname, "dist/renderer");

export default defineConfig({
  root,
  base: "./",
  server: {
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir,
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      vue: "vue/dist/vue.esm-bundler.js",
    },
  },
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
});
