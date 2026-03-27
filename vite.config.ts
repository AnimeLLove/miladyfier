import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { viteStaticCopy } from "vite-plugin-static-copy";
import solid from "vite-plugin-solid";
import { defineConfig } from "vite";
import packageJson from "./package.json";

function syncManifestVersion() {
  return {
    name: "sync-manifest-version",
    async closeBundle() {
      const manifestPath = resolve(__dirname, "dist/manifest.json");
      const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as { version?: string };
      manifest.version = packageJson.version;
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    },
  };
}

export default defineConfig({
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2022",
    minify: false,
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
  plugins: [
    solid(),
    syncManifestVersion(),
    viteStaticCopy({
      targets: [
        {
          src: [
            "node_modules/onnxruntime-web/dist/*.wasm",
            "node_modules/onnxruntime-web/dist/*.mjs",
          ],
          dest: "ort",
        },
      ],
    }),
  ],
});
