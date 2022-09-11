import { caiYunToken, tencentSecret } from '../config.js'
// import tencentcloud from "tencentcloud-sdk-nodejs"
import { showToast } from "../utils/show-toast.js"
import { caiyunLanguageMap } from "../static/data/language-config"



/**
 * 彩云翻译接口
 * @param {Object} params 原始翻译数据
 * @param {Array<string>} params.source 原始文本
 * @param {string} params.transType 翻译类型
 * @returns {Promise<Object>}
 */
export function translateCaiYun(params) {
  const { sourceTextList, source, target } = params
  const transType = `${caiyunLanguageMap[source]}2${caiyunLanguageMap[target]}`
  const url = 'https://api.interpreter.caiyunai.com/v1/translator'
  const data = {
    source: sourceTextList,
    trans_type: transType,
    detect: true,
  }

  // 模拟请求
  // const promise = new Promise((resolve, reject) => {
  //   setTimeout(() => {
  //     resolve({ targetTextList: sourceTextList })
  //   }, 1000)
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
          resolve({ targetTextList: res.target })
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



// export function translateTencent(params) {
//   const TmtClient = tencentcloud.tmt.v20180321.Client

//   // 实例化一个认证对象，入参需要传入腾讯云账户secretId，secretKey,此处还需注意密钥对的保密
//   // 密钥可前往https://console.cloud.tencent.com/cam/capi网站进行获取
//   const clientConfig = {
//     credential: {
//       ...tencentSecret,
//     },
//     region: "ap-beijing",
//     profile: {
//       httpProfile: {
//         endpoint: "tmt.tencentcloudapi.com",
//       },
//     },
//   }

//   // 实例化要请求产品的client对象,clientProfile是可选的
//   const client = new TmtClient(clientConfig)
//   const paramsData = {
//     "SourceText": params.sourceText,
//     "Source": params.source,
//     "Target": params.target,
//     "ProjectId": 0
//   }
//   const promise = new Promise((resolve, reject) => {
//     client.TextTranslate(paramsData).then(
//       (data) => {
//         const { TargetText: targetText } = data
//         resolve({ targetText })
//       },
//       (err) => {
//         reject(err)
//       }
//     )
//   })
//   return promise
// }




