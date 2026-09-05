import fs from "fs";
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import commonjs from "vite-plugin-commonjs";

const httpsKeyPath = path.resolve(__dirname, "localhost+2-key.pem");
const httpsCertPath = path.resolve(__dirname, "localhost+2.pem");
const https =
  fs.existsSync(httpsKeyPath) && fs.existsSync(httpsCertPath)
    ? {
        key: fs.readFileSync(httpsKeyPath),
        cert: fs.readFileSync(httpsCertPath),
      }
    : undefined;

export default defineConfig({
  server: {
    host: true,
    port: 8081,
    strictPort: true,
    cors: true,
    https,
  },
  preview: {
    port: 8080,
    strictPort: true,
  },
  plugins: [
    react(),
    commonjs({
      filter(id) {
        if (id.includes("node_modules/react-native-svg")) {
          return true;
        }
        if (id.includes("node_modules/prop-types")) {
          return true;
        }
        if (id.includes("node_modules/object-assign")) {
          return true;
        }
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react-native": "react-native-web",
      "react-native-svg": "react-native-svg-web",
    },
  },
  optimizeDeps: {
    include: ["react-native-web"],
    exclude: [
      "react-native",
      "react-native-toast-message",
      "react-native-gesture-handler",
      "react-native-reanimated",
      "react-native-svg",
    ],
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        app: path.resolve(__dirname, "index.html"),
        nativePreview: path.resolve(__dirname, "native-preview.html"),
      },
    },
  },
});
