/**
 * 移除dom
 * @param {dom} ele
 * @returns
 */
export const removeDom = (ele) => {
  const parent = ele.parentElement
  const res = parent.removeChild(ele)
  return res
}

/**
 * 判断dom是否出现在屏幕上（只支持竖向）
 * @param {element} element
 */
export const judgeDomVisible = (element) => {
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

/**
 * 判断dom是否要翻译
 * @param {element} element dom对象
 * @return {boolean} true 要的 false 不要的
 */
export const filterDom = ({ element }) => {
  const text = element.textContent.replace(/\s+/g, '')
  if (text.length < 4) {
    return false
  }

  const filterTagList = ['SCRIPT', 'CODE', 'NOSCRIPT', 'STYLE'] // 需要过滤的标签
  if (filterTagList.includes(element.nodeName)) {
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

// 将子节点转化为element
export const toChildElement = (parent) => {
  if (parent.hasChildNodes()) {
    const childList = parent.childNodes
    childList.forEach((item) => {
      if (item.textContent.replace(/\s+/g, '') && item.nodeName === '#text') {
        const newEle = document.createElement('div')
        newEle.innerText = item.textContent.trim() + '新'
        parent.replaceChild(newEle, item)
      }
    })
  }
}

// dom扁平化
export const flattenNodes = (element) => {
  const result = []
  recursiveNodes(element)
  // 递归dom
  function recursiveNodes(element = {}) {
    const childList = Array.from(element.children || []).filter(
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
        Array.from(element.children || []).forEach(recursiveNodes)
      }
    } else if (isFilter) {
      result.push(element)
    }
  }
  return result
}

/**
 * 添加子节点
 * @param {element} element 父节点
 * @param {string} str 子节点文字
 */
export const addChildNode = ({ parentDom, childText }) => {
  const childNode = document.createElement('div')
  childNode.innerText = childText
  childNode.setAttribute('class', 'content-class')
  parentDom.appendChild(childNode)
  return childNode
}

// 获取未翻译原始node→根据字数截取要翻译node→添加子元素，并添加到targetNodeListTemp→
// transIndex增加→获取要翻译的字符串→请求接口→替换为获取翻译后的文字→targetNodeList更新

// const node = nodeList[transIndex + 1]
// const { relativeWindow = '', isVisible = false } = judgeDomVisible(node)
// console.log(node, isVisible, relativeWindow)
// if (isVisible || relativeWindow === 'unknown') {
// if (true) {

//   const list = nodeList.slice(transIndex + 1)
//   const { targetList, endIndex } = getListByLength({ list: textList.slice(transIndex + 1), length: 2000, separator })
//   const targetNodeListTemp = []
//   targetList.forEach((item, index) => {
//     const node = addChildNode(list[index], item)
//     targetNodeListTemp.push(node)
//   })
//   transIndex += endIndex + 1
//   const source = encodeURIComponent(targetList.join(separator))
//   const { target } = await reuqestDeepL({ source })
//   const targetTextList = target?.split(separator)
//   targetNodeListTemp.forEach((item, index) => {
//     item.innerText = targetTextList[index]
//     item.setAttribute('class', '')
//   })
//   targetNodeList = [...targetNodeList, ...targetNodeListTemp]
// }
