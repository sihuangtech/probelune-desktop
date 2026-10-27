import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

export default defineConfig({
  plugins: [vue()],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
    rollupOptions: {
      external: ["electron"],
    },
  },
  optimizeDeps: {
    exclude: ["electron"],
  },
  server: {
    port: 3000,
  },
  // 将环境变量暴露给客户端
  define: {
    "process.env": {
      IP2LOCATION_API_KEY: JSON.stringify(process.env.IP2LOCATION_API_KEY),
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
    },
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
});
