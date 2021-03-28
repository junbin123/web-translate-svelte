console.log('我是 index.js')
import App from './App.svelte'
const app = new App({
  target: document.body,
  props: {
    name: '我是App'
  }
})
export default app

// import { baiduApi } from './request/baidu'
// baiduApi({ source: ['你好', '世界'], transType: 'auto2en' }).then(res => {
//   console.log(res, 'lll')
// })
