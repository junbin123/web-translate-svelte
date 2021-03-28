import request from './request.js'
const token = 'oo00trx4oclspt3nqhfc' // TODO:通过链接获取
/**
 *  彩云翻译API
 * @param {Array} source 待翻译文本列表
 * @param {String} transType 原始语言=>目标语言 支持auto
 */
export async function caiYunApi({ source = [], transType = 'auto2zh' }) {
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
