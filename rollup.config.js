import svelte from "rollup-plugin-svelte";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import css from "rollup-plugin-css-only";
import scss from "rollup-plugin-scss";
import preprocess from "svelte-preprocess";
import image from "@rollup/plugin-image";
const production = !process.env.ROLLUP_WATCH;

function proxy() {
  let started = false;
  return {
    writeBundle() {
      if (!started) {
        started = true;
        // Listen on a specific host via the HOST environment variable
        var host = "localhost";
        // Listen on a specific port via the PORT environment variable
        var portTemp = 8080;

        var cors_proxy = require("cors-anywhere");
        cors_proxy
          .createServer({
            originWhitelist: [], // Allow all origins
            requireHeader: ["origin", "x-requested-with"],
            removeHeaders: ["cookie", "cookie2"],
          })
          .listen(portTemp, host, function () {
            console.log("Running CORS Anywhere on " + host + ":" + portTemp);
          });
      }
    },
  };
}

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
      dir: "public/content",
    },
    plugins: [
      ...pluginsConfig,
      image(),
      scss({ output: "public/content/content.css" }),
      proxy(),
    ],
  },
  {
    input: "src/background.js",
    output: {
      sourcemap: false,
      format: "iife",
      name: "background",
      dir: "public/background",
    },
    plugins: [css({ output: "background.css" }), ...pluginsConfig],
  },
];
