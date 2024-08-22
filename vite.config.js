import { defineConfig } from 'vite';
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        file_parsing: resolve(__dirname, "js/file_parsing.js"), // remove this later by exporting _CLI.
        ribbon: resolve(__dirname, "index_ribbon.js"),
        splitthreader: resolve(__dirname, "index_splitthreader.js"),
      },
    },
  },
  server: {
    port: 3000,
  },
  define: {
    global: {},
  },
});
