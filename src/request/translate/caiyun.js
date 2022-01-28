import request from '../request.js'
const token = '输入彩云翻译token' // TODO:通过链接获取
/**
 *  彩云翻译API
 * @param {Array} source 待翻译文本列表
 * @param {String} transType 原始语言=>目标语言 支持auto
 */
export async function caiyunApi({ source = [], transType = 'auto2zh' }) {
  const url = 'https://api.interpreter.caiyunai.com/v1/translator'
  const data = {
    source,
    trans_type: transType,
    detect: true
  }
  try {
    const { target = [] } = await request.post(url, data, {
      'x-authorization': 'token ' + token
    })
    return {
      source,
      target,
      sourceLang: transType.split('2')[0],
      tragetLang: transType.split('2')[1]
    }
  } catch (err) {
    console.log(err)
  }
}

// 如何调用？
// import { caiyunApi } from './request/translate/caiyun'
// const source = ['This Bloomberg report provided a good summary.']
// const transType = 'auto2zh'
// caiyunApi({ source, transType })
//   .then(res => {
//     console.log('j---', res)
//   })
//   .catch(err => {
//     console.log('j---', err)
//   })