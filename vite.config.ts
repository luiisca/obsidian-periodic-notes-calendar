import { svelte } from "@sveltejs/vite-plugin-svelte";
import builtins from "builtin-modules";
import { resolve } from "path";
import { pathToFileURL } from "url";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [svelte()],
    build: {
        lib: {
            entry: "src/main",
            formats: ["cjs"],
        },
        rollupOptions: {
            output: {
                entryFileNames: "main.js",
                assetFileNames: "styles.css",
                sourcemapBaseUrl: pathToFileURL(
                    __dirname
                ).toString(),
            },
            external: [
                "obsidian",
                "electron",
                "@codemirror/autocomplete",
                "@codemirror/collab",
                "@codemirror/commands",
                "@codemirror/language",
                "@codemirror/lint",
                "@codemirror/search",
                "@codemirror/state",
                "@codemirror/view",
                "@lezer/common",
                "@lezer/highlight",
                "@lezer/lr",
                ...builtins,
            ],
        },
        outDir: "./",
        emptyOutDir: false,
        sourcemap: true,
    },
    resolve: {
        alias: {
            "@": resolve(process.cwd(), "src"),
        }
    }
});
