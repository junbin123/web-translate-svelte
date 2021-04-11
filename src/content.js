import { clearText } from './utils/common.js'
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

// import { clearText, throttle, getListByLength } from './utils/common.js'
// import { removeDom, judgeDomVisible, flattenNodes, addChildNode } from './utils/dom.js'
// import { requestCaiYun } from './request/translate.js'
// // import FormSelect from './components/FormSelect.svelte'

// // const app = new FormSelect({
// //   target: document.body,
// //   props: {
// //     name: "I'm content"
// //   }
// // })
// // console.log(app, 'kkk')

// // export default app

// let separator = '<&&>' // 特殊字符创串，用于分隔
// let nodeList = [] // 要翻译的所有元素
// let textList = [] // 要翻译的所有文本列表
// let transIndex = 0 // 翻译到哪个index
// let targetNodeList = [] // 新增的元素
// let transType = 'en2zh' // 翻译方式
// const transLength = 3000 // 每次翻译的文本长度
// let isLoading = false
// let currentUrl = `${document.location.origin}${document.location.pathname}`
// chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
//   console.log('来自popup的数据', request)
//   const { action = '' } = request
//   if (action === 'noTrans') {
//     removeAllDom()
//     sendResponse({ status: 'done' })
//     return
//   }
//   transType = `${request.source}2${request.target}`
//   console.log('点击', request, { transIndex })
//   if (currentUrl !== `${document.location.origin}${document.location.pathname}`) {
//     // TODO:页面跳转需要清除翻译好的dom，现在是清除不干净
//     sendResponse({ canTrans: false, currentUrl })
//     transIndex = 0
//     currentUrl = `${document.location.origin}${document.location.pathname}`
//   }
//   if (transIndex > 0) {
//     sendResponse({ canTrans: false, currentUrl })
//     return
//   }
//   sendResponse({ canTrans: true, currentUrl })
//   nodeList = flattenNodes(document.body)
//   textList = nodeList.map(item => clearText(item.textContent))

//   let number = 0
//   textList.forEach(item => {
//     number += item.length
//   })
//   console.log('--------number', number)
//   console.log('nodeList', nodeList)
//   console.log('textList', textList)
//   const { targetList, endIndex } = getListByLength({ list: textList, length: transLength })
//   console.log('')
//   try {
//     const { transDomList } = await doTransProcess({ originDomList: nodeList.slice(0, endIndex + 1) })
//     targetNodeList = transDomList
//     transIndex = endIndex
//   } catch (err) {
//     console.log(err)
//   }
// })
// // 监听页面滚动
// window.addEventListener('scroll', throttle(windowScroll))

// /**
//  * 页面滚动事件
//  * @param {elemet} e
//  */
// async function windowScroll(e) {
//   if (transIndex === 0 || transIndex === nodeList.length - 1 || isLoading) {
//     return
//   }
//   const dom = nodeList[transIndex + 1]
//   const { relativeWindow = '', isVisible = false } = judgeDomVisible(dom)
//   if (['intersectBottom', 'outsideBottom'].includes(relativeWindow)) {
//     return
//   }
//   isLoading = true
//   const nextTextList = textList.slice(transIndex + 1)
//   const { targetList, endIndex } = getListByLength({ list: nextTextList, length: transLength })
//   try {
//     const { transDomList } = await doTransProcess({ originDomList: nodeList.slice(transIndex + 1, transIndex + 2 + endIndex) })
//     targetNodeList = [...targetNodeList, ...transDomList]
//     transIndex += endIndex + 1
//   } catch (err) {
//     console.log(err)
//   }
//   isLoading = false
// }

// // 执行翻译流程
// async function doTransProcess({ originDomList = [] }) {
//   isLoading = true
//   console.log('doTransProcess', originDomList)
//   if (originDomList.length === 0) return []
//   const originTextList = [] // 没翻译的文本列表
//   const transDomList = [] // 翻译好的dom
//   originDomList.forEach((item, index) => {
//     const text = clearText(item.textContent)
//     const dom = addChildNode({ parentDom: item, childText: text })
//     originTextList.push(text)
//     transDomList.push(dom)
//   })
//   console.log(1)
//   try {
//     const { target } = await requestCaiYun({ source: originTextList, transType })
//     console.log(2, target)
//     if (!target || target.length === 0) {
//       transDomList.forEach(item => {
//         removeDom(item)
//       })
//       return { transDomList: [] }
//     }
//     transDomList.forEach((item, index) => {
//       item.innerText = target[index]
//       item.setAttribute('class', 'content-class-complete')
//     })
//   } catch (err) {
//     console.log(err)
//     transDomList.forEach(item => {
//       removeDom(item)
//     })
//     return { transDomList: [] }
//   }
//   isLoading = false
//   return { transDomList }
// }

// function removeAllDom() {
//   targetNodeList.forEach(item => {
//     removeDom(item)
//   })
//   transIndex = 0
//   targetNodeList.length = 0
// }
