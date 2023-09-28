import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { env } from "process";
import sveltePreprocess from "svelte-preprocess";
import alias from "@rollup/plugin-alias";
import json from "@rollup/plugin-json";

export default {
  input: "src/main.ts",
  output: {
    format: "cjs",
    file: "main.js",
    exports: "default",
  },
  external: ["obsidian", "fs", "os", "path"],
  plugins: [
    svelte({
      emitCss: false,
      preprocess: sveltePreprocess({postcss: true}),
    }),
    typescript({ sourceMap: env.env === "DEV" }),
    resolve({
      browser: true,
      dedupe: ["svelte"],
    }),
    commonjs({
      include: "node_modules/**",
    }),
    alias({
      entries: {
        '@/*': './src/*'
      }
    }),
    json(),
  ],
};
