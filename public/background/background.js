
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
(function () {
  'use strict';

  console.log("我是 background3.js");
  // 监听活动tab
  chrome.tabs.onActivated.addListener((tab) => {
    console.log("tab:", tab);
    // 获取指定Tab信息
    chrome.tabs.get(tab.tabId, (currentTab) => {
      console.log("currentTab:", currentTab);
      if (/^http/g.test(currentTab.url)) {
        // 执行脚本
        chrome.tabs.executeScript(null, { code: "console.log('1')" }, () => {
          console.log("2");
        });
      }
    });
  });

  console.log(chrome.browserAction, "==3");
  // 监听扩展icon的点击
  chrome.browserAction.onClicked.addListener(function (tab) {
    console.log("点击扩展按钮", tab);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let transType = "en2zh"; // 语言
      let message = { transType };
      chrome.tabs.sendMessage(tabs[0].id, message, (res) => {
        console.log("页面的数据", res);
      });
    });
  });

})();
