import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/jobs": "http://localhost:5002",
      "/user": "http://localhost:5002",
      "/api": "http://localhost:5002",
      "/company": "http://localhost:5002"
    }
  }
});