import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { movieApiPlugin } from './server/vite-plugin';

export default defineConfig({ plugins: [movieApiPlugin(), react(), tailwindcss()] });
