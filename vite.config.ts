import { fileURLToPath, URL } from "node:url";
import browserslist from "browserslist";
import { browserslistToTargets } from "lightningcss";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Browsers the CSS is compiled for (nesting is flattened for the older ones).
const cssTargets = browserslistToTargets(
  browserslist("defaults and fully supports es6-module"),
);

// Fonts every page of the current design needs. Their hashed addresses are
// handed to the script of index.html, which preloads them.
const PRELOADED_FONTS =
  /(atkinson-hyperlegible-next|bricolage-grotesque)-latin-wght-normal-[\w-]+\.woff2$/;

function fontPreload(): Plugin {
  return {
    name: "font-preload",
    apply: "build",
    transformIndexHtml(html, context) {
      const fonts = Object.keys(context.bundle ?? {})
        .filter((file) => PRELOADED_FONTS.test(file))
        .map((file) => `/${file}`);
      return html.replace(/\/\*FONTS\*\/\s*\[\]/, JSON.stringify(fonts));
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), fontPreload()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  // onnxruntime-web finds its .wasm file next to itself: pre-bundling would
  // move it away during development.
  optimizeDeps: { exclude: ["onnxruntime-web"] },
  // The background remover worker loads its libraries as ES modules.
  worker: { format: "es" },
  css: {
    transformer: "lightningcss",
    lightningcss: { targets: cssTargets },
  },
  build: {
    target: "es2020",
    cssMinify: "lightningcss",
    rollupOptions: {
      output: {
        // Rarely changing libraries get their own long-lived cache entry.
        manualChunks(id) {
          if (
            /node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(
              id,
            )
          ) {
            return "react";
          }
          if (/node_modules\/(i18next|react-i18next)\//.test(id)) return "i18n";
        },
      },
    },
  },
});
