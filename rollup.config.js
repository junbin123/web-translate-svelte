import svelte from 'rollup-plugin-svelte'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import livereload from 'rollup-plugin-livereload'
import { terser } from 'rollup-plugin-terser'
import css from 'rollup-plugin-css-only'
import preprocess from 'svelte-preprocess'
const production = !process.env.ROLLUP_WATCH
console.log({ production })

function serve() {
  let server

  function toExit() {
    if (server) server.kill(0)
  }

  return {
    writeBundle() {
      if (server) return
      server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
        stdio: ['ignore', 'inherit', 'inherit'],
        shell: true
      })

      process.on('SIGTERM', toExit)
      process.on('exit', toExit)
    }
  }
}

const pluginsConfig = [
  svelte({
    compilerOptions: {
      dev: !production
    },
    preprocess: preprocess()
  }),
  resolve({
    browser: true,
    dedupe: ['svelte']
  }),
  commonjs(),
  !production && serve(),
  !production && livereload('public'),
  production && terser()
]
// 跨域处理
function proxy({ port }) {
  let started = false
  return {
    writeBundle() {
      if (!started) {
        started = true
        // Listen on a specific host via the HOST environment variable
        var host = process.env.HOST || 'localhost'
        // Listen on a specific port via the PORT environment variable
        var portTemp = process.env.PORT || port

        var cors_proxy = require('cors-anywhere')
        cors_proxy
          .createServer({
            originWhitelist: [], // Allow all origins
            requireHeader: ['origin', 'x-requested-with'],
            removeHeaders: ['cookie', 'cookie2']
          })
          .listen(portTemp, host, function () {
            console.log('Running CORS Anywhere on ' + host + ':' + portTemp)
          })
      }
    }
  }
}

export default [
  {
    input: 'src/index.js',
    output: {
      sourcemap: false,
      format: 'iife',
      name: 'index',
      file: 'public/index/index.js'
    },
    plugins: [...pluginsConfig, css({ output: 'index.css' }), !production && proxy({ port: 8080 })],
    watch: {
      clearScreen: false
    }
  },
  {
    input: 'src/popup.js',
    output: {
      sourcemap: false,
      format: 'iife',
      name: 'popup',
      file: 'public/popup/popup.js'
    },
    plugins: [...pluginsConfig, css({ output: 'popup.css' }), !production && proxy({ port: 8081 })],
    watch: {
      clearScreen: false
    }
  },
  {
    input: 'src/content.js',
    output: {
      sourcemap: false,
      format: 'iife',
      name: 'content',
      file: 'public/content/content.js'
    },
    plugins: [
      ...pluginsConfig,
      css({ output: 'content.css' }),
      !production && proxy({ port: 8082 })
    ],
    watch: {
      clearScreen: false
    }
  },
  {
    input: 'src/background.js',
    output: {
      sourcemap: false,
      format: 'iife',
      name: 'background',
      file: 'public/background/background.js'
    },
    plugins: [
      ...pluginsConfig,
      css({ output: 'background.css' }),
      !production && proxy({ port: 8083 })
    ],
    watch: {
      clearScreen: false
    }
  }
]
