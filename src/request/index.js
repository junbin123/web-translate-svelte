import { caiYunToken } from '../config.js'
import { toast } from '@zerodevx/svelte-toast'

const showToast = {
  success: (msg) => {
    toast.push(msg, {
      theme: {
        '--toastBackground': '#F56565',
        '--toastBarBackground': '#C53030',
      },
    })
  },
  error: (msg) => {
    toast.push(msg, {
      theme: {
        '--toastBackground': '#F56565',
        '--toastBarBackground': '#C53030',
      },
    })
  },
}

/**
 * 彩云翻译接口
 * @param {Object} params 原始翻译数据
 * @param {Array<string>} params.source 原始文本
 * @param {string} params.transType 翻译类型
 * @returns {Promise<Object>}
 */
export const translateCaiYun = async (params) => {
  const url = 'https://api.interpreter.caiyunai.com/v1/translator'
  const data = {
    source: params.source,
    trans_type: params.transType,
    detect: true,
  }

  // 模拟请求
  // const promise = new Promise((resolve, reject) => {
  //   setTimeout(() => {
  //     resolve({ target: params.source })
  //   }, Math.ceil(Math.random() * 1000) + 1000)
  // })
  const promise = new Promise((resolve, reject) => {
    fetch(url, {
      method: 'POST',
      headers: {
        'x-authorization': 'token ' + caiYunToken,
      },
      body: JSON.stringify(data),
    })
      .then((e) => e.json())
      .then((res) => {
        if (res.target) {
          resolve({ target: res.target })
        } else {
          showToast.error(res.message)
          reject(res)
        }
      })
      .catch((err) => {
        showToast.error(err.toString())
        reject(err)
      })
  })
  return promise
}


