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
    const childList = Array.from(element?.children || []).filter(item => item.nodeName !== 'SCRIPT')
    const isFilter = filterDom({ element })
    if (childList.length > 0 && isFilter) {
      // #text和Tag处于同一级，push共同的父级
      const canPush = Array.from(element.childNodes)
        .filter(item => item.textContent.replace(/\s+/g, '') && item.nodeName !== 'SCRIPT')
        .map(item => item.nodeName)
        .some(item => item === '#text')
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

  const filterTagList = ['SCRIPT', 'CODE', 'NOSCRIPT', 'STYLE'] // 需要过滤的标签
  if (filterTagList.includes(element.nodeName)) {
    return false
  }

  if (window.getComputedStyle(element, null).display === 'none') {
    // 隐藏的元素
    return false
  }

  const isChildNoTrans = Array.from(element.childNodes).every(item =>
    filterTagList.includes(item.nodeName)
  ) // 子元素都是不需要翻译的
  if (isChildNoTrans) {
    return false
  }
  return true
}
