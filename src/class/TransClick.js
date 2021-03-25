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

export default TransClick
