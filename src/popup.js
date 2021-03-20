console.log('我是 popup.js')

import Popup from './components/main/Popup.svelte'
const app = new Popup({
  target: document.body,
  props: {
    name: 'wo2r3ld'
  }
})

// 页面开发切换
// import App from './App.svelte'
// const app = new App({
//   target: document.body,
//   props: {
//     name: 'world'
//   }
// })

export default app








