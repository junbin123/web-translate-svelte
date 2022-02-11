import svelte from 'rollup-plugin-svelte'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import css from 'rollup-plugin-css-only'
import scss from 'rollup-plugin-scss'
import preprocess from 'svelte-preprocess'
import image from '@rollup/plugin-image'
const production = !process.env.ROLLUP_WATCH

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
    dedupe: ['svelte'],
  }),
  commonjs(),
]

export default [
  {
    input: 'src/content.js',
    output: {
      sourcemap: false,
      format: 'iife',
      name: 'content',
      dir: 'public/content',
    },
    plugins: [
      ...pluginsConfig,
      image(),
      scss({ output: 'public/content/content.css' }),
      // proxy(),
    ],
  },
  {
    input: 'src/background.js',
    output: {
      sourcemap: false,
      format: 'iife',
      name: 'background',
      dir: 'public/background',
    },
    plugins: [css({ output: 'background.css' }), ...pluginsConfig],
  },
]
