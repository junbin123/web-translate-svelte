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

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
// baiduApi({ source, transType })
//   .then((res) => {
//     sendResponse(res.source ? res : { code: -1, ...res })
//   })
// return true
// })
