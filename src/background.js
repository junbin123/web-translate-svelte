import { baiduApi } from './request/translate/baidu'
console.log('我是background.js22')
// 监听活动tab
// chrome.tabs.onActivated.addListener((tab) => {
//   console.log("监听活动的tab:", tab);
//   // 获取指定Tab信息
//   chrome.tabs.get(tab.tabId, (currentTab) => {
//     console.log("currentTab:", currentTab);
//     if (/^http/g.test(currentTab.url)) {
//       // 执行脚本
//       chrome.tabs.executeScript(null, { code: "console.log('1')" }, () => {
//         console.log("2");
//       });
//     }
//   });
// });

// 监听扩展icon的点击
chrome.browserAction.onClicked.addListener(function (tab) {
  console.log('点击扩展按钮', tab)
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    let transType = 'en2zh' // 语言
    let message = { transType }
    chrome.tabs.sendMessage(tabs[0].id, message, (res) => {
      console.log('来自页面的数据', res)
    })
  })
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { source = [], transType = 'auto2zh' } = request
  console.log('来自页面的数据2', { ...request })
  baiduApi({ source, transType })
    .then((res) => {
      console.log('翻译结果：', res)
      sendResponse(res.source ? res : { code: -1, ...res })
    })
    .catch((err) => {
      sendResponse({ ...err, code: -1 })
    })
  return true
})
