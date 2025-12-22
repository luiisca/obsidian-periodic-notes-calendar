// vite.config.ts
import { svelte } from "file:///home/luisca/Documents/obsidian-vaults/pnc-demo/.obsidian/plugins/obsidian-periodic-notes-calendar/node_modules/@sveltejs/vite-plugin-svelte/src/index.js";
import builtins from "file:///home/luisca/Documents/obsidian-vaults/pnc-demo/.obsidian/plugins/obsidian-periodic-notes-calendar/node_modules/builtin-modules/index.js";
import { resolve } from "path";
import { pathToFileURL } from "url";
import { defineConfig } from "file:///home/luisca/Documents/obsidian-vaults/pnc-demo/.obsidian/plugins/obsidian-periodic-notes-calendar/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "/home/luisca/Documents/obsidian-vaults/pnc-demo/.obsidian/plugins/obsidian-periodic-notes-calendar";
var vite_config_default = defineConfig({
  plugins: [svelte()],
  build: {
    lib: {
      entry: "src/main",
      formats: ["cjs"]
    },
    rollupOptions: {
      output: {
        entryFileNames: "main.js",
        assetFileNames: "styles.css",
        sourcemapBaseUrl: pathToFileURL(
          __vite_injected_original_dirname
        ).toString()
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
        ...builtins
      ]
    },
    outDir: "./",
    emptyOutDir: false,
    sourcemap: true
  },
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "src")
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9sdWlzY2EvRG9jdW1lbnRzL29ic2lkaWFuLXZhdWx0cy9wbmMtZGVtby8ub2JzaWRpYW4vcGx1Z2lucy9vYnNpZGlhbi1wZXJpb2RpYy1ub3Rlcy1jYWxlbmRhclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvbHVpc2NhL0RvY3VtZW50cy9vYnNpZGlhbi12YXVsdHMvcG5jLWRlbW8vLm9ic2lkaWFuL3BsdWdpbnMvb2JzaWRpYW4tcGVyaW9kaWMtbm90ZXMtY2FsZW5kYXIvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvbHVpc2NhL0RvY3VtZW50cy9vYnNpZGlhbi12YXVsdHMvcG5jLWRlbW8vLm9ic2lkaWFuL3BsdWdpbnMvb2JzaWRpYW4tcGVyaW9kaWMtbm90ZXMtY2FsZW5kYXIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBzdmVsdGUgfSBmcm9tIFwiQHN2ZWx0ZWpzL3ZpdGUtcGx1Z2luLXN2ZWx0ZVwiO1xuaW1wb3J0IGJ1aWx0aW5zIGZyb20gXCJidWlsdGluLW1vZHVsZXNcIjtcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgcGF0aFRvRmlsZVVSTCB9IGZyb20gXCJ1cmxcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gICAgcGx1Z2luczogW3N2ZWx0ZSgpXSxcbiAgICBidWlsZDoge1xuICAgICAgICBsaWI6IHtcbiAgICAgICAgICAgIGVudHJ5OiBcInNyYy9tYWluXCIsXG4gICAgICAgICAgICBmb3JtYXRzOiBbXCJjanNcIl0sXG4gICAgICAgIH0sXG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAgIG91dHB1dDoge1xuICAgICAgICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiBcIm1haW4uanNcIixcbiAgICAgICAgICAgICAgICBhc3NldEZpbGVOYW1lczogXCJzdHlsZXMuY3NzXCIsXG4gICAgICAgICAgICAgICAgc291cmNlbWFwQmFzZVVybDogcGF0aFRvRmlsZVVSTChcbiAgICAgICAgICAgICAgICAgICAgX19kaXJuYW1lXG4gICAgICAgICAgICAgICAgKS50b1N0cmluZygpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4dGVybmFsOiBbXG4gICAgICAgICAgICAgICAgXCJvYnNpZGlhblwiLFxuICAgICAgICAgICAgICAgIFwiZWxlY3Ryb25cIixcbiAgICAgICAgICAgICAgICBcIkBjb2RlbWlycm9yL2F1dG9jb21wbGV0ZVwiLFxuICAgICAgICAgICAgICAgIFwiQGNvZGVtaXJyb3IvY29sbGFiXCIsXG4gICAgICAgICAgICAgICAgXCJAY29kZW1pcnJvci9jb21tYW5kc1wiLFxuICAgICAgICAgICAgICAgIFwiQGNvZGVtaXJyb3IvbGFuZ3VhZ2VcIixcbiAgICAgICAgICAgICAgICBcIkBjb2RlbWlycm9yL2xpbnRcIixcbiAgICAgICAgICAgICAgICBcIkBjb2RlbWlycm9yL3NlYXJjaFwiLFxuICAgICAgICAgICAgICAgIFwiQGNvZGVtaXJyb3Ivc3RhdGVcIixcbiAgICAgICAgICAgICAgICBcIkBjb2RlbWlycm9yL3ZpZXdcIixcbiAgICAgICAgICAgICAgICBcIkBsZXplci9jb21tb25cIixcbiAgICAgICAgICAgICAgICBcIkBsZXplci9oaWdobGlnaHRcIixcbiAgICAgICAgICAgICAgICBcIkBsZXplci9sclwiLFxuICAgICAgICAgICAgICAgIC4uLmJ1aWx0aW5zLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAgb3V0RGlyOiBcIi4vXCIsXG4gICAgICAgIGVtcHR5T3V0RGlyOiBmYWxzZSxcbiAgICAgICAgc291cmNlbWFwOiB0cnVlLFxuICAgIH0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgICBhbGlhczoge1xuICAgICAgICAgICAgXCJAXCI6IHJlc29sdmUocHJvY2Vzcy5jd2QoKSwgXCJzcmNcIiksXG4gICAgICAgIH1cbiAgICB9XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBd2QsU0FBUyxjQUFjO0FBQy9lLE9BQU8sY0FBYztBQUNyQixTQUFTLGVBQWU7QUFDeEIsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxvQkFBb0I7QUFKN0IsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsU0FBUyxDQUFDLE9BQU8sQ0FBQztBQUFBLEVBQ2xCLE9BQU87QUFBQSxJQUNILEtBQUs7QUFBQSxNQUNELE9BQU87QUFBQSxNQUNQLFNBQVMsQ0FBQyxLQUFLO0FBQUEsSUFDbkI7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNYLFFBQVE7QUFBQSxRQUNKLGdCQUFnQjtBQUFBLFFBQ2hCLGdCQUFnQjtBQUFBLFFBQ2hCLGtCQUFrQjtBQUFBLFVBQ2Q7QUFBQSxRQUNKLEVBQUUsU0FBUztBQUFBLE1BQ2Y7QUFBQSxNQUNBLFVBQVU7QUFBQSxRQUNOO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQSxHQUFHO0FBQUEsTUFDUDtBQUFBLElBQ0o7QUFBQSxJQUNBLFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQSxJQUNiLFdBQVc7QUFBQSxFQUNmO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDTCxPQUFPO0FBQUEsTUFDSCxLQUFLLFFBQVEsUUFBUSxJQUFJLEdBQUcsS0FBSztBQUFBLElBQ3JDO0FBQUEsRUFDSjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
