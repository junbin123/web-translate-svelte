console.log('我是 background.js')
// 监听活动tab
chrome.tabs.onActivated.addListener(tab => {
  console.log('tab:', tab)
  // 获取指定Tab信息
  chrome.tabs.get(tab.tabId, currentTab => {
    console.log('currentTab:', currentTab)
    if (/^http/g.test(currentTab.url)) {
      // 执行脚本
      chrome.tabs.executeScript(null, { code: "console.log('1')" }, () => {
        console.log('2')
      })
    }
  })
})
