import svelte from 'rollup-plugin-svelte'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import livereload from 'rollup-plugin-livereload'
import { terser } from 'rollup-plugin-terser'
import css from 'rollup-plugin-css-only'
import preprocess from 'svelte-preprocess'
// import dev from 'rollup-plugin-dev'

const production = !process.env.ROLLUP_WATCH

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
  production && terser(),
  // dev({})
]

export default [
  {
    input: 'src/index.js',
    output: {
      sourcemap: false,
      format: 'iife',
      name: 'index',
      file: 'public/index/index.js'
    },
    plugins: [...pluginsConfig, css({ output: 'index.css' })],
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
    plugins: [...pluginsConfig, css({ output: 'popup.css' })],
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
    plugins: [...pluginsConfig, css({ output: 'content.css' })],
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
    plugins: [...pluginsConfig, css({ output: 'background.css' })],
    watch: {
      clearScreen: false
    }
  }
]
