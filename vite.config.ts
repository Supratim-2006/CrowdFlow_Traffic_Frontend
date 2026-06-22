import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: process.env.VERCEL ? true : false,

  tanstackStart: {
    server: {
      entry: "server",
    },
  },
});