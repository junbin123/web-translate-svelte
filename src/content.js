import { clearText } from './utils/common.js'
import { fullTrans } from './utils/full_translate.js'
import TransClick from './class/TransClick.js'
import TranslatePop from './components/main/TranslatePop.svelte'
console.log('我是content.js')
const app = new TranslatePop({
  target: document.body,
  props: {
    boxStyle: {
      left: '0px',
      right: '0px',
      position: 'absolute'
    },
    sourceText: '',
    isShow: false
  }
})
export default app

let selectText = '' // 选择翻译的文本
let selectRect = null // 选择的文本dom
let limitCount = 400 // 限制翻译的长度
const transClick = new TransClick() // 翻译按钮dom
document.addEventListener('mouseup', e => {
  window.setTimeout(() => {
    const selectInfo = window.getSelection()
    const text = clearText(selectInfo.toString())
    if (text && text !== selectText && text.length < limitCount) {
      selectText = text
      selectRect = selectInfo.getRangeAt(0).getBoundingClientRect()
      const { pageX, clientY } = e
      const top =
        clientY - selectRect.top > selectRect.height / 2
          ? selectRect.bottom + 1
          : selectRect.top - 27
      transClick.showDom({
        left: `${pageX}px`,
        top: `${top + document.scrollingElement.scrollTop}px`
      })
    }
  })
})

//  翻译按钮点击事件
transClick.dom.onclick = e => {
  transClick.hideDom()
  const top = Math.floor(selectRect.bottom + 6 + document.scrollingElement.scrollTop) + 'px'
  const left =
    Math.floor(
      selectRect.left + document.scrollingElement.scrollLeft - (168 - selectRect.width / 2)
    ) + 'px'
  console.log('选中文本：', selectText, selectText.length)
  if (app.$$.ctx[0]) {
    // isShow
    app.$set({
      isShow: true,
      sourceText: selectText
    })
  } else {
    app.$set({
      isShow: true,
      boxStyle: {
        left,
        top,
        position: 'absolute'
      },
      sourceText: selectText
    })
  }
}

// 页面点击事件
window.onload = () => {
  document.body.addEventListener(
    'click',
    e => {
      transClick.hideDom()
      const target = e.target
      const box = document.getElementById('trans-box') //获取你的目标元素
      if (!box) return
      if (!(target == box) && !box.contains(target)) {
        console.log('点击外面')
        if (!app.$$.ctx[4]) {
          // isPin 为false，初始化
          app.$$.ctx[8]() // handleClose() 事件
        }
      } else {
        console.log('点击里面')
      }
    },
    { capture: true }
  )
}
// 接收popup的值
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  fullTrans({ request })
  let currentUrl = `${document.location.origin}${document.location.pathname}`
  sendResponse({ canTrans: true, currentUrl })
})
