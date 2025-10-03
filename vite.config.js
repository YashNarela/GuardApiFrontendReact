import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        // target: "http://localhost:2042",

        //  target:"https://guardapi.flair-solution.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
