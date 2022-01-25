(function () {
  'use strict';

  /**
   * dom扁平化
   * @param {Object} element document.body 对象
   * @returns {Array} result
   */
  function flattenNodes(element) {
    const result = [];
    recursiveNodes(element);
    // 递归dom
    function recursiveNodes(element) {
      const childList = Array.from(element?.children || []).filter(item => item.nodeName !== 'SCRIPT');
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
   * 过滤不需要翻译的dom
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

    if (window.getComputedStyle(element, null).display === 'none') {
      // 隐藏的元素
      return false
    }

    const isChildNoTrans = Array.from(element.childNodes).every(item =>
      filterTagList.includes(item.nodeName)
    ); // 子元素都是不需要翻译的
    if (isChildNoTrans) {
      return false
    }
    return true
  }

  let nodeList = []; // 要翻译的所有元素
  let textList = []; // 要翻译的所有文本列表
  let transIndex = 0; // 翻译到哪个index
  let targetNodeList = []; // 新增的元素
  let transType = 'en2zh'; // 翻译方式
  const transLength = 3000; // 每次翻译的文本长度
  let isLoading = false;
  /**
   * 全文翻译方法
   * @param {String} params.transType
   */
  const fullTrans = async params => {
    console.log('来自popup的数据', params, 'll');
    transType = params.transType || 'en2zh';
    nodeList = flattenNodes(document.body);
    textList = nodeList.map(item => clearText(item.textContent));
    console.log('nodeList', nodeList[0]);
    console.log('textList', textList);
    const { targetList, endIndex } = getListByLength({ list: textList, length: transLength });
    console.log({ endIndex });
    try {
      const { transDomList } = await doTransProcess({
        originDomList: nodeList.slice(0, endIndex + 1)
      });
      targetNodeList = transDomList;
      transIndex = endIndex;
    } catch (err) {
      console.log(err);
    }
  };

  // 监听页面滚动
  window.addEventListener('scroll', throttle(windowScroll));

  // 从文本列表获取目标长度字符list(超出不要)
  function getListByLength({ list = [], length = 1000 }) {
    console.log({ list, length });
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
      const { transDomList } = await doTransProcess({
        originDomList: nodeList.slice(transIndex + 1, transIndex + 2 + endIndex)
      });
      targetNodeList = [...targetNodeList, ...transDomList];
      transIndex += endIndex + 1;
    } catch (err) {
      console.log(err);
    }
    isLoading = false;
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

  /**
   * 请求翻译接口
   * @param {array} source 翻译内容
   * @param {string} transType 目标语言
   */
  async function requestCaiYun({ source = [], transType = 'en2zh' }) {
    console.log('requestCaiYun--');
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

  console.log("我是content.js2");

  let isTrans = false;
  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    let currentUrl = `${document.location.origin}${document.location.pathname}`;
    if (isTrans) {
      sendResponse({ canTrans: false, currentUrl, msg: "当前页面翻译中" });
      return;
    }
    fullTrans({ ...request });
    isTrans = true;
    sendResponse({ canTrans: true, currentUrl, msg: "开始翻译" });
  });

})();
