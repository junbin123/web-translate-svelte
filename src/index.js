console.log('我是 index.js')
import App from './App.svelte'
const app = new App({
  target: document.body,
  props: {
    name: '我是App'
  }
})
export default app

import { youdaoApiOrigin } from './request/youdao'
youdaoApiOrigin({})
  .then(res => {
    console.log('j---', res)
  })
  .catch(err => {
    console.log('j---', err)
  })
