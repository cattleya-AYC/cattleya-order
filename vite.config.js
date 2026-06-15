import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main:     "index.html",
        register: "register.html",
        owner:    "owner.html",
        kitchen:  "kitchen.html",
        history:  "history.html",
      },
    },
  },
});
