console.log('我是 popup.js')

import Popup from './components/main/Popup.svelte'
const app = new Popup({
  target: document.body
})
export default app
