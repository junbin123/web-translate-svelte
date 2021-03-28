console.log('我是 index.js')
import App from './App.svelte'
const app = new App({
  target: document.body,
  props: {
    name: '我是App'
  }
})
export default app

import { caiYunApi } from './request/caiyun'
caiYunApi({ source: ['hello', 'world'], transType: 'auto2zh' }).then(res => {
  console.log('jj', res)
})
