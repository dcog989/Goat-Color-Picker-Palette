import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  plugins: [tailwindcss(), svelte()],
  worker: {
    format: "es",
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    sourcemap: "hidden",
    cssMinify: true,
  },
});
