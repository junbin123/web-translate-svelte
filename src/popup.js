console.log('我是 popup.js')

import Popup from './components/main/Popup.svelte'
const app = new Popup({
  target: document.body,
  props: {
    name: '我是popup'
  }
})
export default app

