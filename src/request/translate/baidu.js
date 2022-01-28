// import request from '../request.js'
import MD5 from "../../utils/md5";
import { paramsStringify } from "../../utils/common";

const secretKey = "Z9MEIDLQYiecSXYJNb3_"; // 应用密钥 TODO:通过链接获取
const appid = "20210328000748924"; // APPID

/**
 * 百度翻译API
 * 文档：https://fanyi-api.baidu.com/product/113
 * @param {Array} source 待翻译文本
 * @param {String} transType 原始语言=>目标语言 auto为自动检测
 */
export const baiduApi = async ({ source = [], transType = "auto2zh" }) => {
  const sourceStr = source.join("\n");
  if (!sourceStr) {
    return;
  }
  const salt = new Date().getTime();
  const signStr = appid + sourceStr + salt + secretKey;
  const sign = MD5(signStr);
  const data = {
    q: encodeURIComponent(sourceStr),
    from: transType.split("2")[0],
    to: transType.split("2")[1],
    appid,
    salt,
    sign,
  };
  const url = `https://fanyi-api.baidu.com/api/trans/vip/translate?${paramsStringify(
    data
  )}`;
  // const { from = "", to = "", trans_result = [] } = await request.get(url);
  const res = await fetch(url).then((data) => {
    return data.json();
  });
  console.log("baidu-----------------", res);
  return {
    // source,
    // target: trans_result.map((item) => item.dst),
    // sourceLang: from,
    // tragetLang: to,
  };
};

// 如何调用?
// import { baiduApi } from './request/translate/baidu'
// const source = ['This Bloomberg report provided a good summary.']
// const transType = 'auto2zh'
// baiduApi({ source, transType })
//   .then(res => {
//     console.log('j---', res)
//   })
//   .catch(err => {
//     console.log('j---', err)
//   })
