// 全文翻译方法
// const body = document.body
// export { body }
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log('来自popup的数据', request)
})
