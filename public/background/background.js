
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function () {
  'use strict';

  console.log('我是 background.js');
  // 监听活动tab
  chrome.tabs.onActivated.addListener(tab => {
    console.log('tab:', tab);
    // 获取指定Tab信息
    chrome.tabs.get(tab.tabId, currentTab => {
      console.log('currentTab:', currentTab);
      if (/^http/g.test(currentTab.url)) {
        // 执行脚本
        chrome.tabs.executeScript(null, { code: "console.log('1')" }, () => {
          console.log('2');
        });
      }
    });
  });

}());
