import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { movieApiPlugin } from './server/vite-plugin';

export default defineConfig(({ isSsrBuild }) => ({
  ssr: { noExternal: isSsrBuild ? true : undefined },
  build: isSsrBuild ? { copyPublicDir: false, rollupOptions: { output: { entryFileNames: '[name].mjs', chunkFileNames: '[name]-[hash].mjs' } } } : undefined,
  plugins: [movieApiPlugin(), react(), tailwindcss()],
}));
