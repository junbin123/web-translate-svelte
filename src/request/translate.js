// /**
//  * 二次封装的deepL api
//  * @param {*}
//  * @returns
//  */
// async function reuqestDeepL({ source = '', transType = 'en2zh' }) {
//   const url = `${originUrl}/deepl/trans?source=${source}&transType=${transType}`
//   const params = { method: 'GET' }
//   try {
//     const res = await fetch(url, params).then(data => data.json())
//     return res
//   } catch (err) {
//     return err
//   }
// }

// /**
//  * 请求翻译接口
//  * @param {array} source 翻译内容
//  * @param {string} transType 目标语言
//  */
// export const requestCaiYun = async ({ source = [], transType = 'en2zh' }) => {
//   const url = 'https://api.interpreter.caiyunai.com/v1/translator'
//   const data = {
//     source,
//     trans_type: transType,
//     detect: true
//   }
//   const params = {
//     headers: {
//       'content-type': 'application/json',
//       'x-authorization': 'token oo00trx4oclspt3nqhfc'
//     },
//     body: JSON.stringify(data),
//     method: 'POST'
//   }
//   try {
//     const res = await fetch(url, params).then(data => {
//       return data.json()
//     })
//     console.log('彩云结果', res)
//     return res
//   } catch (err) {
//     console.log('彩云报错', err)
//     return err
//   }
// }

export const transByDeepl = ({ source = [], transType = 'en2zh' }) => {
  console.log('请求接口', source)
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(source.map(item => '翻译--' + item))
    }, 1000)
  })
}
