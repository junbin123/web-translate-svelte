// 数据统计
export default class StatApi {
  constructor() {
    this.statUrl =
      'https://hello-translator-4fc7tm0e4d3a6da-1253681487.ap-guangzhou.app.tcloudbase.com'
  }
  async request({ url = '', method = 'get', data = {} }) {
    const realUrl = `${this.statUrl}${url}`
    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Credentials': 'true',
        Accept: 'application/json',
        'Access-Control-Allow-Origin': 'http://localhost:5000/'
      },
      body: JSON.stringify(data),
      method: method.toUpperCase()
    }
    const promise = new Promise((resolve, reject) => {
      fetch(realUrl, params)
        .then(res => {
          return res.json()
        })
        .then(res => {
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })
    return promise
  }
  transUrl(data) {
    const url = `${this.statUrl}/translate_url`
    this.request({ url: '/translate_url', method: 'POST', data })
      .then(res => {
        console.log('-------', res)
      })
      .catch(err => {
        console.log('=========', err)
      })
  }
}
