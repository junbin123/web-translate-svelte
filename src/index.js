console.log('我是 index.js')
import App from './App.svelte'
const app = new App({
  target: document.body,
  props: {
    name: '我是App'
  }
})
export default app

// 有道api调试
import { youdaoApiOrigin } from './request/youdao'
youdaoApiOrigin({}).then(res => {
  console.log(res)
})
