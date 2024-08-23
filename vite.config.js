import { defineConfig } from 'vite';
import { resolve } from "path";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        ribbon: resolve(__dirname, "js/index_ribbon.js"),
        splitthreader: resolve(__dirname, "js/index_splitthreader.js"),
        jquery: resolve(__dirname, "js/lib/jquery.min.js"),
        bootstrap: resolve(__dirname, "js/lib/bootstrap.min.js"),
        jqueryui: resolve(__dirname, "js/lib/jquery-ui.min.js"),
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
