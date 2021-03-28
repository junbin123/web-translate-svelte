/**
 * 文本清洗（清除左右空格，所有换行，多余空格）
 * @param {String} str
 * @returns {String}
 */
export const clearText = str => {
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
    endIndex
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
export const getImgUrl = url => {
  return chrome?.extension?.getURL(url) ?? url
}
