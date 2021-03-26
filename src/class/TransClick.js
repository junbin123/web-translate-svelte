/**
 * 页面翻译按钮
 */
import { clearText, getImgUrl, queryStringify } from '../utils/common'

class TransClick {
  constructor() {
    this.iconStyle = {
      position: 'absolute',
      display: 'none',
      'z-index': 9999,
      width: '26px',
      height: '26px',
      'border-radius': '4px',
      'box-sizing': 'border-box',
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer'
    }
    this.dom = this.createIconDom()
    this.isShow = false
  }
  createIconDom() {
    const res = document.createElement('img')
    res.setAttribute('src', getImgUrl('./images/logo48.png'))
    res.setAttribute('style', queryStringify(this.iconStyle))
    document.body.insertBefore(res, document.body.firstElementChild)
    return res
  }
  hideDom() {
    this.isShow = false
    this.dom.setAttribute(
      'style',
      queryStringify({
        ...this.iconStyle,
        display: 'none'
      })
    )
  }
  showDom({ left = '10px', top = '10px' }) {
    this.isShow = true
    this.dom.setAttribute(
      'style',
      queryStringify({
        ...this.iconStyle,
        display: 'block',
        left,
        top
      })
    )
  }
}

// let selectText = '' // 选择翻译的文本
// let selectRect = null // 选择的文本dom
// let limitCount = 400 // 限制翻译的长度
// const transClick = new TransClick() // 翻译按钮dom
// document.addEventListener('mouseup', e => {
//   window.setTimeout(() => {
//     const selectInfo = window.getSelection()
//     const text = clearText(selectInfo.toString())
//     if (text && text !== selectText && text.length < limitCount) {
//       selectText = text
//       selectRect = selectInfo.getRangeAt(0).getBoundingClientRect()
//       const { pageX, clientY } = e
//       const top = clientY - selectRect.top > selectRect.height / 2 ? selectRect.bottom + 1 : selectRect.top - 27
//       console.log('选择文本：', text, text.length)
//       transClick.showDom({
//         left: `${pageX}px`,
//         top: `${top + document.scrollingElement.scrollTop}px`
//       })
//     }
//   })
// })

export default TransClick
