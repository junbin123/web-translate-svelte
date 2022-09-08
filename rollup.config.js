import svelte from 'rollup-plugin-svelte'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import css from 'rollup-plugin-css-only'
import scss from 'rollup-plugin-scss'
import preprocess from 'svelte-preprocess'
import image from '@rollup/plugin-image'
import fs from 'fs'

const production = !process.env.ROLLUP_WATCH

const path = `${__dirname}/src/config.js`
if (!fs.existsSync(path)) {
  fs.writeFileSync(path, 'export const caiYunToken = \'oo00trx4oclspt3nqhfc\'')
  console.log('请在config.js中配置token')
  process.exit(0)
}

const pluginsConfig = [
  production && terser({
    compress: {
      // module: true,
      // toplevel: true,
      // unsafe_arrows: true,
      drop_console: production,
      drop_debugger: production,
    },
  }),
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
      dir: 'dist/content',
    },
    plugins: [
      ...pluginsConfig,
      image(),
      scss({ output: 'dist/content/content.css' }),
      // proxy(),
    ],
  },
  {
    input: 'src/background.js',
    output: {
      sourcemap: false,
      format: 'iife',
      name: 'background',
      dir: 'dist/background',
    },
    plugins: [css({ output: 'background.css' }), ...pluginsConfig],
  },
]
