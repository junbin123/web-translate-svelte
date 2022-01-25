import svelte from "rollup-plugin-svelte";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import livereload from "rollup-plugin-livereload";
import json from "@rollup/plugin-json";
import { terser } from "rollup-plugin-terser";
import css from "rollup-plugin-css-only";
import preprocess from "svelte-preprocess";
const production = !process.env.ROLLUP_WATCH;

function serve() {
  let server;

  function toExit() {
    if (server) server.kill(0);
  }

  return {
    writeBundle() {
      if (server) return;
      server = require("child_process").spawn(
        "npm",
        ["run", "start", "--", "--dev"],
        {
          stdio: ["ignore", "inherit", "inherit"],
          shell: true,
        }
      );

      process.on("SIGTERM", toExit);
      process.on("exit", toExit);
    },
  };
}

const pluginsConfig = [
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
  !production && serve(),
  !production && livereload("public"),
  production && terser(),
];
// 跨域处理
function proxy({ port }) {
  let started = false;
  return {
    writeBundle() {
      if (!started) {
        started = true;
        var host = process.env.HOST || "localhost";
        var portTemp = process.env.PORT || port;
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

export default [
  {
    input: "src/content.js",
    output: {
      sourcemap: false,
      format: "iife",
      name: "content",
      file: "public/content/content.js",
    },
    plugins: [
      json(),
      ...pluginsConfig,
      css({ output: "content.css" }),
      !production && proxy({ port: 8082 }),
    ],
    watch: {
      clearScreen: false,
    },
  },
  {
    input: "src/background.js",
    output: {
      sourcemap: false,
      format: "iife",
      name: "background",
      file: "public/background/background.js",
    },
    plugins: [
      json(),
      ...pluginsConfig,
      css({ output: "background.css" }),
      !production && proxy({ port: 8083 }),
    ],
    watch: {
      clearScreen: false,
    },
  },
];
