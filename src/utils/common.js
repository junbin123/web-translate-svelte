/**
 * 文本清洗（清除左右空格，所有换行，多余空格）
 * @param {String} str
 * @returns {String}
 */
export const clearText = (str) => {
  const result = str
    .trim()
    .replace(/[\r\n]/g, '')
    .replace(/\s+/g, ' ')
  return result
}

/**
 * 节流函数
 * @param {function} fn 执行函数
 * @param {number} delay 间隔时间
 */
export const throttle = (fn, delay = 500) => {
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

// 从文本列表获取目标长度字符list(超出不要)
export const getListByLength = ({ list = [], length = 1000 }) => {
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
 * 对象参数转字符串
 * @param {*} params 路由参数
 */
export const queryStringify = (params = {}) => {
  return Object.keys(params).reduce((p, c, i) => p + `${i === 0 ? '' : ';'}${c}:${params[c]}`, '')
}

/**
 * 路由对象参数转字符串
 * @param {*} params 路由参数
 */
export const paramsStringify = (params = {}) => {
  return Object.keys(params).reduce((p, c, i) => p + `${i === 0 ? '' : '&'}${c}=${params[c]}`, '')
}

/**
 * 节流函数
 */

/**
 * 防抖函数
 * @param {function} fn 执行函数
 * @param {number} delay 间隔时间
 */
export const debounce = (fn, delay = 500) => {
  let timer = null
  return function () {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn.apply(this, arguments)
      timer = null
    }, delay)
  }
}

/**
 * 获取本地图片绝对路径
 */
export const getImgUrl = (url) => {
  return chrome?.extension?.getURL(url) ?? url
}

// 获取用户浏览器信息
export const getBrowserInfo = () => {
  const { platform, appName, languages, language, vendor, userAgent } = navigator
  const { height: screenHeight, width: screenWidth } = window.screen
  const browserInfo = {
    platform, // 客户端系统
    appName, // 浏览器名称
    language, // 浏览器默认语言
    languages,
    vendor, // 浏览器厂家信息
    userAgent, // 返回浏览器及版本信息
    screenHeight, // 屏幕高度
    screenWidth, // 屏幕宽度
  }
  return browserInfo
}

/**
 * dom扁平化
 * @param {Object} element document.body 对象
 * @returns {Array} result
 */
export function flattenNodes(element) {
  const result = []
  recursiveNodes(element)
  // 递归dom
  function recursiveNodes(element) {
    const childList = Array.from(element?.children || []).filter(
      (item) => item.nodeName !== 'SCRIPT'
    )
    const isFilter = filterDom({ element })
    if (childList.length > 0 && isFilter) {
      // #text和Tag处于同一级，push共同的父级
      const canPush = Array.from(element.childNodes)
        .filter((item) => item.textContent.replace(/\s+/g, '') && item.nodeName !== 'SCRIPT')
        .map((item) => item.nodeName)
        .some((item) => item === '#text')
      if (canPush) {
        result.push(element)
      } else {
        Array.from(element?.children || []).forEach(recursiveNodes)
      }
    } else if (isFilter) {
      result.push(element)
    }
  }
  return result
}

/**
 * 过滤不需要翻译的dom
 * @param {element} element dom对象
 * @param {string} url 页面url 一般为window.location.host
 * @return {boolean} true 要的 false 不要的
 */
export function filterDom({ element, url = window.location.host }) {
  const text = element.textContent.replace(/\s+/g, '')
  if (text.length < 4) {
    return false
  }

  if (element.id === 'web-translate-svelte') {
    return false
  }

  const filterTagList = ['SCRIPT', 'CODE', 'NOSCRIPT', 'STYLE'] // 需要过滤的标签
  if (filterTagList.includes(element.nodeName)) {
    return false
  }

  if (window.getComputedStyle(element, null).display === 'none') {
    // 隐藏的元素
    return false
  }

  const isChildNoTrans = Array.from(element.childNodes).every((item) =>
    filterTagList.includes(item.nodeName)
  ) // 子元素都是不需要翻译的
  if (isChildNoTrans) {
    return false
  }
  return true
}
