
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35730/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function () {
  'use strict';

  console.log('我是content.js');
  // import FormSelect from './components/FormSelect.svelte'

  // const app = new FormSelect({
  //   target: document.body,
  //   props: {
  //     name: "I'm content"
  //   }
  // })
  // console.log(app, 'kkk')

  // export default app
  // .replace(/\s+/g, ' ') 多个空格替换为一个
  // .replace(/[\n\r]/g, '') 清除所有换行
  // 。trim()清除左右空格
  console.log('content.js---------');
  let nodeList = []; // 要翻译的所有元素
  let textList = []; // 要翻译的所有文本列表
  let transIndex = 0; // 翻译到哪个index
  let targetNodeList = []; // 新增的元素
  let transType = 'en2zh'; // 翻译方式
  const transLength = 3000; // 每次翻译的文本长度
  let isLoading = false;
  let currentUrl = `${document.location.origin}${document.location.pathname}`;
  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    console.log('来自popup的数据', request);
    const { action = '' } = request;
    if (action === 'noTrans') {
      removeAllDom();
      sendResponse({ status: 'done' });
      return
    }
    transType = `${request.source}2${request.target}`;
    console.log('点击', request, { transIndex });
    if (currentUrl !== `${document.location.origin}${document.location.pathname}`) {
      // TODO:页面跳转需要清除翻译好的dom，现在是清除不干净
      sendResponse({ canTrans: false, currentUrl });
      transIndex = 0;
      currentUrl = `${document.location.origin}${document.location.pathname}`;
    }
    if (transIndex > 0) {
      sendResponse({ canTrans: false, currentUrl });
      return
    }
    sendResponse({ canTrans: true, currentUrl });
    nodeList = flattenNodes(document.body);
    textList = nodeList.map(item => clearText(item.textContent));

    let number = 0;
    textList.forEach(item => {
      number += item.length;
    });
    console.log('--------number', number);
    console.log('nodeList', nodeList);
    console.log('textList', textList);
    const { targetList, endIndex } = getListByLength({ list: textList, length: transLength });
    console.log('');
    try {
      const { transDomList } = await doTransProcess({ originDomList: nodeList.slice(0, endIndex + 1) });
      targetNodeList = transDomList;
      transIndex = endIndex;
    } catch (err) {
      console.log(err);
    }

    // deepL接口
    // try {
    // const source = encodeURIComponent(targetList.join(separator))
    //   const { target } = await reuqestDeepL({ source })
    //   if (!target) {
    //     targetNodeList.forEach(item => {
    //       removeDom(item)
    //     })
    //   }
    //   console.timeEnd('请求时间:')
    //   console.log('target:', target)
    //   const targetTextList = target?.split(separator)
    //   targetNodeList.forEach((item, index) => {
    //     item.innerText = targetTextList[index]
    //     item.setAttribute('class', '')
    //   })
    // } catch (err) {
    //   console.log('err:', err)
    // }
  });
  // 监听页面滚动
  window.addEventListener('scroll', throttle(windowScroll));

  // 从文本列表获取目标长度字符list(超出不要)
  function getListByLength({ list = [], length = 1000 }) {
    let targetList = []; // 目标列表
    let text = '';
    let endIndex = 0; // 最后一个下标
    for (const [index, item] of list.entries()) {
      text += item;
      endIndex = index;
      if (text.length > length) {
        endIndex = index - 1;
        targetList = list.slice(0, index);
        break
      }
    }
    if (endIndex === list.length - 1) {
      targetList = list;
    }
    return {
      targetList,
      endIndex
    }
  }

  /**
   * 页面滚动事件
   * @param {elemet} e
   */
  async function windowScroll(e) {
    if (transIndex === 0 || transIndex === nodeList.length - 1 || isLoading) {
      return
    }
    const dom = nodeList[transIndex + 1];
    const { relativeWindow = '', isVisible = false } = judgeDomVisible(dom);
    if (['intersectBottom', 'outsideBottom'].includes(relativeWindow)) {
      return
    }
    isLoading = true;
    const nextTextList = textList.slice(transIndex + 1);
    const { targetList, endIndex } = getListByLength({ list: nextTextList, length: transLength });
    try {
      const { transDomList } = await doTransProcess({ originDomList: nodeList.slice(transIndex + 1, transIndex + 2 + endIndex) });
      targetNodeList = [...targetNodeList, ...transDomList];
      transIndex += endIndex + 1;
    } catch (err) {
      console.log(err);
    }
    isLoading = false;

    // 获取未翻译原始node→根据字数截取要翻译node→添加子元素，并添加到targetNodeListTemp→
    // transIndex增加→获取要翻译的字符串→请求接口→替换为获取翻译后的文字→targetNodeList更新

    // const node = nodeList[transIndex + 1]
    // const { relativeWindow = '', isVisible = false } = judgeDomVisible(node)
    // console.log(node, isVisible, relativeWindow)
    // if (isVisible || relativeWindow === 'unknown') {
    // if (true) {

    //   const list = nodeList.slice(transIndex + 1)
    //   const { targetList, endIndex } = getListByLength({ list: textList.slice(transIndex + 1), length: 2000, separator })
    //   const targetNodeListTemp = []
    //   targetList.forEach((item, index) => {
    //     const node = addChildNode(list[index], item)
    //     targetNodeListTemp.push(node)
    //   })
    //   transIndex += endIndex + 1
    //   const source = encodeURIComponent(targetList.join(separator))
    //   const { target } = await reuqestDeepL({ source })
    //   const targetTextList = target?.split(separator)
    //   targetNodeListTemp.forEach((item, index) => {
    //     item.innerText = targetTextList[index]
    //     item.setAttribute('class', '')
    //   })
    //   targetNodeList = [...targetNodeList, ...targetNodeListTemp]
    // }
  }

  /**
   * 添加子节点
   * @param {element} element 父节点
   * @param {string} str 子节点文字
   */
  function addChildNode({ parentDom, childText }) {
    const childNode = document.createElement('div');
    childNode.innerText = childText;
    childNode.setAttribute('class', 'content-class');
    parentDom.appendChild(childNode);
    return childNode
  }

  /**
   * 节流函数
   * @param {function} fn 执行函数
   * @param {number} delay 间隔时间
   */
  function throttle(fn, delay = 500) {
    let timer = null;
    return function () {
      if (timer) {
        return
      }
      timer = setTimeout(() => {
        fn.apply(this, arguments);
        timer = null;
      }, delay);
    }
  }

  // dom扁平化
  function flattenNodes(element) {
    const result = [];
    recursiveNodes(element);
    // 递归dom
    function recursiveNodes(element) {
      const childList = Array.from(element?.children || []).filter(item => item.nodeName !== 'SCRIPT');
      // if (judgeDomIsFliter({ element })) {
      //   // 过滤不需要翻译的dom
      //   return
      // }
      const isFilter = filterDom({ element });
      if (childList.length > 0 && isFilter) {
        // #text和Tag处于同一级，push共同的父级
        const canPush = Array.from(element.childNodes)
          .filter(item => item.textContent.replace(/\s+/g, '') && item.nodeName !== 'SCRIPT')
          .map(item => item.nodeName)
          .some(item => item === '#text');
        if (canPush) {
          result.push(element);
        } else {
          Array.from(element?.children || []).forEach(recursiveNodes);
        }
      } else if (isFilter) {
        result.push(element);
      }
    }
    return result
  }

  /**
   * 请求翻译接口
   * @param {array} source 翻译内容
   * @param {string} transType 目标语言
   */
  async function requestCaiYun({ source = [], transType = 'en2zh' }) {
    const url = 'https://api.interpreter.caiyunai.com/v1/translator';
    const data = {
      source,
      trans_type: transType,
      detect: true
    };
    const params = {
      headers: {
        'content-type': 'application/json',
        'x-authorization': 'token oo00trx4oclspt3nqhfc'
      },
      body: JSON.stringify(data),
      method: 'POST'
    };
    try {
      const res = await fetch(url, params).then(data => {
        return data.json()
      });
      console.log('彩云结果', res);
      return res
    } catch (err) {
      console.log('彩云报错', err);
      return err
    }
  }

  /**
   * 根据url判断该dom是否要翻译
   * @param {element} element dom对象
   * @param {string} url 页面url 一般为window.location.host
   * @return {boolean} true 要的 false 不要的
   */
  function filterDom({ element, url = window.location.host }) {
    const text = element.textContent.replace(/\s+/g, '');
    if (text.length < 4) {
      return false
    }

    const filterTagList = ['SCRIPT', 'CODE', 'NOSCRIPT', 'STYLE']; // 需要过滤的标签
    if (filterTagList.includes(element.nodeName)) {
      return false
    }

    const isChildNoTrans = Array.from(element.childNodes).every(item => filterTagList.includes(item.nodeName)); // 子元素都是不需要翻译的
    if (isChildNoTrans) {
      return false
    }
    return true
  }

  /**
   * 判断dom是否出现在屏幕上（只支持竖向）
   * @param {element} element
   */
  function judgeDomVisible(element) {
    const scrollY = window.scrollY; // 滚动距离
    const clientHeight = document.documentElement.clientHeight; // 设备高度
    const offsetTop = element.offsetTop; // dom距顶部距离
    const offsetHeight = element.offsetHeight; // dom高度
    let relativeWindow = ''; // 相对窗口位置
    if (offsetTop + offsetHeight < scrollY) {
      relativeWindow = 'outsideTop'; // 上面
    } else if (offsetTop < scrollY) {
      relativeWindow = 'intersectTop'; // 上面相交
    } else if (offsetTop + offsetHeight < scrollY + clientHeight) {
      relativeWindow = 'inside'; // 里面
    } else if (offsetTop < scrollY + clientHeight) {
      relativeWindow = 'intersectBottom'; // 下面在相交
    } else {
      relativeWindow = 'outsideBottom'; // 下面
    }
    // 特殊标签无法获取，未知
    if (element.nodeName === 'FIGCAPTION') {
      relativeWindow = 'unknown';
    }

    return {
      relativeWindow,
      isVisible: ['intersectTop', 'inside', 'intersectBottom'].includes(relativeWindow)
    }
  }

  // 删除dom
  function removeDom(ele) {
    const parent = ele.parentElement;
    const res = parent.removeChild(ele);
    return res
  }

  // 执行翻译流程
  async function doTransProcess({ originDomList = [] }) {
    isLoading = true;
    console.log('doTransProcess', originDomList);
    if (originDomList.length === 0) return []
    const originTextList = []; // 没翻译的文本列表
    const transDomList = []; // 翻译好的dom
    originDomList.forEach((item, index) => {
      const text = clearText(item.textContent);
      const dom = addChildNode({ parentDom: item, childText: text });
      originTextList.push(text);
      transDomList.push(dom);
    });
    console.log(1);
    try {
      const { target } = await requestCaiYun({ source: originTextList, transType });
      console.log(2, target);
      if (!target || target.length === 0) {
        transDomList.forEach(item => {
          removeDom(item);
        });
        return { transDomList: [] }
      }
      transDomList.forEach((item, index) => {
        item.innerText = target[index];
        item.setAttribute('class', 'content-class-complete');
      });
    } catch (err) {
      console.log(err);
      transDomList.forEach(item => {
        removeDom(item);
      });
      return { transDomList: [] }
    }
    isLoading = false;
    return { transDomList }
  }

  // 纯函数：清理文本
  function clearText(text) {
    const result = text
      .trim()
      .replace(/[\n\r]/g, '')
      .replace(/\s+/g, ' ');
    return result
  }

  function removeAllDom() {
    targetNodeList.forEach(item => {
      removeDom(item);
    });
    transIndex = 0;
    targetNodeList.length = 0;
  }

}());
