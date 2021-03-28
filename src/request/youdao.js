import request from './request.js'
import { paramsStringify } from '../utils/common'
import SHA256 from '../utils/basic/sha256' // SHA256加密方法
const appKey = '7549b5a073a45b54' // 应用id
const secretKey = 'Es4HiS8rpwSFrV1ol7Lx6hXwkbHg6HbC' // 应用密钥 TODO:通过链接获取

/**
 *  有道翻译API
 * @param {Array} source 待翻译文本
 * @param {String} transType 原始语言=>目标语言 auto为自动检测
 */
export const youdaoApi = async ({ source = [], transType = '' }) => {
  const sourceStr = source.join('\n')
  console.log({ sourceStr })
  if (!sourceStr) {
    return
  }
  const from = transType.split('2')[0]
  const to = transType.split('2')[1]
  let input = sourceStr
  if (sourceStr.length > 20) {
    input = sourceStr.slice(0, 10) + sourceStr.length + sourceStr.slice(-10)
  }
  const salt = new Date().getTime()
  const curtime = Math.round(salt / 1000)
  const signStr = appKey + input + salt + curtime + secretKey
  const sign = SHA256(signStr)
  const data = {
    q: encodeURIComponent(sourceStr),
    appKey,
    salt,
    from,
    to,
    sign,
    curtime,
    signType: 'v3'
  }
  const url = `https://openapi.youdao.com/api?${paramsStringify(data)}`
  const { translation = [], l = '' } = await request.get(url)
  return {
    source,
    target: translation[0].split('\n'),
    sourceLang: l.split('2')[0],
    tragetLang: l.split('2')[1]
  }
}

// 如何调用?
// import { youdaoApiOrigin } from './request/youdao'
// const source = ['There are many articles', 'In general']
// const transType = 'auto2zh-CHS'
// youdaoApiOrigin({ source, transType })
//   .then(res => {
//     console.log('j---', res)
//   })
//   .catch(err => {
//     console.log('j---', err)
//   })
