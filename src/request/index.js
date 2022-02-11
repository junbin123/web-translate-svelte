import { caiYunToken } from '../config.js'
import { toast } from '@zerodevx/svelte-toast'
export const translateCaiYun = async (params) => {
  const url = 'https://api.interpreter.caiyunai.com/v1/translator'
  const data = {
    source: params.source,
    trans_type: params.transType,
    detect: true,
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'x-authorization': 'token ' + caiYunToken,
      },
      body: JSON.stringify(data),
    }).then((e) => e.json())
    return {
      target: res.target,
    }
  } catch (err) {
    toast.push('response.error_msg', {
      theme: {
        '--toastBackground': '#F56565',
        '--toastBarBackground': '#C53030',
      },
    })
    console.log(err)
  }
}
