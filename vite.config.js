import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/Framework.js",
      name: "Framework",
      fileName: "framework",
    },
  },
});
