import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/build-a-premium-modern-agile-kanban-board-for-software-engineering-teams-the-ui-15c002/",
  build: { outDir: "dist", assetsDir: "assets" },
  server: { port: 3000 },
});
