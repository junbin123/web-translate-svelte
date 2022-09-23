import { flattenNodes, getLanguageType } from './common.js'
import { translateCaiYun } from '../request/index.js'
import { showToast } from './show-toast.js'

export let isOpenTrans = false // 是否开启翻译
export function setIsOpenTrans(value) {
  isOpenTrans = value
}
let targetNodeList = [] // 新增的元素
let bgColor = ''
let transDrection = { // 翻译方向
  source: '',
  target: ''
}
let targetDomList = [] // 正在进行翻译的dom
const transLength = 2000 // 每次翻译的文本长度
let isLoading = false

export const getNodeLength = () => {
  return targetNodeList.length
}

/**
 * 全文翻译方法
 * @param {String} params.transType
 */
export function fullTrans() {
  isLoading = true
  const flatDomList = flattenNodes(document.body)
  filterActiveDom(flatDomList).then(res => {
    const { sourceTextList, targetDomList } = addTargetDom({ sourceDomList: res })
    if (!transDrection.source) {
      const { resultList } = getListByLength({ list: sourceTextList, length: 500 })
      transDrection = getLanguageType(resultList.join(" ")) // {source: 'zh-Hans', target: 'zh-Hans'}
      console.log('喂养数据：', resultList.join(" "))
      console.log("识别结果：", transDrection)
    }
    const { source, target } = transDrection
    if (source === target && source) {
      const msg = `${source} → ${target}，无需翻译`
      showToast.error(msg)
      return Promise.reject(msg)
    }
    return doTransProcess({ sourceTextList, targetDomList })
  }).then(res => {
    console.log(res)
    isLoading = false
  }).catch(err => {
    targetDomList.forEach((item) => removeDom(item))
    isLoading = false
  })
}

// 监听页面滚动
window.addEventListener('scroll', debounce(windowScroll))



/**
 * 页面滚动事件
 */
function windowScroll() {
  if (isLoading || !isOpenTrans) {
    return
  }
  fullTrans()
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
  // const parent = ele.parentElement
  // const res = parent.removeChild(ele)
  // return res
  ele = null
}

// 添加翻译结果的dom
function addTargetDom({ sourceDomList } = {}) {
  if (sourceDomList.length === 0) return
  const sourceTextList = [] // 没翻译的文本列表
  targetDomList = [] // 翻译结果dom
  sourceDomList.forEach((item) => {
    const text = clearText(item.textContent)
    const dom = addChildNode({ parentDom: item, childText: text })
    sourceTextList.push(text)
    targetDomList.push(dom)
  })
  return { sourceTextList, targetDomList }
}

// 执行翻译流程
function doTransProcess({ sourceTextList, targetDomList }) {
  // TODO:调整translateCaiYun
  return translateCaiYun({
    sourceTextList: sourceTextList,
    ...transDrection
  }).then(res => {
    const { targetTextList } = res
    targetDomList.forEach((item, index) => {
      item.innerText = targetTextList[index]
      item.setAttribute('class', 'wts-target-complete')
      item.style.backgroundColor = bgColor
    })
    isLoading = false
    return res
  })
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
  targetNodeList.length = 0
}

export const changeNodeColor = ({ color }) => {
  bgColor = color
  targetNodeList.forEach((ele) => {
    ele.style.backgroundColor = color
  })
}



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

// 从文本列表获取目标长度字符list(超出不要)
function getListByLength({ list = [], length = 1000 }) {
  let resultList = [] // 目标列表
  let text = ''
  let endIndex = 0 // 最后一个下标
  for (const [index, item] of list.entries()) {
    text += item
    endIndex = index
    if (text.length > length) {
      endIndex = index - 1
      resultList = list.slice(0, index)
      break
    }
  }
  if (endIndex === list.length - 1) {
    resultList = list
  }
  return {
    resultList,
    endIndex,
  }
}
