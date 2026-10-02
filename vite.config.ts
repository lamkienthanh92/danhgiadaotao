import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" → chạy được ở bất kỳ đường dẫn nào (GitHub Pages dạng /ten-repo/, mở file dist trực tiếp, v.v.)
export default defineConfig({
  base: "./",
  plugins: [react()],
});
