console.log('我是 index.js')
import App from './App.svelte'
const app = new App({
  target: document.body,
  props: {
    name: '我是App'
  }
})
export default app

// 有道api调试
import { youdaoApiOrigin } from './request/youdao'
youdaoApiOrigin({}).then(res => {
  console.log('---', res)
})

requestTest()
requestCaiYun({ source: ['hello'], transType: 'en2zh' })
async function requestTest() {
  // const url = 'http://www.iciba.com/word?w=hello'
  const url = 'https://openapi.youdao.com/api'
  const data = {
    q: 'hello',
    from: 'auto',
    to: 'zh-CHS',
    appKey: '7549b5a073a45b54',
    salt: '123ABC'
  }
  const params = {
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(data),
    method: 'POST',
    // mode: 'no-cors',
    header: {
      'Access-Control-Allow-Origin': '*'
    }
  }
  try {
    const res = await fetch(url, params).then(data => {
      console.log('----', data)
      return data.json()
    })
    console.log('彩云结果', res)
    return res
  } catch (err) {
    console.log('彩云报错', err)
    return err
  }
}

async function requestCaiYun({ source = [], transType = 'en2zh' }) {
  const url = 'https://api.interpreter.caiyunai.com/v1/translator'
  const data = {
    source,
    trans_type: transType,
    detect: true
  }
  const params = {
    headers: {
      'content-type': 'application/json',
      'x-authorization': 'token oo00trx4oclspt3nqhfc'
    },
    body: JSON.stringify(data),
    method: 'POST'
  }
  try {
    const res = await fetch(url, params).then(data => {
      console.log(data, '1----')
      return data.json()
    })
    console.log('彩云结果', res)
    return res
  } catch (err) {
    console.log('彩云报错', err)
    return err
  }
}
