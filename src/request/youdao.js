import request from './request.js'
import SHA256 from '../utils/basic/sha256'
const appId = '7549b5a073a45b54' //
const salt = '123ABC' //

/**
 *  封装有道翻译API，支持列表文本翻译
 * @param {Array} source 待翻译文本
 * @param {String} transType 原始语言=>目标语言 auto为自动检测
 */
const youdaoApi = async (source = [], transType = 'en2zh') => {
  const input = 'hello'
  const salt = '123ABC'
  const secretKey = 'Es4HiS8rpwSFrV1ol7Lx6hXwkbHg6HbC'
  const now = new Date()
  const UTCTimestamp = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  )
  const a = appId + input + salt + UTCTimestamp + secretKey
  const res = SHA256(a)
  console.log(res)
}

/**
 * 有道翻译API
 */
export const youdaoApiOrigin = async ({ source = '', transType = '' }) => {
  const data = {
    q: 'hello',
    from: 'auto',
    to: 'zh-CHS',
    appKey: '7549b5a073a45b54',
    salt: '123ABC'
  }
  const res = await request.post('https://openapi.youdao.com/api', data)
  return res
}
