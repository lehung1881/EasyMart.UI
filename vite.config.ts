import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
    plugins: [vue(), tailwindcss()],
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: `
          @use "sass:map";
          @use "@/assets/styles/_variable.scss" as *;
          @use "@/assets/styles/_icons.scss" as *;
        `,
            },
        },
    },
});
