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

export const translateCaiYun = async (params) => {
  const url = 'https://api.interpreter.caiyunai.com/v1/translator'
  const data = {
    source: params.source,
    trans_type: params.transType,
    detect: true,
  }
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
        }
        showToast.error(res.message)
        reject(res)
      })
      .catch((err) => {
        showToast.error(err.toString())
        reject(err)
      })
  })
  return promise
}
