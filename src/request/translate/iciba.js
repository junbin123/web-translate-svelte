import request from '../request.js'
/**
 *  金山词霸API，只支持单词短语，中英互译
 * @param {String} source 待翻译文本列表
 */
export async function icibaApi({ source = '' }) {
  const url = `http://www.iciba.com/word?w=${encodeURIComponent(source)}`
  try {
    const res = await request.get(url)
    const el = document.createElement('html')
    el.innerHTML = res
    const meanDom = el.getElementsByClassName('Mean_part__1RA2V')[0]?.childNodes ?? []
    const mean = Array.prototype.slice.call(meanDom).map(item => item?.textContent ?? '')
    const tag = el.getElementsByClassName('Mean_tag__2vGcf')[0]?.textContent ?? ''
    const exampleDom = el.getElementsByClassName('NormalSentence_sentence__3q5Wk')
    const example = Array.prototype.slice
      .call(exampleDom)
      .slice(0, 3)
      .map(item => {
        return {
          source: item?.childNodes[0]?.textContent ?? '',
          taeget: item?.childNodes[1]?.textContent ?? '',
          from: item?.childNodes[2]?.textContent ?? ''
        }
      })
    return {
      mean, // 释义
      tag, //  标签
      example // 例句
    }
  } catch (err) {
    console.log(err)
  }
}

// import { icibaApi } from './request/translate/iciba.js'
// icibaApi({ source: 'request' }).then(res => {
//   console.log(res)
// })
