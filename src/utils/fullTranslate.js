import { flattenNodes } from './common.js'
import { translateCaiYun } from '../request/index.js'
export let isOpenTrans = false // 是否开启翻译
export function setIsOpenTrans(value) {
  isOpenTrans = value
}
let nodeList = [] // 要翻译的所有元素
let textList = [] // 要翻译的所有文本列表
let transIndex = 0 // 翻译到哪个index
let targetNodeList = [] // 新增的元素
let transType = 'en2zh' // 翻译方式
let bgColor = ''
const transLength = 3000 // 每次翻译的文本长度
let isLoading = false

export const getNodeLength = () => {
  return targetNodeList.length
}

/**
 * 全文翻译方法
 * @param {String} params.transType
 */
export const fullTrans = async (params) => {
  transType = params.transType || 'en2zh'
  nodeList = flattenNodes(document.body)
  isLoading = true
  filterActiveDom(nodeList).then(res => {
    // console.log(1)
    // console.log(res)
    // const transTextList = res.map((item) => clearText(item.textContent))
    return doTransProcess({ originDomList: res })
  }).then(res => {
    isLoading = false
    console.log(res)
  })


  return
  console.log(1)
  textList = nodeList.map((item) => clearText(item.textContent))
  const { endIndex } = getListByLength({
    list: textList,
    length: transLength,
  })
  console.log({ endIndex })
  try {
    const { transDomList } = await doTransProcess({
      originDomList: nodeList.slice(0, endIndex + 1),
    })
    targetNodeList = transDomList
    transIndex = endIndex
  } catch (err) {
    console.log(err)
  }
}

// 监听页面滚动
window.addEventListener('scroll', debounce(windowScroll))

// 从文本列表获取目标长度字符list(超出不要)
function getListByLength({ list = [], length = 1000 }) {
  console.log({ list, length })
  let targetList = [] // 目标列表
  let text = ''
  let endIndex = 0 // 最后一个下标
  for (const [index, item] of list.entries()) {
    text += item
    endIndex = index
    if (text.length > length) {
      endIndex = index - 1
      targetList = list.slice(0, index)
      break
    }
  }
  if (endIndex === list.length - 1) {
    targetList = list
  }
  return {
    targetList,
    endIndex,
  }
}

/**
 * 页面滚动事件
 * @param {elemet} e
 */
async function windowScroll() {
  console.log('滚动监听', { isLoading })
  if (isLoading || !isOpenTrans) {
    return
  }
  isLoading = true
  const domList = flattenNodes(document.body)
  filterActiveDom(domList).then(res => {
    return doTransProcess({ originDomList: res })
  }).then(res => {
    console.log(res)
    isLoading = false
  })
}

/**
 * 添加子节点
 * @param {element} element 父节点
 * @param {string} str 子节点文字
 */
function addChildNode({ parentDom, childText }) {
  const childNode = document.createElement('font')
  childNode.dataset.wts = 'transTarget' // 用于过滤，不翻译
  childNode.innerText = childText
  childNode.setAttribute('class', 'wts-target-animation')
  parentDom.appendChild(childNode)
  return childNode
}

/**
 * 节流函数
 * @param {function} fn 执行函数
 * @param {number} delay 间隔时间
 */
function throttle(fn, delay = 200) {
  let timer = null
  return function () {
    if (timer) {
      return
    }
    timer = setTimeout(() => {
      fn.apply(this, arguments)
      timer = null
    }, delay)
  }
}

/**
 * 防抖函数
 * @param {function} fn 执行函数
 * @param {number} delay 间隔时间
 */
function debounce(fn, delay = 200) {
  let timer = null
  return function () {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn.apply(this, arguments)
      clearTimeout(timer)
    }, delay)
  }
}

// 将子节点转化为element
// function toChildElement(parent) {
//   if (parent.hasChildNodes()) {
//     const childList = parent.childNodes
//     childList.forEach((item) => {
//       if (item.textContent.replace(/\s+/g, '') && item.nodeName === '#text') {
//         const newEle = document.createElement('div')
//         newEle.innerText = item.textContent.trim() + '新'
//         parent.replaceChild(newEle, item)
//       }
//     })
//   }
// }

/**
 * 判断dom是否出现在屏幕上（只支持竖向）
 * @param {element} element
 */
function judgeDomVisible(element) {
  const scrollY = window.scrollY // 滚动距离
  const clientHeight = document.documentElement.clientHeight // 设备高度
  const offsetTop = element.offsetTop // dom距顶部距离
  const offsetHeight = element.offsetHeight // dom高度
  let relativeWindow = '' // 相对窗口位置
  if (offsetTop + offsetHeight < scrollY) {
    relativeWindow = 'outsideTop' // 上面
  } else if (offsetTop < scrollY) {
    relativeWindow = 'intersectTop' // 上面相交
  } else if (offsetTop + offsetHeight < scrollY + clientHeight) {
    relativeWindow = 'inside' // 里面
  } else if (offsetTop < scrollY + clientHeight) {
    relativeWindow = 'intersectBottom' // 下面在相交
  } else {
    relativeWindow = 'outsideBottom' // 下面
  }
  // 特殊标签无法获取，未知
  if (element.nodeName === 'FIGCAPTION') {
    relativeWindow = 'unknown'
  }

  return {
    relativeWindow,
    isVisible: ['intersectTop', 'inside', 'intersectBottom'].includes(relativeWindow),
  }
}

// 删除dom
function removeDom(ele) {
  const parent = ele.parentElement
  const res = parent.removeChild(ele)
  return res
}

// 执行翻译流程
async function doTransProcess({ originDomList = [] }) {
  isLoading = true
  console.log('doTransProcess', originDomList)
  if (originDomList.length === 0) return { transDomList: [] }
  const originTextList = [] // 没翻译的文本列表
  const transDomList = [] // 翻译好的dom
  originDomList.forEach((item) => {
    const text = clearText(item.textContent)
    const dom = addChildNode({ parentDom: item, childText: text })
    originTextList.push(text)
    transDomList.push(dom)
  })
  try {
    const { target } = await translateCaiYun({
      source: originTextList,
      transType,
    })
    if (!target || target.length === 0) {
      transDomList.forEach((item) => {
        removeDom(item)
      })
      return { transDomList: [] }
    }
    transDomList.forEach((item, index) => {
      item.innerText = target[index]
      item.setAttribute('class', 'wts-target-complete')
      item.style.backgroundColor = bgColor
    })
  } catch (err) {
    transDomList.forEach((item) => {
      removeDom(item)
    })
    return { transDomList: [] }
  }
  isLoading = false
  return { transDomList }
}

// 纯函数：清理文本
function clearText(text) {
  const result = text
    .trim()
    .replace(/[\n\r]/g, '')
    .replace(/\s+/g, ' ')
  return result
}

export const removeAllDom = () => {
  targetNodeList.forEach((item) => {
    removeDom(item)
  })
  transIndex = 0
  targetNodeList.length = 0
}

export const changeNodeColor = ({ color }) => {
  bgColor = color
  targetNodeList.forEach((ele) => {
    ele.style.backgroundColor = color
  })
}

// function transFunc(data = {}) {
//   const promise = new Promise((resolve, reject) => {
//     const { source = ['hello world'], transType = 'auto2zh' } = data
//     chrome.runtime.sendMessage({ source, transType }, (response) => {
//       console.log('接收消息', { ...response })
//       if (response.code === -1) {
//         // alert(response.error_msg);
//         toast.push('response.error_msg', {
//           theme: {
//             '--toastBackground': '#F56565',
//             '--toastBarBackground': '#C53030',
//           },
//         })
//         reject(response)
//       } else {
//         resolve(response)
//       }
//     })
//   })
//   return promise
// }

/**
 * 过滤出显示在当前视口的dom
 * @param {Array} domList dom列表
 * @return {Promise} 过滤后的dom列表
 */
function filterActiveDom(domList) {
  const filterList = Array.from(domList)
  const options = {
    root: document.querySelector('#viewport'),
    rootMargin: '0px',
    threshold: 1.0
  }

  const promise = new Promise(resolve => {
    const observer = new IntersectionObserver(callback, options)
    filterList.forEach((item) => {
      observer.observe(item)
    })
    function callback(entries) {
      console.log('执行callback')
      const res = entries.filter(item => item.isIntersecting).map(item => item.target)
      observer.disconnect()
      resolve(res)
    }
  })
  return promise
}
