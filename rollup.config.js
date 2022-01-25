import svelte from "rollup-plugin-svelte";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import css from "rollup-plugin-css-only";
import preprocess from "svelte-preprocess";
const production = !process.env.ROLLUP_WATCH;

const pluginsConfig = [
  production && terser(),
  svelte({
    compilerOptions: {
      dev: !production,
    },
    preprocess: preprocess(),
  }),
  resolve({
    browser: true,
    dedupe: ["svelte"],
  }),
  commonjs(),
];

export default [
  {
    input: "src/content.js",
    output: {
      sourcemap: false,
      format: "iife",
      name: "content",
      file: "public/content/content.js",
    },
    plugins: [css({ output: "content.css" }), ...pluginsConfig],
  },
  {
    input: "src/background.js",
    output: {
      sourcemap: false,
      format: "iife",
      name: "background",
      file: "public/background/background.js",
    },
    plugins: [css({ output: "background.css" }), ...pluginsConfig],
  },
];
