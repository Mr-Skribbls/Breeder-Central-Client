import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { libInjectCss } from "vite-plugin-lib-inject-css";

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    libInjectCss(),
    ...(command === "build"
      ? [
          dts({
            include: ["src"],
            exclude: ["src/**/*.test.ts", "src/**/*.test.tsx", "src/**/*.stories.tsx", "src/test/**"],
          }),
        ]
      : []),
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
    },
    sourcemap: true,
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
  },
}));