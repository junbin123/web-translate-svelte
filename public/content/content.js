
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var content = (function () {
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
    textList = nodeList.map(item => clearText$1(item.textContent));
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
      const text = clearText$1(item.textContent);
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
  function clearText$1(text) {
    const result = text
      .trim()
      .replace(/[\n\r]/g, '')
      .replace(/\s+/g, ' ');
    return result
  }

  function noop() { }
  const identity = x => x;
  function add_location(element, file, line, column, char) {
      element.__svelte_meta = {
          loc: { file, line, column, char }
      };
  }
  function run(fn) {
      return fn();
  }
  function blank_object() {
      return Object.create(null);
  }
  function run_all(fns) {
      fns.forEach(run);
  }
  function is_function(thing) {
      return typeof thing === 'function';
  }
  function safe_not_equal(a, b) {
      return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
  }
  let src_url_equal_anchor;
  function src_url_equal(element_src, url) {
      if (!src_url_equal_anchor) {
          src_url_equal_anchor = document.createElement('a');
      }
      src_url_equal_anchor.href = url;
      return element_src === src_url_equal_anchor.href;
  }
  function is_empty(obj) {
      return Object.keys(obj).length === 0;
  }
  function action_destroyer(action_result) {
      return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
  }

  const is_client = typeof window !== 'undefined';
  let now = is_client
      ? () => window.performance.now()
      : () => Date.now();
  let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

  const tasks = new Set();
  function run_tasks(now) {
      tasks.forEach(task => {
          if (!task.c(now)) {
              tasks.delete(task);
              task.f();
          }
      });
      if (tasks.size !== 0)
          raf(run_tasks);
  }
  /**
   * Creates a new task that runs on each raf frame
   * until it returns a falsy value or is aborted
   */
  function loop(callback) {
      let task;
      if (tasks.size === 0)
          raf(run_tasks);
      return {
          promise: new Promise(fulfill => {
              tasks.add(task = { c: callback, f: fulfill });
          }),
          abort() {
              tasks.delete(task);
          }
      };
  }
  function append(target, node) {
      target.appendChild(node);
  }
  function get_root_for_style(node) {
      if (!node)
          return document;
      const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
      if (root && root.host) {
          return root;
      }
      return node.ownerDocument;
  }
  function append_empty_stylesheet(node) {
      const style_element = element('style');
      append_stylesheet(get_root_for_style(node), style_element);
      return style_element.sheet;
  }
  function append_stylesheet(node, style) {
      append(node.head || node, style);
  }
  function insert(target, node, anchor) {
      target.insertBefore(node, anchor || null);
  }
  function detach(node) {
      node.parentNode.removeChild(node);
  }
  function destroy_each(iterations, detaching) {
      for (let i = 0; i < iterations.length; i += 1) {
          if (iterations[i])
              iterations[i].d(detaching);
      }
  }
  function element(name) {
      return document.createElement(name);
  }
  function text(data) {
      return document.createTextNode(data);
  }
  function space() {
      return text(' ');
  }
  function listen(node, event, handler, options) {
      node.addEventListener(event, handler, options);
      return () => node.removeEventListener(event, handler, options);
  }
  function stop_propagation(fn) {
      return function (event) {
          event.stopPropagation();
          // @ts-ignore
          return fn.call(this, event);
      };
  }
  function attr(node, attribute, value) {
      if (value == null)
          node.removeAttribute(attribute);
      else if (node.getAttribute(attribute) !== value)
          node.setAttribute(attribute, value);
  }
  function children(element) {
      return Array.from(element.childNodes);
  }
  function set_style(node, key, value, important) {
      if (value === null) {
          node.style.removeProperty(key);
      }
      else {
          node.style.setProperty(key, value, important ? 'important' : '');
      }
  }
  function toggle_class(element, name, toggle) {
      element.classList[toggle ? 'add' : 'remove'](name);
  }
  function custom_event(type, detail, bubbles = false) {
      const e = document.createEvent('CustomEvent');
      e.initCustomEvent(type, bubbles, false, detail);
      return e;
  }
  class HtmlTag {
      constructor() {
          this.e = this.n = null;
      }
      c(html) {
          this.h(html);
      }
      m(html, target, anchor = null) {
          if (!this.e) {
              this.e = element(target.nodeName);
              this.t = target;
              this.c(html);
          }
          this.i(anchor);
      }
      h(html) {
          this.e.innerHTML = html;
          this.n = Array.from(this.e.childNodes);
      }
      i(anchor) {
          for (let i = 0; i < this.n.length; i += 1) {
              insert(this.t, this.n[i], anchor);
          }
      }
      p(html) {
          this.d();
          this.h(html);
          this.i(this.a);
      }
      d() {
          this.n.forEach(detach);
      }
  }

  // we need to store the information for multiple documents because a Svelte application could also contain iframes
  // https://github.com/sveltejs/svelte/issues/3624
  const managed_styles = new Map();
  let active = 0;
  // https://github.com/darkskyapp/string-hash/blob/master/index.js
  function hash(str) {
      let hash = 5381;
      let i = str.length;
      while (i--)
          hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
      return hash >>> 0;
  }
  function create_style_information(doc, node) {
      const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
      managed_styles.set(doc, info);
      return info;
  }
  function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
      const step = 16.666 / duration;
      let keyframes = '{\n';
      for (let p = 0; p <= 1; p += step) {
          const t = a + (b - a) * ease(p);
          keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
      }
      const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
      const name = `__svelte_${hash(rule)}_${uid}`;
      const doc = get_root_for_style(node);
      const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
      if (!rules[name]) {
          rules[name] = true;
          stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
      }
      const animation = node.style.animation || '';
      node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
      active += 1;
      return name;
  }
  function delete_rule(node, name) {
      const previous = (node.style.animation || '').split(', ');
      const next = previous.filter(name
          ? anim => anim.indexOf(name) < 0 // remove specific animation
          : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
      );
      const deleted = previous.length - next.length;
      if (deleted) {
          node.style.animation = next.join(', ');
          active -= deleted;
          if (!active)
              clear_rules();
      }
  }
  function clear_rules() {
      raf(() => {
          if (active)
              return;
          managed_styles.forEach(info => {
              const { stylesheet } = info;
              let i = stylesheet.cssRules.length;
              while (i--)
                  stylesheet.deleteRule(i);
              info.rules = {};
          });
          managed_styles.clear();
      });
  }

  let current_component;
  function set_current_component(component) {
      current_component = component;
  }
  function get_current_component() {
      if (!current_component)
          throw new Error('Function called outside component initialization');
      return current_component;
  }
  function onMount(fn) {
      get_current_component().$$.on_mount.push(fn);
  }
  function afterUpdate(fn) {
      get_current_component().$$.after_update.push(fn);
  }
  function createEventDispatcher() {
      const component = get_current_component();
      return (type, detail) => {
          const callbacks = component.$$.callbacks[type];
          if (callbacks) {
              // TODO are there situations where events could be dispatched
              // in a server (non-DOM) environment?
              const event = custom_event(type, detail);
              callbacks.slice().forEach(fn => {
                  fn.call(component, event);
              });
          }
      };
  }

  const dirty_components = [];
  const binding_callbacks = [];
  const render_callbacks = [];
  const flush_callbacks = [];
  const resolved_promise = Promise.resolve();
  let update_scheduled = false;
  function schedule_update() {
      if (!update_scheduled) {
          update_scheduled = true;
          resolved_promise.then(flush);
      }
  }
  function add_render_callback(fn) {
      render_callbacks.push(fn);
  }
  function add_flush_callback(fn) {
      flush_callbacks.push(fn);
  }
  // flush() calls callbacks in this order:
  // 1. All beforeUpdate callbacks, in order: parents before children
  // 2. All bind:this callbacks, in reverse order: children before parents.
  // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
  //    for afterUpdates called during the initial onMount, which are called in
  //    reverse order: children before parents.
  // Since callbacks might update component values, which could trigger another
  // call to flush(), the following steps guard against this:
  // 1. During beforeUpdate, any updated components will be added to the
  //    dirty_components array and will cause a reentrant call to flush(). Because
  //    the flush index is kept outside the function, the reentrant call will pick
  //    up where the earlier call left off and go through all dirty components. The
  //    current_component value is saved and restored so that the reentrant call will
  //    not interfere with the "parent" flush() call.
  // 2. bind:this callbacks cannot trigger new flush() calls.
  // 3. During afterUpdate, any updated components will NOT have their afterUpdate
  //    callback called a second time; the seen_callbacks set, outside the flush()
  //    function, guarantees this behavior.
  const seen_callbacks = new Set();
  let flushidx = 0; // Do *not* move this inside the flush() function
  function flush() {
      const saved_component = current_component;
      do {
          // first, call beforeUpdate functions
          // and update components
          while (flushidx < dirty_components.length) {
              const component = dirty_components[flushidx];
              flushidx++;
              set_current_component(component);
              update(component.$$);
          }
          set_current_component(null);
          dirty_components.length = 0;
          flushidx = 0;
          while (binding_callbacks.length)
              binding_callbacks.pop()();
          // then, once components are updated, call
          // afterUpdate functions. This may cause
          // subsequent updates...
          for (let i = 0; i < render_callbacks.length; i += 1) {
              const callback = render_callbacks[i];
              if (!seen_callbacks.has(callback)) {
                  // ...so guard against infinite loops
                  seen_callbacks.add(callback);
                  callback();
              }
          }
          render_callbacks.length = 0;
      } while (dirty_components.length);
      while (flush_callbacks.length) {
          flush_callbacks.pop()();
      }
      update_scheduled = false;
      seen_callbacks.clear();
      set_current_component(saved_component);
  }
  function update($$) {
      if ($$.fragment !== null) {
          $$.update();
          run_all($$.before_update);
          const dirty = $$.dirty;
          $$.dirty = [-1];
          $$.fragment && $$.fragment.p($$.ctx, dirty);
          $$.after_update.forEach(add_render_callback);
      }
  }

  let promise;
  function wait() {
      if (!promise) {
          promise = Promise.resolve();
          promise.then(() => {
              promise = null;
          });
      }
      return promise;
  }
  function dispatch(node, direction, kind) {
      node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
  }
  const outroing = new Set();
  let outros;
  function group_outros() {
      outros = {
          r: 0,
          c: [],
          p: outros // parent group
      };
  }
  function check_outros() {
      if (!outros.r) {
          run_all(outros.c);
      }
      outros = outros.p;
  }
  function transition_in(block, local) {
      if (block && block.i) {
          outroing.delete(block);
          block.i(local);
      }
  }
  function transition_out(block, local, detach, callback) {
      if (block && block.o) {
          if (outroing.has(block))
              return;
          outroing.add(block);
          outros.c.push(() => {
              outroing.delete(block);
              if (callback) {
                  if (detach)
                      block.d(1);
                  callback();
              }
          });
          block.o(local);
      }
  }
  const null_transition = { duration: 0 };
  function create_in_transition(node, fn, params) {
      let config = fn(node, params);
      let running = false;
      let animation_name;
      let task;
      let uid = 0;
      function cleanup() {
          if (animation_name)
              delete_rule(node, animation_name);
      }
      function go() {
          const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
          if (css)
              animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
          tick(0, 1);
          const start_time = now() + delay;
          const end_time = start_time + duration;
          if (task)
              task.abort();
          running = true;
          add_render_callback(() => dispatch(node, true, 'start'));
          task = loop(now => {
              if (running) {
                  if (now >= end_time) {
                      tick(1, 0);
                      dispatch(node, true, 'end');
                      cleanup();
                      return running = false;
                  }
                  if (now >= start_time) {
                      const t = easing((now - start_time) / duration);
                      tick(t, 1 - t);
                  }
              }
              return running;
          });
      }
      let started = false;
      return {
          start() {
              if (started)
                  return;
              started = true;
              delete_rule(node);
              if (is_function(config)) {
                  config = config();
                  wait().then(go);
              }
              else {
                  go();
              }
          },
          invalidate() {
              started = false;
          },
          end() {
              if (running) {
                  cleanup();
                  running = false;
              }
          }
      };
  }
  function create_out_transition(node, fn, params) {
      let config = fn(node, params);
      let running = true;
      let animation_name;
      const group = outros;
      group.r += 1;
      function go() {
          const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
          if (css)
              animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
          const start_time = now() + delay;
          const end_time = start_time + duration;
          add_render_callback(() => dispatch(node, false, 'start'));
          loop(now => {
              if (running) {
                  if (now >= end_time) {
                      tick(0, 1);
                      dispatch(node, false, 'end');
                      if (!--group.r) {
                          // this will result in `end()` being called,
                          // so we don't need to clean up here
                          run_all(group.c);
                      }
                      return false;
                  }
                  if (now >= start_time) {
                      const t = easing((now - start_time) / duration);
                      tick(1 - t, t);
                  }
              }
              return running;
          });
      }
      if (is_function(config)) {
          wait().then(() => {
              // @ts-ignore
              config = config();
              go();
          });
      }
      else {
          go();
      }
      return {
          end(reset) {
              if (reset && config.tick) {
                  config.tick(1, 0);
              }
              if (running) {
                  if (animation_name)
                      delete_rule(node, animation_name);
                  running = false;
              }
          }
      };
  }

  const globals = (typeof window !== 'undefined'
      ? window
      : typeof globalThis !== 'undefined'
          ? globalThis
          : global);
  function outro_and_destroy_block(block, lookup) {
      transition_out(block, 1, 1, () => {
          lookup.delete(block.key);
      });
  }
  function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
      let o = old_blocks.length;
      let n = list.length;
      let i = o;
      const old_indexes = {};
      while (i--)
          old_indexes[old_blocks[i].key] = i;
      const new_blocks = [];
      const new_lookup = new Map();
      const deltas = new Map();
      i = n;
      while (i--) {
          const child_ctx = get_context(ctx, list, i);
          const key = get_key(child_ctx);
          let block = lookup.get(key);
          if (!block) {
              block = create_each_block(key, child_ctx);
              block.c();
          }
          else if (dynamic) {
              block.p(child_ctx, dirty);
          }
          new_lookup.set(key, new_blocks[i] = block);
          if (key in old_indexes)
              deltas.set(key, Math.abs(i - old_indexes[key]));
      }
      const will_move = new Set();
      const did_move = new Set();
      function insert(block) {
          transition_in(block, 1);
          block.m(node, next);
          lookup.set(block.key, block);
          next = block.first;
          n--;
      }
      while (o && n) {
          const new_block = new_blocks[n - 1];
          const old_block = old_blocks[o - 1];
          const new_key = new_block.key;
          const old_key = old_block.key;
          if (new_block === old_block) {
              // do nothing
              next = new_block.first;
              o--;
              n--;
          }
          else if (!new_lookup.has(old_key)) {
              // remove old block
              destroy(old_block, lookup);
              o--;
          }
          else if (!lookup.has(new_key) || will_move.has(new_key)) {
              insert(new_block);
          }
          else if (did_move.has(old_key)) {
              o--;
          }
          else if (deltas.get(new_key) > deltas.get(old_key)) {
              did_move.add(new_key);
              insert(new_block);
          }
          else {
              will_move.add(old_key);
              o--;
          }
      }
      while (o--) {
          const old_block = old_blocks[o];
          if (!new_lookup.has(old_block.key))
              destroy(old_block, lookup);
      }
      while (n)
          insert(new_blocks[n - 1]);
      return new_blocks;
  }
  function validate_each_keys(ctx, list, get_context, get_key) {
      const keys = new Set();
      for (let i = 0; i < list.length; i++) {
          const key = get_key(get_context(ctx, list, i));
          if (keys.has(key)) {
              throw new Error('Cannot have duplicate keys in a keyed each');
          }
          keys.add(key);
      }
  }

  function bind$1(component, name, callback) {
      const index = component.$$.props[name];
      if (index !== undefined) {
          component.$$.bound[index] = callback;
          callback(component.$$.ctx[index]);
      }
  }
  function create_component(block) {
      block && block.c();
  }
  function mount_component(component, target, anchor, customElement) {
      const { fragment, on_mount, on_destroy, after_update } = component.$$;
      fragment && fragment.m(target, anchor);
      if (!customElement) {
          // onMount happens before the initial afterUpdate
          add_render_callback(() => {
              const new_on_destroy = on_mount.map(run).filter(is_function);
              if (on_destroy) {
                  on_destroy.push(...new_on_destroy);
              }
              else {
                  // Edge case - component was destroyed immediately,
                  // most likely as a result of a binding initialising
                  run_all(new_on_destroy);
              }
              component.$$.on_mount = [];
          });
      }
      after_update.forEach(add_render_callback);
  }
  function destroy_component(component, detaching) {
      const $$ = component.$$;
      if ($$.fragment !== null) {
          run_all($$.on_destroy);
          $$.fragment && $$.fragment.d(detaching);
          // TODO null out other refs, including component.$$ (but need to
          // preserve final state?)
          $$.on_destroy = $$.fragment = null;
          $$.ctx = [];
      }
  }
  function make_dirty(component, i) {
      if (component.$$.dirty[0] === -1) {
          dirty_components.push(component);
          schedule_update();
          component.$$.dirty.fill(0);
      }
      component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
  }
  function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
      const parent_component = current_component;
      set_current_component(component);
      const $$ = component.$$ = {
          fragment: null,
          ctx: null,
          // state
          props,
          update: noop,
          not_equal,
          bound: blank_object(),
          // lifecycle
          on_mount: [],
          on_destroy: [],
          on_disconnect: [],
          before_update: [],
          after_update: [],
          context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
          // everything else
          callbacks: blank_object(),
          dirty,
          skip_bound: false,
          root: options.target || parent_component.$$.root
      };
      append_styles && append_styles($$.root);
      let ready = false;
      $$.ctx = instance
          ? instance(component, options.props || {}, (i, ret, ...rest) => {
              const value = rest.length ? rest[0] : ret;
              if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                  if (!$$.skip_bound && $$.bound[i])
                      $$.bound[i](value);
                  if (ready)
                      make_dirty(component, i);
              }
              return ret;
          })
          : [];
      $$.update();
      ready = true;
      run_all($$.before_update);
      // `false` as a special case of no DOM component
      $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
      if (options.target) {
          if (options.hydrate) {
              const nodes = children(options.target);
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              $$.fragment && $$.fragment.l(nodes);
              nodes.forEach(detach);
          }
          else {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              $$.fragment && $$.fragment.c();
          }
          if (options.intro)
              transition_in(component.$$.fragment);
          mount_component(component, options.target, options.anchor, options.customElement);
          flush();
      }
      set_current_component(parent_component);
  }
  /**
   * Base class for Svelte components. Used when dev=false.
   */
  class SvelteComponent {
      $destroy() {
          destroy_component(this, 1);
          this.$destroy = noop;
      }
      $on(type, callback) {
          const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
          callbacks.push(callback);
          return () => {
              const index = callbacks.indexOf(callback);
              if (index !== -1)
                  callbacks.splice(index, 1);
          };
      }
      $set($$props) {
          if (this.$$set && !is_empty($$props)) {
              this.$$.skip_bound = true;
              this.$$set($$props);
              this.$$.skip_bound = false;
          }
      }
  }

  function dispatch_dev(type, detail) {
      document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.2' }, detail), true));
  }
  function append_dev(target, node) {
      dispatch_dev('SvelteDOMInsert', { target, node });
      append(target, node);
  }
  function insert_dev(target, node, anchor) {
      dispatch_dev('SvelteDOMInsert', { target, node, anchor });
      insert(target, node, anchor);
  }
  function detach_dev(node) {
      dispatch_dev('SvelteDOMRemove', { node });
      detach(node);
  }
  function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
      const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
      if (has_prevent_default)
          modifiers.push('preventDefault');
      if (has_stop_propagation)
          modifiers.push('stopPropagation');
      dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
      const dispose = listen(node, event, handler, options);
      return () => {
          dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
          dispose();
      };
  }
  function attr_dev(node, attribute, value) {
      attr(node, attribute, value);
      if (value == null)
          dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
      else
          dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
  }
  function prop_dev(node, property, value) {
      node[property] = value;
      dispatch_dev('SvelteDOMSetProperty', { node, property, value });
  }
  function set_data_dev(text, data) {
      data = '' + data;
      if (text.wholeText === data)
          return;
      dispatch_dev('SvelteDOMSetData', { node: text, data });
      text.data = data;
  }
  function validate_each_argument(arg) {
      if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
          let msg = '{#each} only iterates over array-like objects.';
          if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
              msg += ' You can use a spread to convert this iterable into an array.';
          }
          throw new Error(msg);
      }
  }
  function validate_slots(name, slot, keys) {
      for (const slot_key of Object.keys(slot)) {
          if (!~keys.indexOf(slot_key)) {
              console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
          }
      }
  }
  /**
   * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
   */
  class SvelteComponentDev extends SvelteComponent {
      constructor(options) {
          if (!options || (!options.target && !options.$$inline)) {
              throw new Error("'target' is a required option");
          }
          super();
      }
      $destroy() {
          super.$destroy();
          this.$destroy = () => {
              console.warn('Component was already destroyed'); // eslint-disable-line no-console
          };
      }
      $capture_state() { }
      $inject_state() { }
  }

  function resize({ target }) {
    target.style.height = '1px';
    target.style.height = +target.scrollHeight + 'px';
    console.log('textarea高度', target.style.height);
  }

  function text_area_resize(el) {
    resize({ target: el });
    el.style.overflow = 'hidden';
    el.addEventListener('input', resize);
    return {
      destroy: () => el.removeEventListener('input', resize)
    }
  }

  /**
   * 文本清洗（清除左右空格，所有换行，多余空格）
   * @param {String} str
   * @returns {String}
   */
  const clearText = str => {
    const result = str
      .trim()
      .replace(/[\r\n]/g, '')
      .replace(/\s+/g, ' ');
    return result
  };

  /**
   * 对象参数转字符串
   * @param {*} params 路由参数
   */
  const queryStringify = (params = {}) => {
    return Object.keys(params).reduce((p, c, i) => p + `${i === 0 ? '' : ';'}${c}:${params[c]}`, '')
  };

  /**
   * 节流函数
   */

  /**
   * 防抖函数
   * @param {function} fn 执行函数
   * @param {number} delay 间隔时间
   */
  const debounce = (fn, delay = 500) => {
    let timer = null;
    return function () {
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        fn.apply(this, arguments);
        timer = null;
      }, delay);
    }
  };

  /**
   * 获取本地图片绝对路径
   */
  const getImgUrl = url => {
    return chrome?.extension?.getURL(url) ?? url
  };

  // 翻译服务字典
  const transServiceDict = {
    google: {
      name: '谷歌翻译',
      src: getImgUrl('./images/logo/google-logo.png'),
      url: 'https://translate.google.cn/',
      getTransUrl: ({ source = '', transType = 'en2zh-CN' }) => {
        const sl = transType.split('2')[0];
        const tl = transType.split('2')[1];
        return `https://translate.google.cn/?sl=${sl}&tl=${tl}&text=${source}&op=translate`
      }
    },
    youdao: {
      name: '有道翻译',
      src: getImgUrl('./images/logo/youdao-logo.png'),
      url: 'http://fanyi.youdao.com/',
      getTransUrl: () => 'http://fanyi.youdao.com/'
    },
    baidu: {
      name: '百度翻译',
      src: getImgUrl('./images/logo/baidu-logo.png'),
      url: 'https://fanyi.baidu.com/',
      getTransUrl: ({ source = '', transType = 'en2zh' }) => {
        const sl = transType.split('2')[0];
        const tl = transType.split('2')[1];
        return `https://fanyi.baidu.com/#${sl}/${tl}/${source}`
      }
    },
    caiyun: {
      name: '彩云小译',
      src: getImgUrl('./images/logo/caiyun-logo.png'),
      url: 'https://fanyi.caiyunapp.com/#/',
      getTransUrl: () => 'https://fanyi.caiyunapp.com/#/'
    },
    deepl: {
      name: 'DeepL 翻译',
      src: getImgUrl('./images/logo/deepl-logo.png'),
      url: 'https://www.deepl.com/translator',
      getTransUrl: ({ source = '', transType = 'en2zh' }) => {
        const sl = transType.split('2')[0];
        const tl = transType.split('2')[1];
        return `https://www.deepl.com/translator#${sl}/${tl}/${source}`
      }
    }
  };

  function backOut(t) {
      const s = 1.70158;
      return --t * t * ((s + 1) * t + s) + 1;
  }
  function cubicOut(t) {
      const f = t - 1.0;
      return f * f * f + 1.0;
  }

  function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
      const o = +getComputedStyle(node).opacity;
      return {
          delay,
          duration,
          easing,
          css: t => `opacity: ${t * o}`
      };
  }
  function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
      const style = getComputedStyle(node);
      const target_opacity = +style.opacity;
      const transform = style.transform === 'none' ? '' : style.transform;
      const od = target_opacity * (1 - opacity);
      return {
          delay,
          duration,
          easing,
          css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
      };
  }

  /* src/components/Basics/Toast.svelte generated by Svelte v3.46.2 */
  const file$4 = "src/components/Basics/Toast.svelte";

  function get_each_context$1(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[5] = list[i];
  	return child_ctx;
  }

  // (35:2) {#each toasts as toast (toast._id)}
  function create_each_block$1(key_1, ctx) {
  	let div;
  	let t0_value = /*toast*/ ctx[5].msg + "";
  	let t0;
  	let t1;
  	let div_intro;
  	let div_outro;
  	let current;

  	const block = {
  		key: key_1,
  		first: null,
  		c: function create() {
  			div = element("div");
  			t0 = text(t0_value);
  			t1 = space();
  			attr_dev(div, "class", "toast-item svelte-ec56ci");
  			add_location(div, file$4, 35, 4, 721);
  			this.first = div;
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);
  			append_dev(div, t0);
  			append_dev(div, t1);
  			current = true;
  		},
  		p: function update(new_ctx, dirty) {
  			ctx = new_ctx;
  			if ((!current || dirty & /*toasts*/ 1) && t0_value !== (t0_value = /*toast*/ ctx[5].msg + "")) set_data_dev(t0, t0_value);
  		},
  		i: function intro(local) {
  			if (current) return;

  			add_render_callback(() => {
  				if (div_outro) div_outro.end(1);

  				div_intro = create_in_transition(div, fly, {
  					delay: 0,
  					duration: 300,
  					x: 0,
  					y: 50,
  					opacity: 0.1,
  					easing: backOut
  				});

  				div_intro.start();
  			});

  			current = true;
  		},
  		o: function outro(local) {
  			if (div_intro) div_intro.invalidate();
  			div_outro = create_out_transition(div, fade, { duration: 300, opacity: 0 });
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			if (detaching && div_outro) div_outro.end();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_each_block$1.name,
  		type: "each",
  		source: "(35:2) {#each toasts as toast (toast._id)}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$4(ctx) {
  	let div;
  	let each_blocks = [];
  	let each_1_lookup = new Map();
  	let current;
  	let each_value = /*toasts*/ ctx[0];
  	validate_each_argument(each_value);
  	const get_key = ctx => /*toast*/ ctx[5]._id;
  	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

  	for (let i = 0; i < each_value.length; i += 1) {
  		let child_ctx = get_each_context$1(ctx, each_value, i);
  		let key = get_key(child_ctx);
  		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
  	}

  	const block = {
  		c: function create() {
  			div = element("div");

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			attr_dev(div, "class", "toast-wrapper svelte-ec56ci");
  			add_location(div, file$4, 33, 0, 651);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(div, null);
  			}

  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
  			if (dirty & /*toasts*/ 1) {
  				each_value = /*toasts*/ ctx[0];
  				validate_each_argument(each_value);
  				group_outros();
  				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
  				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
  				check_outros();
  			}
  		},
  		i: function intro(local) {
  			if (current) return;

  			for (let i = 0; i < each_value.length; i += 1) {
  				transition_in(each_blocks[i]);
  			}

  			current = true;
  		},
  		o: function outro(local) {
  			for (let i = 0; i < each_blocks.length; i += 1) {
  				transition_out(each_blocks[i]);
  			}

  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].d();
  			}
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$4.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$4($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('Toast', slots, []);
  	let toasts = []; // 알람이 연속적으로 발생할 수 있으니 배열로 생성
  	let retainMs = 2000; // 생성되고 사라질 시간

  	// 알람을 추가한다, 변수로 단순하게 메시지 한 줄 받음
  	let toastId = 0;

  	const pushToast = (msg = '') => {
  		$$invalidate(0, toasts = [...toasts, { _id: ++toastId, msg }]); // 새로운 할당

  		setTimeout(
  			() => {
  				unshiftToast();
  			},
  			retainMs
  		);
  	};

  	// 오래된 알람 하나 삭제
  	const unshiftToast = () => {
  		$$invalidate(0, toasts = toasts.filter((a, i) => i > 0)); // 새로운 할당
  	};

  	onMount(() => {
  		window.showToast = pushToast;
  	});

  	const writable_props = [];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Toast> was created with unknown prop '${key}'`);
  	});

  	$$self.$capture_state = () => ({
  		onMount,
  		fade,
  		fly,
  		backOut,
  		toasts,
  		retainMs,
  		toastId,
  		pushToast,
  		unshiftToast
  	});

  	$$self.$inject_state = $$props => {
  		if ('toasts' in $$props) $$invalidate(0, toasts = $$props.toasts);
  		if ('retainMs' in $$props) retainMs = $$props.retainMs;
  		if ('toastId' in $$props) toastId = $$props.toastId;
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	return [toasts];
  }

  class Toast extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "Toast",
  			options,
  			id: create_fragment$4.name
  		});
  	}
  }

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function getDefaultExportFromCjs (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  function createCommonjsModule(fn) {
    var module = { exports: {} };
  	return fn(module, module.exports), module.exports;
  }

  /*!
   * clipboard.js v2.0.8
   * https://clipboardjs.com/
   *
   * Licensed MIT © Zeno Rocha
   */

  var clipboard = createCommonjsModule(function (module, exports) {
  !function(t,e){module.exports=e();}(commonjsGlobal,function(){return n={134:function(t,e,n){n.d(e,{default:function(){return r}});var e=n(279),i=n.n(e),e=n(370),a=n.n(e),e=n(817),o=n.n(e);function c(t){return (c="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}function u(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r);}}var l=function(){function e(t){!function(t){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this),this.resolveOptions(t),this.initSelection();}var t,n;return t=e,(n=[{key:"resolveOptions",value:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{};this.action=t.action,this.container=t.container,this.emitter=t.emitter,this.target=t.target,this.text=t.text,this.trigger=t.trigger,this.selectedText="";}},{key:"initSelection",value:function(){this.text?this.selectFake():this.target&&this.selectTarget();}},{key:"createFakeElement",value:function(){var t="rtl"===document.documentElement.getAttribute("dir");this.fakeElem=document.createElement("textarea"),this.fakeElem.style.fontSize="12pt",this.fakeElem.style.border="0",this.fakeElem.style.padding="0",this.fakeElem.style.margin="0",this.fakeElem.style.position="absolute",this.fakeElem.style[t?"right":"left"]="-9999px";t=window.pageYOffset||document.documentElement.scrollTop;return this.fakeElem.style.top="".concat(t,"px"),this.fakeElem.setAttribute("readonly",""),this.fakeElem.value=this.text,this.fakeElem}},{key:"selectFake",value:function(){var t=this,e=this.createFakeElement();this.fakeHandlerCallback=function(){return t.removeFake()},this.fakeHandler=this.container.addEventListener("click",this.fakeHandlerCallback)||!0,this.container.appendChild(e),this.selectedText=o()(e),this.copyText(),this.removeFake();}},{key:"removeFake",value:function(){this.fakeHandler&&(this.container.removeEventListener("click",this.fakeHandlerCallback),this.fakeHandler=null,this.fakeHandlerCallback=null),this.fakeElem&&(this.container.removeChild(this.fakeElem),this.fakeElem=null);}},{key:"selectTarget",value:function(){this.selectedText=o()(this.target),this.copyText();}},{key:"copyText",value:function(){var e;try{e=document.execCommand(this.action);}catch(t){e=!1;}this.handleResult(e);}},{key:"handleResult",value:function(t){this.emitter.emit(t?"success":"error",{action:this.action,text:this.selectedText,trigger:this.trigger,clearSelection:this.clearSelection.bind(this)});}},{key:"clearSelection",value:function(){this.trigger&&this.trigger.focus(),document.activeElement.blur(),window.getSelection().removeAllRanges();}},{key:"destroy",value:function(){this.removeFake();}},{key:"action",set:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"copy";if(this._action=t,"copy"!==this._action&&"cut"!==this._action)throw new Error('Invalid "action" value, use either "copy" or "cut"')},get:function(){return this._action}},{key:"target",set:function(t){if(void 0!==t){if(!t||"object"!==c(t)||1!==t.nodeType)throw new Error('Invalid "target" value, use a valid Element');if("copy"===this.action&&t.hasAttribute("disabled"))throw new Error('Invalid "target" attribute. Please use "readonly" instead of "disabled" attribute');if("cut"===this.action&&(t.hasAttribute("readonly")||t.hasAttribute("disabled")))throw new Error('Invalid "target" attribute. You can\'t cut text from elements with "readonly" or "disabled" attributes');this._target=t;}},get:function(){return this._target}}])&&u(t.prototype,n),e}();function s(t){return (s="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}function f(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r);}}function h(t,e){return (h=Object.setPrototypeOf||function(t,e){return t.__proto__=e,t})(t,e)}function d(n){var r=function(){if("undefined"==typeof Reflect||!Reflect.construct)return !1;if(Reflect.construct.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],function(){})),!0}catch(t){return !1}}();return function(){var t,e=p(n);return t=r?(t=p(this).constructor,Reflect.construct(e,arguments,t)):e.apply(this,arguments),e=this,!(t=t)||"object"!==s(t)&&"function"!=typeof t?function(t){if(void 0!==t)return t;throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}(e):t}}function p(t){return (p=Object.setPrototypeOf?Object.getPrototypeOf:function(t){return t.__proto__||Object.getPrototypeOf(t)})(t)}function y(t,e){t="data-clipboard-".concat(t);if(e.hasAttribute(t))return e.getAttribute(t)}var r=function(){!function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),e&&h(t,e);}(o,i());var t,e,n,r=d(o);function o(t,e){var n;return function(t){if(!(t instanceof o))throw new TypeError("Cannot call a class as a function")}(this),(n=r.call(this)).resolveOptions(e),n.listenClick(t),n}return t=o,n=[{key:"isSupported",value:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:["copy","cut"],t="string"==typeof t?[t]:t,e=!!document.queryCommandSupported;return t.forEach(function(t){e=e&&!!document.queryCommandSupported(t);}),e}}],(e=[{key:"resolveOptions",value:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{};this.action="function"==typeof t.action?t.action:this.defaultAction,this.target="function"==typeof t.target?t.target:this.defaultTarget,this.text="function"==typeof t.text?t.text:this.defaultText,this.container="object"===s(t.container)?t.container:document.body;}},{key:"listenClick",value:function(t){var e=this;this.listener=a()(t,"click",function(t){return e.onClick(t)});}},{key:"onClick",value:function(t){t=t.delegateTarget||t.currentTarget;this.clipboardAction&&(this.clipboardAction=null),this.clipboardAction=new l({action:this.action(t),target:this.target(t),text:this.text(t),container:this.container,trigger:t,emitter:this});}},{key:"defaultAction",value:function(t){return y("action",t)}},{key:"defaultTarget",value:function(t){t=y("target",t);if(t)return document.querySelector(t)}},{key:"defaultText",value:function(t){return y("text",t)}},{key:"destroy",value:function(){this.listener.destroy(),this.clipboardAction&&(this.clipboardAction.destroy(),this.clipboardAction=null);}}])&&f(t.prototype,e),n&&f(t,n),o}();},828:function(t){var e;"undefined"==typeof Element||Element.prototype.matches||((e=Element.prototype).matches=e.matchesSelector||e.mozMatchesSelector||e.msMatchesSelector||e.oMatchesSelector||e.webkitMatchesSelector),t.exports=function(t,e){for(;t&&9!==t.nodeType;){if("function"==typeof t.matches&&t.matches(e))return t;t=t.parentNode;}};},438:function(t,e,n){var a=n(828);function i(t,e,n,r,o){var i=function(e,n,t,r){return function(t){t.delegateTarget=a(t.target,n),t.delegateTarget&&r.call(e,t);}}.apply(this,arguments);return t.addEventListener(n,i,o),{destroy:function(){t.removeEventListener(n,i,o);}}}t.exports=function(t,e,n,r,o){return "function"==typeof t.addEventListener?i.apply(null,arguments):"function"==typeof n?i.bind(null,document).apply(null,arguments):("string"==typeof t&&(t=document.querySelectorAll(t)),Array.prototype.map.call(t,function(t){return i(t,e,n,r,o)}))};},879:function(t,n){n.node=function(t){return void 0!==t&&t instanceof HTMLElement&&1===t.nodeType},n.nodeList=function(t){var e=Object.prototype.toString.call(t);return void 0!==t&&("[object NodeList]"===e||"[object HTMLCollection]"===e)&&"length"in t&&(0===t.length||n.node(t[0]))},n.string=function(t){return "string"==typeof t||t instanceof String},n.fn=function(t){return "[object Function]"===Object.prototype.toString.call(t)};},370:function(t,e,n){var l=n(879),s=n(438);t.exports=function(t,e,n){if(!t&&!e&&!n)throw new Error("Missing required arguments");if(!l.string(e))throw new TypeError("Second argument must be a String");if(!l.fn(n))throw new TypeError("Third argument must be a Function");if(l.node(t))return c=e,u=n,(a=t).addEventListener(c,u),{destroy:function(){a.removeEventListener(c,u);}};if(l.nodeList(t))return r=t,o=e,i=n,Array.prototype.forEach.call(r,function(t){t.addEventListener(o,i);}),{destroy:function(){Array.prototype.forEach.call(r,function(t){t.removeEventListener(o,i);});}};if(l.string(t))return t=t,e=e,n=n,s(document.body,t,e,n);throw new TypeError("First argument must be a String, HTMLElement, HTMLCollection, or NodeList");var r,o,i,a,c,u;};},817:function(t){t.exports=function(t){var e,n="SELECT"===t.nodeName?(t.focus(),t.value):"INPUT"===t.nodeName||"TEXTAREA"===t.nodeName?((e=t.hasAttribute("readonly"))||t.setAttribute("readonly",""),t.select(),t.setSelectionRange(0,t.value.length),e||t.removeAttribute("readonly"),t.value):(t.hasAttribute("contenteditable")&&t.focus(),n=window.getSelection(),(e=document.createRange()).selectNodeContents(t),n.removeAllRanges(),n.addRange(e),n.toString());return n};},279:function(t){function e(){}e.prototype={on:function(t,e,n){var r=this.e||(this.e={});return (r[t]||(r[t]=[])).push({fn:e,ctx:n}),this},once:function(t,e,n){var r=this;function o(){r.off(t,o),e.apply(n,arguments);}return o._=e,this.on(t,o,n)},emit:function(t){for(var e=[].slice.call(arguments,1),n=((this.e||(this.e={}))[t]||[]).slice(),r=0,o=n.length;r<o;r++)n[r].fn.apply(n[r].ctx,e);return this},off:function(t,e){var n=this.e||(this.e={}),r=n[t],o=[];if(r&&e)for(var i=0,a=r.length;i<a;i++)r[i].fn!==e&&r[i].fn._!==e&&o.push(r[i]);return o.length?n[t]=o:delete n[t],this}},t.exports=e,t.exports.TinyEmitter=e;}},o={},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,{a:e}),e},r.d=function(t,e){for(var n in e)r.o(e,n)&&!r.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:e[n]});},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r(134).default;function r(t){if(o[t])return o[t].exports;var e=o[t]={exports:{}};return n[t](e,e.exports,r),e.exports}var n,o;});
  });

  var ClipboardJS = /*@__PURE__*/getDefaultExportFromCjs(clipboard);

  var bind = function bind(fn, thisArg) {
    return function wrap() {
      var args = new Array(arguments.length);
      for (var i = 0; i < args.length; i++) {
        args[i] = arguments[i];
      }
      return fn.apply(thisArg, args);
    };
  };

  // utils is a library of generic helper functions non-specific to axios

  var toString = Object.prototype.toString;

  /**
   * Determine if a value is an Array
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is an Array, otherwise false
   */
  function isArray(val) {
    return toString.call(val) === '[object Array]';
  }

  /**
   * Determine if a value is undefined
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if the value is undefined, otherwise false
   */
  function isUndefined(val) {
    return typeof val === 'undefined';
  }

  /**
   * Determine if a value is a Buffer
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Buffer, otherwise false
   */
  function isBuffer(val) {
    return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
      && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
  }

  /**
   * Determine if a value is an ArrayBuffer
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is an ArrayBuffer, otherwise false
   */
  function isArrayBuffer(val) {
    return toString.call(val) === '[object ArrayBuffer]';
  }

  /**
   * Determine if a value is a FormData
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is an FormData, otherwise false
   */
  function isFormData(val) {
    return (typeof FormData !== 'undefined') && (val instanceof FormData);
  }

  /**
   * Determine if a value is a view on an ArrayBuffer
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
   */
  function isArrayBufferView(val) {
    var result;
    if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
      result = ArrayBuffer.isView(val);
    } else {
      result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
    }
    return result;
  }

  /**
   * Determine if a value is a String
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a String, otherwise false
   */
  function isString(val) {
    return typeof val === 'string';
  }

  /**
   * Determine if a value is a Number
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Number, otherwise false
   */
  function isNumber(val) {
    return typeof val === 'number';
  }

  /**
   * Determine if a value is an Object
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is an Object, otherwise false
   */
  function isObject(val) {
    return val !== null && typeof val === 'object';
  }

  /**
   * Determine if a value is a plain Object
   *
   * @param {Object} val The value to test
   * @return {boolean} True if value is a plain Object, otherwise false
   */
  function isPlainObject(val) {
    if (toString.call(val) !== '[object Object]') {
      return false;
    }

    var prototype = Object.getPrototypeOf(val);
    return prototype === null || prototype === Object.prototype;
  }

  /**
   * Determine if a value is a Date
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Date, otherwise false
   */
  function isDate(val) {
    return toString.call(val) === '[object Date]';
  }

  /**
   * Determine if a value is a File
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a File, otherwise false
   */
  function isFile(val) {
    return toString.call(val) === '[object File]';
  }

  /**
   * Determine if a value is a Blob
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Blob, otherwise false
   */
  function isBlob(val) {
    return toString.call(val) === '[object Blob]';
  }

  /**
   * Determine if a value is a Function
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Function, otherwise false
   */
  function isFunction(val) {
    return toString.call(val) === '[object Function]';
  }

  /**
   * Determine if a value is a Stream
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a Stream, otherwise false
   */
  function isStream(val) {
    return isObject(val) && isFunction(val.pipe);
  }

  /**
   * Determine if a value is a URLSearchParams object
   *
   * @param {Object} val The value to test
   * @returns {boolean} True if value is a URLSearchParams object, otherwise false
   */
  function isURLSearchParams(val) {
    return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
  }

  /**
   * Trim excess whitespace off the beginning and end of a string
   *
   * @param {String} str The String to trim
   * @returns {String} The String freed of excess whitespace
   */
  function trim(str) {
    return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
  }

  /**
   * Determine if we're running in a standard browser environment
   *
   * This allows axios to run in a web worker, and react-native.
   * Both environments support XMLHttpRequest, but not fully standard globals.
   *
   * web workers:
   *  typeof window -> undefined
   *  typeof document -> undefined
   *
   * react-native:
   *  navigator.product -> 'ReactNative'
   * nativescript
   *  navigator.product -> 'NativeScript' or 'NS'
   */
  function isStandardBrowserEnv() {
    if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                             navigator.product === 'NativeScript' ||
                                             navigator.product === 'NS')) {
      return false;
    }
    return (
      typeof window !== 'undefined' &&
      typeof document !== 'undefined'
    );
  }

  /**
   * Iterate over an Array or an Object invoking a function for each item.
   *
   * If `obj` is an Array callback will be called passing
   * the value, index, and complete array for each item.
   *
   * If 'obj' is an Object callback will be called passing
   * the value, key, and complete object for each property.
   *
   * @param {Object|Array} obj The object to iterate
   * @param {Function} fn The callback to invoke for each item
   */
  function forEach(obj, fn) {
    // Don't bother if no value provided
    if (obj === null || typeof obj === 'undefined') {
      return;
    }

    // Force an array if not already something iterable
    if (typeof obj !== 'object') {
      /*eslint no-param-reassign:0*/
      obj = [obj];
    }

    if (isArray(obj)) {
      // Iterate over array values
      for (var i = 0, l = obj.length; i < l; i++) {
        fn.call(null, obj[i], i, obj);
      }
    } else {
      // Iterate over object keys
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          fn.call(null, obj[key], key, obj);
        }
      }
    }
  }

  /**
   * Accepts varargs expecting each argument to be an object, then
   * immutably merges the properties of each object and returns result.
   *
   * When multiple objects contain the same key the later object in
   * the arguments list will take precedence.
   *
   * Example:
   *
   * ```js
   * var result = merge({foo: 123}, {foo: 456});
   * console.log(result.foo); // outputs 456
   * ```
   *
   * @param {Object} obj1 Object to merge
   * @returns {Object} Result of all merge properties
   */
  function merge(/* obj1, obj2, obj3, ... */) {
    var result = {};
    function assignValue(val, key) {
      if (isPlainObject(result[key]) && isPlainObject(val)) {
        result[key] = merge(result[key], val);
      } else if (isPlainObject(val)) {
        result[key] = merge({}, val);
      } else if (isArray(val)) {
        result[key] = val.slice();
      } else {
        result[key] = val;
      }
    }

    for (var i = 0, l = arguments.length; i < l; i++) {
      forEach(arguments[i], assignValue);
    }
    return result;
  }

  /**
   * Extends object a by mutably adding to it the properties of object b.
   *
   * @param {Object} a The object to be extended
   * @param {Object} b The object to copy properties from
   * @param {Object} thisArg The object to bind function to
   * @return {Object} The resulting value of object a
   */
  function extend(a, b, thisArg) {
    forEach(b, function assignValue(val, key) {
      if (thisArg && typeof val === 'function') {
        a[key] = bind(val, thisArg);
      } else {
        a[key] = val;
      }
    });
    return a;
  }

  /**
   * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
   *
   * @param {string} content with BOM
   * @return {string} content value without BOM
   */
  function stripBOM(content) {
    if (content.charCodeAt(0) === 0xFEFF) {
      content = content.slice(1);
    }
    return content;
  }

  var utils = {
    isArray: isArray,
    isArrayBuffer: isArrayBuffer,
    isBuffer: isBuffer,
    isFormData: isFormData,
    isArrayBufferView: isArrayBufferView,
    isString: isString,
    isNumber: isNumber,
    isObject: isObject,
    isPlainObject: isPlainObject,
    isUndefined: isUndefined,
    isDate: isDate,
    isFile: isFile,
    isBlob: isBlob,
    isFunction: isFunction,
    isStream: isStream,
    isURLSearchParams: isURLSearchParams,
    isStandardBrowserEnv: isStandardBrowserEnv,
    forEach: forEach,
    merge: merge,
    extend: extend,
    trim: trim,
    stripBOM: stripBOM
  };

  function encode(val) {
    return encodeURIComponent(val).
      replace(/%3A/gi, ':').
      replace(/%24/g, '$').
      replace(/%2C/gi, ',').
      replace(/%20/g, '+').
      replace(/%5B/gi, '[').
      replace(/%5D/gi, ']');
  }

  /**
   * Build a URL by appending params to the end
   *
   * @param {string} url The base of the url (e.g., http://www.google.com)
   * @param {object} [params] The params to be appended
   * @returns {string} The formatted url
   */
  var buildURL = function buildURL(url, params, paramsSerializer) {
    /*eslint no-param-reassign:0*/
    if (!params) {
      return url;
    }

    var serializedParams;
    if (paramsSerializer) {
      serializedParams = paramsSerializer(params);
    } else if (utils.isURLSearchParams(params)) {
      serializedParams = params.toString();
    } else {
      var parts = [];

      utils.forEach(params, function serialize(val, key) {
        if (val === null || typeof val === 'undefined') {
          return;
        }

        if (utils.isArray(val)) {
          key = key + '[]';
        } else {
          val = [val];
        }

        utils.forEach(val, function parseValue(v) {
          if (utils.isDate(v)) {
            v = v.toISOString();
          } else if (utils.isObject(v)) {
            v = JSON.stringify(v);
          }
          parts.push(encode(key) + '=' + encode(v));
        });
      });

      serializedParams = parts.join('&');
    }

    if (serializedParams) {
      var hashmarkIndex = url.indexOf('#');
      if (hashmarkIndex !== -1) {
        url = url.slice(0, hashmarkIndex);
      }

      url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
    }

    return url;
  };

  function InterceptorManager() {
    this.handlers = [];
  }

  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   *
   * @return {Number} An ID used to remove interceptor later
   */
  InterceptorManager.prototype.use = function use(fulfilled, rejected, options) {
    this.handlers.push({
      fulfilled: fulfilled,
      rejected: rejected,
      synchronous: options ? options.synchronous : false,
      runWhen: options ? options.runWhen : null
    });
    return this.handlers.length - 1;
  };

  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   */
  InterceptorManager.prototype.eject = function eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  };

  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   */
  InterceptorManager.prototype.forEach = function forEach(fn) {
    utils.forEach(this.handlers, function forEachHandler(h) {
      if (h !== null) {
        fn(h);
      }
    });
  };

  var InterceptorManager_1 = InterceptorManager;

  var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
    utils.forEach(headers, function processHeader(value, name) {
      if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
        headers[normalizedName] = value;
        delete headers[name];
      }
    });
  };

  /**
   * Update an Error with the specified config, error code, and response.
   *
   * @param {Error} error The error to update.
   * @param {Object} config The config.
   * @param {string} [code] The error code (for example, 'ECONNABORTED').
   * @param {Object} [request] The request.
   * @param {Object} [response] The response.
   * @returns {Error} The error.
   */
  var enhanceError = function enhanceError(error, config, code, request, response) {
    error.config = config;
    if (code) {
      error.code = code;
    }

    error.request = request;
    error.response = response;
    error.isAxiosError = true;

    error.toJSON = function toJSON() {
      return {
        // Standard
        message: this.message,
        name: this.name,
        // Microsoft
        description: this.description,
        number: this.number,
        // Mozilla
        fileName: this.fileName,
        lineNumber: this.lineNumber,
        columnNumber: this.columnNumber,
        stack: this.stack,
        // Axios
        config: this.config,
        code: this.code
      };
    };
    return error;
  };

  /**
   * Create an Error with the specified message, config, error code, request and response.
   *
   * @param {string} message The error message.
   * @param {Object} config The config.
   * @param {string} [code] The error code (for example, 'ECONNABORTED').
   * @param {Object} [request] The request.
   * @param {Object} [response] The response.
   * @returns {Error} The created error.
   */
  var createError = function createError(message, config, code, request, response) {
    var error = new Error(message);
    return enhanceError(error, config, code, request, response);
  };

  /**
   * Resolve or reject a Promise based on response status.
   *
   * @param {Function} resolve A function that resolves the promise.
   * @param {Function} reject A function that rejects the promise.
   * @param {object} response The response.
   */
  var settle = function settle(resolve, reject, response) {
    var validateStatus = response.config.validateStatus;
    if (!response.status || !validateStatus || validateStatus(response.status)) {
      resolve(response);
    } else {
      reject(createError(
        'Request failed with status code ' + response.status,
        response.config,
        null,
        response.request,
        response
      ));
    }
  };

  var cookies = (
    utils.isStandardBrowserEnv() ?

    // Standard browser envs support document.cookie
      (function standardBrowserEnv() {
        return {
          write: function write(name, value, expires, path, domain, secure) {
            var cookie = [];
            cookie.push(name + '=' + encodeURIComponent(value));

            if (utils.isNumber(expires)) {
              cookie.push('expires=' + new Date(expires).toGMTString());
            }

            if (utils.isString(path)) {
              cookie.push('path=' + path);
            }

            if (utils.isString(domain)) {
              cookie.push('domain=' + domain);
            }

            if (secure === true) {
              cookie.push('secure');
            }

            document.cookie = cookie.join('; ');
          },

          read: function read(name) {
            var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
            return (match ? decodeURIComponent(match[3]) : null);
          },

          remove: function remove(name) {
            this.write(name, '', Date.now() - 86400000);
          }
        };
      })() :

    // Non standard browser env (web workers, react-native) lack needed support.
      (function nonStandardBrowserEnv() {
        return {
          write: function write() {},
          read: function read() { return null; },
          remove: function remove() {}
        };
      })()
  );

  /**
   * Determines whether the specified URL is absolute
   *
   * @param {string} url The URL to test
   * @returns {boolean} True if the specified URL is absolute, otherwise false
   */
  var isAbsoluteURL = function isAbsoluteURL(url) {
    // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
    // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
    // by any combination of letters, digits, plus, period, or hyphen.
    return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
  };

  /**
   * Creates a new URL by combining the specified URLs
   *
   * @param {string} baseURL The base URL
   * @param {string} relativeURL The relative URL
   * @returns {string} The combined URL
   */
  var combineURLs = function combineURLs(baseURL, relativeURL) {
    return relativeURL
      ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
      : baseURL;
  };

  /**
   * Creates a new URL by combining the baseURL with the requestedURL,
   * only when the requestedURL is not already an absolute URL.
   * If the requestURL is absolute, this function returns the requestedURL untouched.
   *
   * @param {string} baseURL The base URL
   * @param {string} requestedURL Absolute or relative URL to combine
   * @returns {string} The combined full path
   */
  var buildFullPath = function buildFullPath(baseURL, requestedURL) {
    if (baseURL && !isAbsoluteURL(requestedURL)) {
      return combineURLs(baseURL, requestedURL);
    }
    return requestedURL;
  };

  // Headers whose duplicates are ignored by node
  // c.f. https://nodejs.org/api/http.html#http_message_headers
  var ignoreDuplicateOf = [
    'age', 'authorization', 'content-length', 'content-type', 'etag',
    'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
    'last-modified', 'location', 'max-forwards', 'proxy-authorization',
    'referer', 'retry-after', 'user-agent'
  ];

  /**
   * Parse headers into an object
   *
   * ```
   * Date: Wed, 27 Aug 2014 08:58:49 GMT
   * Content-Type: application/json
   * Connection: keep-alive
   * Transfer-Encoding: chunked
   * ```
   *
   * @param {String} headers Headers needing to be parsed
   * @returns {Object} Headers parsed into an object
   */
  var parseHeaders = function parseHeaders(headers) {
    var parsed = {};
    var key;
    var val;
    var i;

    if (!headers) { return parsed; }

    utils.forEach(headers.split('\n'), function parser(line) {
      i = line.indexOf(':');
      key = utils.trim(line.substr(0, i)).toLowerCase();
      val = utils.trim(line.substr(i + 1));

      if (key) {
        if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
          return;
        }
        if (key === 'set-cookie') {
          parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
        } else {
          parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
        }
      }
    });

    return parsed;
  };

  var isURLSameOrigin = (
    utils.isStandardBrowserEnv() ?

    // Standard browser envs have full support of the APIs needed to test
    // whether the request URL is of the same origin as current location.
      (function standardBrowserEnv() {
        var msie = /(msie|trident)/i.test(navigator.userAgent);
        var urlParsingNode = document.createElement('a');
        var originURL;

        /**
      * Parse a URL to discover it's components
      *
      * @param {String} url The URL to be parsed
      * @returns {Object}
      */
        function resolveURL(url) {
          var href = url;

          if (msie) {
          // IE needs attribute set twice to normalize properties
            urlParsingNode.setAttribute('href', href);
            href = urlParsingNode.href;
          }

          urlParsingNode.setAttribute('href', href);

          // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
          return {
            href: urlParsingNode.href,
            protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
            host: urlParsingNode.host,
            search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
            hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
            hostname: urlParsingNode.hostname,
            port: urlParsingNode.port,
            pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
              urlParsingNode.pathname :
              '/' + urlParsingNode.pathname
          };
        }

        originURL = resolveURL(window.location.href);

        /**
      * Determine if a URL shares the same origin as the current location
      *
      * @param {String} requestURL The URL to test
      * @returns {boolean} True if URL shares the same origin, otherwise false
      */
        return function isURLSameOrigin(requestURL) {
          var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
          return (parsed.protocol === originURL.protocol &&
              parsed.host === originURL.host);
        };
      })() :

    // Non standard browser envs (web workers, react-native) lack needed support.
      (function nonStandardBrowserEnv() {
        return function isURLSameOrigin() {
          return true;
        };
      })()
  );

  var xhr = function xhrAdapter(config) {
    return new Promise(function dispatchXhrRequest(resolve, reject) {
      var requestData = config.data;
      var requestHeaders = config.headers;
      var responseType = config.responseType;

      if (utils.isFormData(requestData)) {
        delete requestHeaders['Content-Type']; // Let the browser set it
      }

      var request = new XMLHttpRequest();

      // HTTP basic authentication
      if (config.auth) {
        var username = config.auth.username || '';
        var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
        requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
      }

      var fullPath = buildFullPath(config.baseURL, config.url);
      request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

      // Set the request timeout in MS
      request.timeout = config.timeout;

      function onloadend() {
        if (!request) {
          return;
        }
        // Prepare the response
        var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
        var responseData = !responseType || responseType === 'text' ||  responseType === 'json' ?
          request.responseText : request.response;
        var response = {
          data: responseData,
          status: request.status,
          statusText: request.statusText,
          headers: responseHeaders,
          config: config,
          request: request
        };

        settle(resolve, reject, response);

        // Clean up request
        request = null;
      }

      if ('onloadend' in request) {
        // Use onloadend if available
        request.onloadend = onloadend;
      } else {
        // Listen for ready state to emulate onloadend
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }
          // readystate handler is calling before onerror or ontimeout handlers,
          // so we should call onloadend on the next 'tick'
          setTimeout(onloadend);
        };
      }

      // Handle browser request cancellation (as opposed to a manual cancellation)
      request.onabort = function handleAbort() {
        if (!request) {
          return;
        }

        reject(createError('Request aborted', config, 'ECONNABORTED', request));

        // Clean up request
        request = null;
      };

      // Handle low level network errors
      request.onerror = function handleError() {
        // Real errors are hidden from us by the browser
        // onerror should only fire if it's a network error
        reject(createError('Network Error', config, null, request));

        // Clean up request
        request = null;
      };

      // Handle timeout
      request.ontimeout = function handleTimeout() {
        var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
        if (config.timeoutErrorMessage) {
          timeoutErrorMessage = config.timeoutErrorMessage;
        }
        reject(createError(
          timeoutErrorMessage,
          config,
          config.transitional && config.transitional.clarifyTimeoutError ? 'ETIMEDOUT' : 'ECONNABORTED',
          request));

        // Clean up request
        request = null;
      };

      // Add xsrf header
      // This is only done if running in a standard browser environment.
      // Specifically not if we're in a web worker, or react-native.
      if (utils.isStandardBrowserEnv()) {
        // Add xsrf header
        var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
          cookies.read(config.xsrfCookieName) :
          undefined;

        if (xsrfValue) {
          requestHeaders[config.xsrfHeaderName] = xsrfValue;
        }
      }

      // Add headers to the request
      if ('setRequestHeader' in request) {
        utils.forEach(requestHeaders, function setRequestHeader(val, key) {
          if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
            // Remove Content-Type if data is undefined
            delete requestHeaders[key];
          } else {
            // Otherwise add header to the request
            request.setRequestHeader(key, val);
          }
        });
      }

      // Add withCredentials to request if needed
      if (!utils.isUndefined(config.withCredentials)) {
        request.withCredentials = !!config.withCredentials;
      }

      // Add responseType to request if needed
      if (responseType && responseType !== 'json') {
        request.responseType = config.responseType;
      }

      // Handle progress if needed
      if (typeof config.onDownloadProgress === 'function') {
        request.addEventListener('progress', config.onDownloadProgress);
      }

      // Not all browsers support upload events
      if (typeof config.onUploadProgress === 'function' && request.upload) {
        request.upload.addEventListener('progress', config.onUploadProgress);
      }

      if (config.cancelToken) {
        // Handle cancellation
        config.cancelToken.promise.then(function onCanceled(cancel) {
          if (!request) {
            return;
          }

          request.abort();
          reject(cancel);
          // Clean up request
          request = null;
        });
      }

      if (!requestData) {
        requestData = null;
      }

      // Send the request
      request.send(requestData);
    });
  };

  var DEFAULT_CONTENT_TYPE = {
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  function setContentTypeIfUnset(headers, value) {
    if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
      headers['Content-Type'] = value;
    }
  }

  function getDefaultAdapter() {
    var adapter;
    if (typeof XMLHttpRequest !== 'undefined') {
      // For browsers use XHR adapter
      adapter = xhr;
    } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
      // For node use HTTP adapter
      adapter = xhr;
    }
    return adapter;
  }

  function stringifySafely(rawValue, parser, encoder) {
    if (utils.isString(rawValue)) {
      try {
        (parser || JSON.parse)(rawValue);
        return utils.trim(rawValue);
      } catch (e) {
        if (e.name !== 'SyntaxError') {
          throw e;
        }
      }
    }

    return (encoder || JSON.stringify)(rawValue);
  }

  var defaults = {

    transitional: {
      silentJSONParsing: true,
      forcedJSONParsing: true,
      clarifyTimeoutError: false
    },

    adapter: getDefaultAdapter(),

    transformRequest: [function transformRequest(data, headers) {
      normalizeHeaderName(headers, 'Accept');
      normalizeHeaderName(headers, 'Content-Type');

      if (utils.isFormData(data) ||
        utils.isArrayBuffer(data) ||
        utils.isBuffer(data) ||
        utils.isStream(data) ||
        utils.isFile(data) ||
        utils.isBlob(data)
      ) {
        return data;
      }
      if (utils.isArrayBufferView(data)) {
        return data.buffer;
      }
      if (utils.isURLSearchParams(data)) {
        setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
        return data.toString();
      }
      if (utils.isObject(data) || (headers && headers['Content-Type'] === 'application/json')) {
        setContentTypeIfUnset(headers, 'application/json');
        return stringifySafely(data);
      }
      return data;
    }],

    transformResponse: [function transformResponse(data) {
      var transitional = this.transitional;
      var silentJSONParsing = transitional && transitional.silentJSONParsing;
      var forcedJSONParsing = transitional && transitional.forcedJSONParsing;
      var strictJSONParsing = !silentJSONParsing && this.responseType === 'json';

      if (strictJSONParsing || (forcedJSONParsing && utils.isString(data) && data.length)) {
        try {
          return JSON.parse(data);
        } catch (e) {
          if (strictJSONParsing) {
            if (e.name === 'SyntaxError') {
              throw enhanceError(e, this, 'E_JSON_PARSE');
            }
            throw e;
          }
        }
      }

      return data;
    }],

    /**
     * A timeout in milliseconds to abort a request. If set to 0 (default) a
     * timeout is not created.
     */
    timeout: 0,

    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',

    maxContentLength: -1,
    maxBodyLength: -1,

    validateStatus: function validateStatus(status) {
      return status >= 200 && status < 300;
    }
  };

  defaults.headers = {
    common: {
      'Accept': 'application/json, text/plain, */*'
    }
  };

  utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
    defaults.headers[method] = {};
  });

  utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
    defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
  });

  var defaults_1 = defaults;

  /**
   * Transform the data for a request or a response
   *
   * @param {Object|String} data The data to be transformed
   * @param {Array} headers The headers for the request or response
   * @param {Array|Function} fns A single function or Array of functions
   * @returns {*} The resulting transformed data
   */
  var transformData = function transformData(data, headers, fns) {
    var context = this || defaults_1;
    /*eslint no-param-reassign:0*/
    utils.forEach(fns, function transform(fn) {
      data = fn.call(context, data, headers);
    });

    return data;
  };

  var isCancel = function isCancel(value) {
    return !!(value && value.__CANCEL__);
  };

  /**
   * Throws a `Cancel` if cancellation has been requested.
   */
  function throwIfCancellationRequested(config) {
    if (config.cancelToken) {
      config.cancelToken.throwIfRequested();
    }
  }

  /**
   * Dispatch a request to the server using the configured adapter.
   *
   * @param {object} config The config that is to be used for the request
   * @returns {Promise} The Promise to be fulfilled
   */
  var dispatchRequest = function dispatchRequest(config) {
    throwIfCancellationRequested(config);

    // Ensure headers exist
    config.headers = config.headers || {};

    // Transform request data
    config.data = transformData.call(
      config,
      config.data,
      config.headers,
      config.transformRequest
    );

    // Flatten headers
    config.headers = utils.merge(
      config.headers.common || {},
      config.headers[config.method] || {},
      config.headers
    );

    utils.forEach(
      ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
      function cleanHeaderConfig(method) {
        delete config.headers[method];
      }
    );

    var adapter = config.adapter || defaults_1.adapter;

    return adapter(config).then(function onAdapterResolution(response) {
      throwIfCancellationRequested(config);

      // Transform response data
      response.data = transformData.call(
        config,
        response.data,
        response.headers,
        config.transformResponse
      );

      return response;
    }, function onAdapterRejection(reason) {
      if (!isCancel(reason)) {
        throwIfCancellationRequested(config);

        // Transform response data
        if (reason && reason.response) {
          reason.response.data = transformData.call(
            config,
            reason.response.data,
            reason.response.headers,
            config.transformResponse
          );
        }
      }

      return Promise.reject(reason);
    });
  };

  /**
   * Config-specific merge-function which creates a new config-object
   * by merging two configuration objects together.
   *
   * @param {Object} config1
   * @param {Object} config2
   * @returns {Object} New object resulting from merging config2 to config1
   */
  var mergeConfig = function mergeConfig(config1, config2) {
    // eslint-disable-next-line no-param-reassign
    config2 = config2 || {};
    var config = {};

    var valueFromConfig2Keys = ['url', 'method', 'data'];
    var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
    var defaultToConfig2Keys = [
      'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
      'timeout', 'timeoutMessage', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
      'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'decompress',
      'maxContentLength', 'maxBodyLength', 'maxRedirects', 'transport', 'httpAgent',
      'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
    ];
    var directMergeKeys = ['validateStatus'];

    function getMergedValue(target, source) {
      if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
        return utils.merge(target, source);
      } else if (utils.isPlainObject(source)) {
        return utils.merge({}, source);
      } else if (utils.isArray(source)) {
        return source.slice();
      }
      return source;
    }

    function mergeDeepProperties(prop) {
      if (!utils.isUndefined(config2[prop])) {
        config[prop] = getMergedValue(config1[prop], config2[prop]);
      } else if (!utils.isUndefined(config1[prop])) {
        config[prop] = getMergedValue(undefined, config1[prop]);
      }
    }

    utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
      if (!utils.isUndefined(config2[prop])) {
        config[prop] = getMergedValue(undefined, config2[prop]);
      }
    });

    utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);

    utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
      if (!utils.isUndefined(config2[prop])) {
        config[prop] = getMergedValue(undefined, config2[prop]);
      } else if (!utils.isUndefined(config1[prop])) {
        config[prop] = getMergedValue(undefined, config1[prop]);
      }
    });

    utils.forEach(directMergeKeys, function merge(prop) {
      if (prop in config2) {
        config[prop] = getMergedValue(config1[prop], config2[prop]);
      } else if (prop in config1) {
        config[prop] = getMergedValue(undefined, config1[prop]);
      }
    });

    var axiosKeys = valueFromConfig2Keys
      .concat(mergeDeepPropertiesKeys)
      .concat(defaultToConfig2Keys)
      .concat(directMergeKeys);

    var otherKeys = Object
      .keys(config1)
      .concat(Object.keys(config2))
      .filter(function filterAxiosKeys(key) {
        return axiosKeys.indexOf(key) === -1;
      });

    utils.forEach(otherKeys, mergeDeepProperties);

    return config;
  };

  var name = "axios";
  var version = "0.21.4";
  var description = "Promise based HTTP client for the browser and node.js";
  var main = "index.js";
  var scripts = {
  	test: "grunt test",
  	start: "node ./sandbox/server.js",
  	build: "NODE_ENV=production grunt build",
  	preversion: "npm test",
  	version: "npm run build && grunt version && git add -A dist && git add CHANGELOG.md bower.json package.json",
  	postversion: "git push && git push --tags",
  	examples: "node ./examples/server.js",
  	coveralls: "cat coverage/lcov.info | ./node_modules/coveralls/bin/coveralls.js",
  	fix: "eslint --fix lib/**/*.js"
  };
  var repository = {
  	type: "git",
  	url: "https://github.com/axios/axios.git"
  };
  var keywords = [
  	"xhr",
  	"http",
  	"ajax",
  	"promise",
  	"node"
  ];
  var author = "Matt Zabriskie";
  var license = "MIT";
  var bugs = {
  	url: "https://github.com/axios/axios/issues"
  };
  var homepage = "https://axios-http.com";
  var devDependencies = {
  	coveralls: "^3.0.0",
  	"es6-promise": "^4.2.4",
  	grunt: "^1.3.0",
  	"grunt-banner": "^0.6.0",
  	"grunt-cli": "^1.2.0",
  	"grunt-contrib-clean": "^1.1.0",
  	"grunt-contrib-watch": "^1.0.0",
  	"grunt-eslint": "^23.0.0",
  	"grunt-karma": "^4.0.0",
  	"grunt-mocha-test": "^0.13.3",
  	"grunt-ts": "^6.0.0-beta.19",
  	"grunt-webpack": "^4.0.2",
  	"istanbul-instrumenter-loader": "^1.0.0",
  	"jasmine-core": "^2.4.1",
  	karma: "^6.3.2",
  	"karma-chrome-launcher": "^3.1.0",
  	"karma-firefox-launcher": "^2.1.0",
  	"karma-jasmine": "^1.1.1",
  	"karma-jasmine-ajax": "^0.1.13",
  	"karma-safari-launcher": "^1.0.0",
  	"karma-sauce-launcher": "^4.3.6",
  	"karma-sinon": "^1.0.5",
  	"karma-sourcemap-loader": "^0.3.8",
  	"karma-webpack": "^4.0.2",
  	"load-grunt-tasks": "^3.5.2",
  	minimist: "^1.2.0",
  	mocha: "^8.2.1",
  	sinon: "^4.5.0",
  	"terser-webpack-plugin": "^4.2.3",
  	typescript: "^4.0.5",
  	"url-search-params": "^0.10.0",
  	webpack: "^4.44.2",
  	"webpack-dev-server": "^3.11.0"
  };
  var browser = {
  	"./lib/adapters/http.js": "./lib/adapters/xhr.js"
  };
  var jsdelivr = "dist/axios.min.js";
  var unpkg = "dist/axios.min.js";
  var typings = "./index.d.ts";
  var dependencies = {
  	"follow-redirects": "^1.14.0"
  };
  var bundlesize = [
  	{
  		path: "./dist/axios.min.js",
  		threshold: "5kB"
  	}
  ];
  var pkg = {
  	name: name,
  	version: version,
  	description: description,
  	main: main,
  	scripts: scripts,
  	repository: repository,
  	keywords: keywords,
  	author: author,
  	license: license,
  	bugs: bugs,
  	homepage: homepage,
  	devDependencies: devDependencies,
  	browser: browser,
  	jsdelivr: jsdelivr,
  	unpkg: unpkg,
  	typings: typings,
  	dependencies: dependencies,
  	bundlesize: bundlesize
  };

  var validators$1 = {};

  // eslint-disable-next-line func-names
  ['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach(function(type, i) {
    validators$1[type] = function validator(thing) {
      return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
    };
  });

  var deprecatedWarnings = {};
  var currentVerArr = pkg.version.split('.');

  /**
   * Compare package versions
   * @param {string} version
   * @param {string?} thanVersion
   * @returns {boolean}
   */
  function isOlderVersion(version, thanVersion) {
    var pkgVersionArr = thanVersion ? thanVersion.split('.') : currentVerArr;
    var destVer = version.split('.');
    for (var i = 0; i < 3; i++) {
      if (pkgVersionArr[i] > destVer[i]) {
        return true;
      } else if (pkgVersionArr[i] < destVer[i]) {
        return false;
      }
    }
    return false;
  }

  /**
   * Transitional option validator
   * @param {function|boolean?} validator
   * @param {string?} version
   * @param {string} message
   * @returns {function}
   */
  validators$1.transitional = function transitional(validator, version, message) {
    var isDeprecated = version && isOlderVersion(version);

    function formatMessage(opt, desc) {
      return '[Axios v' + pkg.version + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
    }

    // eslint-disable-next-line func-names
    return function(value, opt, opts) {
      if (validator === false) {
        throw new Error(formatMessage(opt, ' has been removed in ' + version));
      }

      if (isDeprecated && !deprecatedWarnings[opt]) {
        deprecatedWarnings[opt] = true;
        // eslint-disable-next-line no-console
        console.warn(
          formatMessage(
            opt,
            ' has been deprecated since v' + version + ' and will be removed in the near future'
          )
        );
      }

      return validator ? validator(value, opt, opts) : true;
    };
  };

  /**
   * Assert object's properties type
   * @param {object} options
   * @param {object} schema
   * @param {boolean?} allowUnknown
   */

  function assertOptions(options, schema, allowUnknown) {
    if (typeof options !== 'object') {
      throw new TypeError('options must be an object');
    }
    var keys = Object.keys(options);
    var i = keys.length;
    while (i-- > 0) {
      var opt = keys[i];
      var validator = schema[opt];
      if (validator) {
        var value = options[opt];
        var result = value === undefined || validator(value, opt, options);
        if (result !== true) {
          throw new TypeError('option ' + opt + ' must be ' + result);
        }
        continue;
      }
      if (allowUnknown !== true) {
        throw Error('Unknown option ' + opt);
      }
    }
  }

  var validator = {
    isOlderVersion: isOlderVersion,
    assertOptions: assertOptions,
    validators: validators$1
  };

  var validators = validator.validators;
  /**
   * Create a new instance of Axios
   *
   * @param {Object} instanceConfig The default config for the instance
   */
  function Axios(instanceConfig) {
    this.defaults = instanceConfig;
    this.interceptors = {
      request: new InterceptorManager_1(),
      response: new InterceptorManager_1()
    };
  }

  /**
   * Dispatch a request
   *
   * @param {Object} config The config specific for this request (merged with this.defaults)
   */
  Axios.prototype.request = function request(config) {
    /*eslint no-param-reassign:0*/
    // Allow for axios('example/url'[, config]) a la fetch API
    if (typeof config === 'string') {
      config = arguments[1] || {};
      config.url = arguments[0];
    } else {
      config = config || {};
    }

    config = mergeConfig(this.defaults, config);

    // Set config.method
    if (config.method) {
      config.method = config.method.toLowerCase();
    } else if (this.defaults.method) {
      config.method = this.defaults.method.toLowerCase();
    } else {
      config.method = 'get';
    }

    var transitional = config.transitional;

    if (transitional !== undefined) {
      validator.assertOptions(transitional, {
        silentJSONParsing: validators.transitional(validators.boolean, '1.0.0'),
        forcedJSONParsing: validators.transitional(validators.boolean, '1.0.0'),
        clarifyTimeoutError: validators.transitional(validators.boolean, '1.0.0')
      }, false);
    }

    // filter out skipped interceptors
    var requestInterceptorChain = [];
    var synchronousRequestInterceptors = true;
    this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
      if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
        return;
      }

      synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

      requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
    });

    var responseInterceptorChain = [];
    this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    });

    var promise;

    if (!synchronousRequestInterceptors) {
      var chain = [dispatchRequest, undefined];

      Array.prototype.unshift.apply(chain, requestInterceptorChain);
      chain = chain.concat(responseInterceptorChain);

      promise = Promise.resolve(config);
      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise;
    }


    var newConfig = config;
    while (requestInterceptorChain.length) {
      var onFulfilled = requestInterceptorChain.shift();
      var onRejected = requestInterceptorChain.shift();
      try {
        newConfig = onFulfilled(newConfig);
      } catch (error) {
        onRejected(error);
        break;
      }
    }

    try {
      promise = dispatchRequest(newConfig);
    } catch (error) {
      return Promise.reject(error);
    }

    while (responseInterceptorChain.length) {
      promise = promise.then(responseInterceptorChain.shift(), responseInterceptorChain.shift());
    }

    return promise;
  };

  Axios.prototype.getUri = function getUri(config) {
    config = mergeConfig(this.defaults, config);
    return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
  };

  // Provide aliases for supported request methods
  utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
    /*eslint func-names:0*/
    Axios.prototype[method] = function(url, config) {
      return this.request(mergeConfig(config || {}, {
        method: method,
        url: url,
        data: (config || {}).data
      }));
    };
  });

  utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
    /*eslint func-names:0*/
    Axios.prototype[method] = function(url, data, config) {
      return this.request(mergeConfig(config || {}, {
        method: method,
        url: url,
        data: data
      }));
    };
  });

  var Axios_1 = Axios;

  /**
   * A `Cancel` is an object that is thrown when an operation is canceled.
   *
   * @class
   * @param {string=} message The message.
   */
  function Cancel(message) {
    this.message = message;
  }

  Cancel.prototype.toString = function toString() {
    return 'Cancel' + (this.message ? ': ' + this.message : '');
  };

  Cancel.prototype.__CANCEL__ = true;

  var Cancel_1 = Cancel;

  /**
   * A `CancelToken` is an object that can be used to request cancellation of an operation.
   *
   * @class
   * @param {Function} executor The executor function.
   */
  function CancelToken(executor) {
    if (typeof executor !== 'function') {
      throw new TypeError('executor must be a function.');
    }

    var resolvePromise;
    this.promise = new Promise(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    });

    var token = this;
    executor(function cancel(message) {
      if (token.reason) {
        // Cancellation has already been requested
        return;
      }

      token.reason = new Cancel_1(message);
      resolvePromise(token.reason);
    });
  }

  /**
   * Throws a `Cancel` if cancellation has been requested.
   */
  CancelToken.prototype.throwIfRequested = function throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  };

  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  CancelToken.source = function source() {
    var cancel;
    var token = new CancelToken(function executor(c) {
      cancel = c;
    });
    return {
      token: token,
      cancel: cancel
    };
  };

  var CancelToken_1 = CancelToken;

  /**
   * Syntactic sugar for invoking a function and expanding an array for arguments.
   *
   * Common use case would be to use `Function.prototype.apply`.
   *
   *  ```js
   *  function f(x, y, z) {}
   *  var args = [1, 2, 3];
   *  f.apply(null, args);
   *  ```
   *
   * With `spread` this example can be re-written.
   *
   *  ```js
   *  spread(function(x, y, z) {})([1, 2, 3]);
   *  ```
   *
   * @param {Function} callback
   * @returns {Function}
   */
  var spread = function spread(callback) {
    return function wrap(arr) {
      return callback.apply(null, arr);
    };
  };

  /**
   * Determines whether the payload is an error thrown by Axios
   *
   * @param {*} payload The value to test
   * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
   */
  var isAxiosError = function isAxiosError(payload) {
    return (typeof payload === 'object') && (payload.isAxiosError === true);
  };

  /**
   * Create an instance of Axios
   *
   * @param {Object} defaultConfig The default config for the instance
   * @return {Axios} A new instance of Axios
   */
  function createInstance(defaultConfig) {
    var context = new Axios_1(defaultConfig);
    var instance = bind(Axios_1.prototype.request, context);

    // Copy axios.prototype to instance
    utils.extend(instance, Axios_1.prototype, context);

    // Copy context to instance
    utils.extend(instance, context);

    return instance;
  }

  // Create the default instance to be exported
  var axios$1 = createInstance(defaults_1);

  // Expose Axios class to allow class inheritance
  axios$1.Axios = Axios_1;

  // Factory for creating new instances
  axios$1.create = function create(instanceConfig) {
    return createInstance(mergeConfig(axios$1.defaults, instanceConfig));
  };

  // Expose Cancel & CancelToken
  axios$1.Cancel = Cancel_1;
  axios$1.CancelToken = CancelToken_1;
  axios$1.isCancel = isCancel;

  // Expose all/spread
  axios$1.all = function all(promises) {
    return Promise.all(promises);
  };
  axios$1.spread = spread;

  // Expose isAxiosError
  axios$1.isAxiosError = isAxiosError;

  var axios_1 = axios$1;

  // Allow use of default import syntax in TypeScript
  var _default = axios$1;
  axios_1.default = _default;

  var axios = axios_1;

  // Api.js
  const axiosAPI = axios.create({});

  axiosAPI.interceptors.request.use(config => {
    console.log({ config });
    // config.url = 'http://localhost:8080/' + config.url
    config.headers['Content-Type'] = 'application/json;charset=UTF-8';
    return config
  });

  const apiRequest = (method, url, request, headers = {}) => {
    return axiosAPI({
      method,
      url,
      data: request,
      headers
    })
      .then(res => {
        return Promise.resolve(res.data)
      })
      .catch(err => {
        return Promise.reject(err)
      })
  };

  // function to execute the http get request
  const get = (url, request, headers) => apiRequest('get', url, request, headers);

  // function to execute the http delete request
  const deleteRequest = (url, request, headers) => apiRequest('delete', url, request, headers);

  // function to execute the http post request
  const post = (url, request, headers) => apiRequest('post', url, request, headers);

  // function to execute the http put request
  const put = (url, request, headers) => apiRequest('put', url, request, headers);

  // function to execute the http path request
  const patch = (url, request, headers) => apiRequest('patch', url, request, headers);

  // expose your method to other services or actions
  const API = {
    get,
    delete: deleteRequest,
    post,
    put,
    patch
  };

  const token = 'oo00trx4oclspt3nqhfc'; // TODO:通过链接获取
  /**
   *  彩云翻译API
   * @param {Array} source 待翻译文本列表
   * @param {String} transType 原始语言=>目标语言 支持auto
   */
  async function caiyunApi({ source = [], transType = 'auto2zh' }) {
    const url = 'https://api.interpreter.caiyunai.com/v1/translator';
    const data = {
      source,
      trans_type: transType,
      detect: true
    };
    try {
      const { target = [] } = await API.post(url, data, {
        'x-authorization': 'token ' + token
      });
      return {
        source,
        target,
        sourceLang: transType.split('2')[0],
        tragetLang: transType.split('2')[1]
      }
    } catch (err) {
      console.log(err);
    }
  }

  // 如何调用？
  // import { caiyunApi } from './request/translate/caiyun'
  // const source = ['This Bloomberg report provided a good summary.']
  // const transType = 'auto2zh'
  // caiyunApi({ source, transType })
  //   .then(res => {
  //     console.log('j---', res)
  //   })
  //   .catch(err => {
  //     console.log('j---', err)
  //   })

  /* src/components/Basics/TransTextarea.svelte generated by Svelte v3.46.2 */

  const { console: console_1$1 } = globals;
  const file$3 = "src/components/Basics/TransTextarea.svelte";

  // (131:4) {#if sourceText}
  function create_if_block_1(ctx) {
  	let div;
  	let span;
  	let mounted;
  	let dispose;

  	const block = {
  		c: function create() {
  			div = element("div");
  			span = element("span");
  			attr_dev(span, "class", "iconfont icon-close transition-300 font-size-16 color-99 hover-color-main");
  			add_location(span, file$3, 132, 8, 3823);
  			attr_dev(div, "class", "source-icon svelte-f6ggf5");
  			add_location(div, file$3, 131, 6, 3789);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);
  			append_dev(div, span);

  			if (!mounted) {
  				dispose = listen_dev(span, "click", /*handleClear*/ ctx[4], false, false, false);
  				mounted = true;
  			}
  		},
  		p: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			mounted = false;
  			dispose();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block_1.name,
  		type: "if",
  		source: "(131:4) {#if sourceText}",
  		ctx
  	});

  	return block;
  }

  // (143:6) {#if dotLoading}
  function create_if_block$1(ctx) {
  	let span;

  	const block = {
  		c: function create() {
  			span = element("span");
  			span.textContent = "...";
  			add_location(span, file$3, 143, 8, 4127);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, span, anchor);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(span);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block$1.name,
  		type: "if",
  		source: "(143:6) {#if dotLoading}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$3(ctx) {
  	let main;
  	let toast;
  	let t0;
  	let div0;
  	let textarea;
  	let t1;
  	let t2;
  	let div5;
  	let div1;
  	let html_tag;
  	let t3;
  	let t4;
  	let div4;
  	let div2;
  	let img;
  	let img_src_value;
  	let t5;
  	let span0;
  	let t6_value = transServiceDict[/*transService*/ ctx[1]].name + "";
  	let t6;
  	let t7;
  	let div3;
  	let span1;
  	let t8;
  	let span2;
  	let current;
  	let mounted;
  	let dispose;
  	toast = new Toast({ $$inline: true });
  	let if_block0 = /*sourceText*/ ctx[0] && create_if_block_1(ctx);
  	let if_block1 = /*dotLoading*/ ctx[3] && create_if_block$1(ctx);

  	const block = {
  		c: function create() {
  			main = element("main");
  			create_component(toast.$$.fragment);
  			t0 = space();
  			div0 = element("div");
  			textarea = element("textarea");
  			t1 = space();
  			if (if_block0) if_block0.c();
  			t2 = space();
  			div5 = element("div");
  			div1 = element("div");
  			html_tag = new HtmlTag();
  			t3 = space();
  			if (if_block1) if_block1.c();
  			t4 = space();
  			div4 = element("div");
  			div2 = element("div");
  			img = element("img");
  			t5 = space();
  			span0 = element("span");
  			t6 = text(t6_value);
  			t7 = space();
  			div3 = element("div");
  			span1 = element("span");
  			t8 = space();
  			span2 = element("span");
  			attr_dev(textarea, "class", "source-input padding-8 padding-tb-8 svelte-f6ggf5");
  			textarea.value = /*sourceText*/ ctx[0];
  			attr_dev(textarea, "placeholder", "输入要翻译的内容");
  			add_location(textarea, file$3, 123, 4, 3570);
  			attr_dev(div0, "class", "source flex svelte-f6ggf5");
  			add_location(div0, file$3, 122, 2, 3540);
  			html_tag.a = t3;
  			attr_dev(div1, "class", "target-text padding-8 color-main svelte-f6ggf5");
  			add_location(div1, file$3, 140, 4, 4024);
  			if (!src_url_equal(img.src, img_src_value = transServiceDict[/*transService*/ ctx[1]].src)) attr_dev(img, "src", img_src_value);
  			attr_dev(img, "width", "16");
  			attr_dev(img, "height", "16");
  			attr_dev(img, "alt", /*transService*/ ctx[1]);
  			set_style(img, "margin-top", "7px");
  			add_location(img, file$3, 152, 8, 4417);
  			add_location(span0, file$3, 159, 8, 4597);
  			attr_dev(div2, "class", "font-size-12 color-99 transition-300 flex cursor-pointer hover-color-main");
  			set_style(div2, "height", "30px");
  			set_style(div2, "line-height", "30px");
  			add_location(div2, file$3, 147, 6, 4228);
  			attr_dev(span1, "class", "iconfont icon-copy padding-lr-8 hover-color-main color-99 transition-300 font-size-16");
  			add_location(span1, file$3, 162, 8, 4704);
  			attr_dev(span2, "class", "iconfont icon-open-web hover-color-main color-99 transition-300 font-size-16");
  			add_location(span2, file$3, 165, 8, 4833);
  			attr_dev(div3, "class", "cursor-pointer");
  			add_location(div3, file$3, 161, 6, 4667);
  			attr_dev(div4, "class", "target-footer flex-between padding-8 svelte-f6ggf5");
  			add_location(div4, file$3, 146, 4, 4171);
  			attr_dev(div5, "class", "target svelte-f6ggf5");
  			add_location(div5, file$3, 139, 2, 3999);
  			attr_dev(main, "class", "round-4 font-size-14 svelte-f6ggf5");
  			add_location(main, file$3, 120, 0, 3490);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, main, anchor);
  			mount_component(toast, main, null);
  			append_dev(main, t0);
  			append_dev(main, div0);
  			append_dev(div0, textarea);
  			append_dev(div0, t1);
  			if (if_block0) if_block0.m(div0, null);
  			append_dev(main, t2);
  			append_dev(main, div5);
  			append_dev(div5, div1);
  			html_tag.m(/*targetText*/ ctx[2], div1);
  			append_dev(div1, t3);
  			if (if_block1) if_block1.m(div1, null);
  			append_dev(div5, t4);
  			append_dev(div5, div4);
  			append_dev(div4, div2);
  			append_dev(div2, img);
  			append_dev(div2, t5);
  			append_dev(div2, span0);
  			append_dev(span0, t6);
  			append_dev(div4, t7);
  			append_dev(div4, div3);
  			append_dev(div3, span1);
  			append_dev(div3, t8);
  			append_dev(div3, span2);
  			current = true;

  			if (!mounted) {
  				dispose = [
  					action_destroyer(text_area_resize.call(null, textarea)),
  					listen_dev(textarea, "input", debounce(/*handleInput*/ ctx[5], 600), false, false, false),
  					listen_dev(div2, "click", /*handleOpenWeb*/ ctx[6], false, false, false),
  					listen_dev(span2, "click", /*handleOpenWeb*/ ctx[6], false, false, false)
  				];

  				mounted = true;
  			}
  		},
  		p: function update(ctx, [dirty]) {
  			if (!current || dirty & /*sourceText*/ 1) {
  				prop_dev(textarea, "value", /*sourceText*/ ctx[0]);
  			}

  			if (/*sourceText*/ ctx[0]) {
  				if (if_block0) {
  					if_block0.p(ctx, dirty);
  				} else {
  					if_block0 = create_if_block_1(ctx);
  					if_block0.c();
  					if_block0.m(div0, null);
  				}
  			} else if (if_block0) {
  				if_block0.d(1);
  				if_block0 = null;
  			}

  			if (!current || dirty & /*targetText*/ 4) html_tag.p(/*targetText*/ ctx[2]);

  			if (/*dotLoading*/ ctx[3]) {
  				if (if_block1) ; else {
  					if_block1 = create_if_block$1(ctx);
  					if_block1.c();
  					if_block1.m(div1, null);
  				}
  			} else if (if_block1) {
  				if_block1.d(1);
  				if_block1 = null;
  			}

  			if (!current || dirty & /*transService*/ 2 && !src_url_equal(img.src, img_src_value = transServiceDict[/*transService*/ ctx[1]].src)) {
  				attr_dev(img, "src", img_src_value);
  			}

  			if (!current || dirty & /*transService*/ 2) {
  				attr_dev(img, "alt", /*transService*/ ctx[1]);
  			}

  			if ((!current || dirty & /*transService*/ 2) && t6_value !== (t6_value = transServiceDict[/*transService*/ ctx[1]].name + "")) set_data_dev(t6, t6_value);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(toast.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(toast.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(main);
  			destroy_component(toast);
  			if (if_block0) if_block0.d();
  			if (if_block1) if_block1.d();
  			mounted = false;
  			run_all(dispose);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$3.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function getTransList(str) {
  	const list = str.split(/\r\n|<br>|\n+/).filter(item => item.replace(/\s+/g, '')).map(item => item.trim().replace(/\s+/g, ' '));
  	return list;
  }

  function instance$3($$self, $$props, $$invalidate) {
  	let sourceTextTemp;
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('TransTextarea', slots, []);
  	let { sourceText = '' } = $$props;
  	let { transService = 'caiyun' } = $$props;
  	let { transType = 'en2zh' } = $$props;
  	let sourceTextPre = ''; // 保留上一个翻译文本，差量翻译
  	let targetText = '';
  	let dotLoading = false; // 是否显示...

  	function watchSourceText(str) {
  		console.log('watchSourceText', '--------');

  		if (clearText(sourceText)) {
  			if (clearText(sourceText) !== clearText(sourceTextPre)) {
  				const sourceList = getTransList(sourceText);
  				const preSourceList = getTransList(sourceTextPre);
  				const preTargetList = getTransList(targetText);

  				diffTrans({
  					sourceList,
  					preSourceList,
  					preTargetList,
  					transType
  				}).then(res => {
  					$$invalidate(3, dotLoading = false);
  					$$invalidate(2, targetText = res.join('<br>'));
  				});
  			}
  		} else {
  			handleClear();
  		}
  	}

  	// 请求翻译接口
  	async function requestTrans({ source, transType }) {
  		try {
  			const res = await caiyunApi({ source, transType });
  			return res.target;
  		} catch(err) {
  			window.showToast('糟糕！翻译错误');
  			console.log(err, '错误');
  		}
  	}

  	/**
   * 差量翻译方法
   * @param sourceList 未翻译列表
   * @param preSourceList 上一个未翻译列表
   * @param preTargetList 上一个已翻译列表
   */
  	async function diffTrans({ sourceList = [], preSourceList = [], preTargetList = [], transType }) {
  		if (preSourceList.length !== preTargetList.length) {
  			const res = await requestTrans({ source: sourceList, transType });
  			return res;
  		}

  		const indexList = []; // sourceList未翻译下标列表
  		const diffSourceList = []; // 需要翻译的列表,和indexList对应
  		const targetList = new Array(sourceList.length).fill(''); // 翻译好的列表

  		sourceList.forEach((item, index) => {
  			const searchIndex = preSourceList.findIndex(item2 => item2 === item);

  			if (searchIndex === -1) {
  				// 没找到,需要翻译
  				indexList.push(index);

  				diffSourceList.push(item);
  			} else {
  				// 找到,压入targetList
  				targetList[index] = preTargetList[searchIndex];
  			}
  		});

  		const res = await requestTrans({ source: diffSourceList, transType }); // 和indexList对应

  		indexList.forEach((item, index) => {
  			targetList[item] = res[index];
  		});

  		return targetList;
  	}

  	// 初始化
  	onMount(() => {
  		
  	});

  	// 清空事件
  	function handleClear() {
  		$$invalidate(0, sourceText = '');
  		$$invalidate(2, targetText = '');
  		$$invalidate(3, dotLoading = false);
  	}

  	// 输入文本事件
  	function handleInput({ target }) {
  		sourceTextPre = sourceText;
  		$$invalidate(0, sourceText = target.value);
  		$$invalidate(3, dotLoading = !!clearText(sourceText));
  	}

  	// 打开翻译网页
  	function handleOpenWeb() {
  		const url = transServiceDict[transService].getTransUrl({ source: sourceText, transType });
  		window.open(url, '_blank');
  	}

  	const clipboard = new ClipboardJS('.icon-copy', { text: () => targetText });

  	clipboard.on('success', e => {
  		window.showToast('复制成功');
  	});

  	const writable_props = ['sourceText', 'transService', 'transType'];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<TransTextarea> was created with unknown prop '${key}'`);
  	});

  	$$self.$$set = $$props => {
  		if ('sourceText' in $$props) $$invalidate(0, sourceText = $$props.sourceText);
  		if ('transService' in $$props) $$invalidate(1, transService = $$props.transService);
  		if ('transType' in $$props) $$invalidate(7, transType = $$props.transType);
  	};

  	$$self.$capture_state = () => ({
  		text_area_resize,
  		debounce,
  		clearText,
  		transServiceDict,
  		Toast,
  		ClipboardJS,
  		onMount,
  		caiyunApi,
  		sourceText,
  		transService,
  		transType,
  		sourceTextPre,
  		targetText,
  		dotLoading,
  		watchSourceText,
  		requestTrans,
  		diffTrans,
  		handleClear,
  		handleInput,
  		getTransList,
  		handleOpenWeb,
  		clipboard,
  		sourceTextTemp
  	});

  	$$self.$inject_state = $$props => {
  		if ('sourceText' in $$props) $$invalidate(0, sourceText = $$props.sourceText);
  		if ('transService' in $$props) $$invalidate(1, transService = $$props.transService);
  		if ('transType' in $$props) $$invalidate(7, transType = $$props.transType);
  		if ('sourceTextPre' in $$props) sourceTextPre = $$props.sourceTextPre;
  		if ('targetText' in $$props) $$invalidate(2, targetText = $$props.targetText);
  		if ('dotLoading' in $$props) $$invalidate(3, dotLoading = $$props.dotLoading);
  		if ('sourceTextTemp' in $$props) $$invalidate(8, sourceTextTemp = $$props.sourceTextTemp);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		if ($$self.$$.dirty & /*sourceText, transType*/ 129) {
  			$$invalidate(8, sourceTextTemp = clearText(sourceText) + transType); // 代理sourceText用于监听
  		}

  		if ($$self.$$.dirty & /*sourceTextTemp*/ 256) {
  			// 监听sourceText变化，请求接口
  			watchSourceText();
  		}
  	};

  	return [
  		sourceText,
  		transService,
  		targetText,
  		dotLoading,
  		handleClear,
  		handleInput,
  		handleOpenWeb,
  		transType,
  		sourceTextTemp
  	];
  }

  class TransTextarea extends SvelteComponentDev {
  	constructor(options) {
  		super(options);

  		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
  			sourceText: 0,
  			transService: 1,
  			transType: 7
  		});

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "TransTextarea",
  			options,
  			id: create_fragment$3.name
  		});
  	}

  	get sourceText() {
  		throw new Error("<TransTextarea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set sourceText(value) {
  		throw new Error("<TransTextarea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get transService() {
  		throw new Error("<TransTextarea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set transService(value) {
  		throw new Error("<TransTextarea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get transType() {
  		throw new Error("<TransTextarea>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set transType(value) {
  		throw new Error("<TransTextarea>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* src/components/FormSelect.svelte generated by Svelte v3.46.2 */
  const file$2 = "src/components/FormSelect.svelte";

  function get_each_context(ctx, list, i) {
  	const child_ctx = ctx.slice();
  	child_ctx[7] = list[i];
  	child_ctx[9] = i;
  	return child_ctx;
  }

  // (53:4) {#each options as item, index}
  function create_each_block(ctx) {
  	let div;
  	let t0_value = /*item*/ ctx[7].name + "";
  	let t0;
  	let t1;
  	let mounted;
  	let dispose;

  	const block = {
  		c: function create() {
  			div = element("div");
  			t0 = text(t0_value);
  			t1 = space();
  			attr_dev(div, "data-index", /*index*/ ctx[9]);
  			attr_dev(div, "class", "select-item font-size-14 padding-lr-8 svelte-1qv4blh");
  			add_location(div, file$2, 53, 6, 1252);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div, anchor);
  			append_dev(div, t0);
  			append_dev(div, t1);

  			if (!mounted) {
  				dispose = listen_dev(div, "click", /*handleSelect*/ ctx[3], false, false, false);
  				mounted = true;
  			}
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*options*/ 2 && t0_value !== (t0_value = /*item*/ ctx[7].name + "")) set_data_dev(t0, t0_value);
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div);
  			mounted = false;
  			dispose();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_each_block.name,
  		type: "each",
  		source: "(53:4) {#each options as item, index}",
  		ctx
  	});

  	return block;
  }

  function create_fragment$2(ctx) {
  	let main;
  	let div1;
  	let div0;
  	let t0;
  	let t1;
  	let i;
  	let t2;
  	let div2;
  	let mounted;
  	let dispose;
  	let each_value = /*options*/ ctx[1];
  	validate_each_argument(each_value);
  	let each_blocks = [];

  	for (let i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
  	}

  	const block = {
  		c: function create() {
  			main = element("main");
  			div1 = element("div");
  			div0 = element("div");
  			t0 = text(/*selectName*/ ctx[2]);
  			t1 = space();
  			i = element("i");
  			t2 = space();
  			div2 = element("div");

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			attr_dev(div0, "class", "font-size-14");
  			add_location(div0, file$2, 45, 4, 942);
  			attr_dev(i, "class", "transition-300 iconfont icon-arrow-down svelte-1qv4blh");
  			toggle_class(i, "arrow-up", /*showList*/ ctx[0]);
  			add_location(i, file$2, 46, 4, 991);
  			attr_dev(div1, "id", "select-box");
  			attr_dev(div1, "class", "color-main transition-300 bg-color-light-grey flex-between round-4 svelte-1qv4blh");
  			add_location(div1, file$2, 40, 2, 787);
  			attr_dev(div2, "class", "select-container round-4 bg-color-light-grey padding-tb-8 transition-300 svelte-1qv4blh");
  			toggle_class(div2, "select-spread", /*showList*/ ctx[0]);
  			add_location(div2, file$2, 48, 2, 1082);
  			attr_dev(main, "class", "svelte-1qv4blh");
  			add_location(main, file$2, 39, 0, 778);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, main, anchor);
  			append_dev(main, div1);
  			append_dev(div1, div0);
  			append_dev(div0, t0);
  			append_dev(div1, t1);
  			append_dev(div1, i);
  			append_dev(main, t2);
  			append_dev(main, div2);

  			for (let i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(div2, null);
  			}

  			if (!mounted) {
  				dispose = listen_dev(div1, "click", stop_propagation(/*handleClick*/ ctx[4]), false, false, true);
  				mounted = true;
  			}
  		},
  		p: function update(ctx, [dirty]) {
  			if (dirty & /*selectName*/ 4) set_data_dev(t0, /*selectName*/ ctx[2]);

  			if (dirty & /*showList*/ 1) {
  				toggle_class(i, "arrow-up", /*showList*/ ctx[0]);
  			}

  			if (dirty & /*handleSelect, options*/ 10) {
  				each_value = /*options*/ ctx[1];
  				validate_each_argument(each_value);
  				let i;

  				for (i = 0; i < each_value.length; i += 1) {
  					const child_ctx = get_each_context(ctx, each_value, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(child_ctx, dirty);
  					} else {
  						each_blocks[i] = create_each_block(child_ctx);
  						each_blocks[i].c();
  						each_blocks[i].m(div2, null);
  					}
  				}

  				for (; i < each_blocks.length; i += 1) {
  					each_blocks[i].d(1);
  				}

  				each_blocks.length = each_value.length;
  			}

  			if (dirty & /*showList*/ 1) {
  				toggle_class(div2, "select-spread", /*showList*/ ctx[0]);
  			}
  		},
  		i: noop,
  		o: noop,
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(main);
  			destroy_each(each_blocks, detaching);
  			mounted = false;
  			dispose();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$2.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$2($$self, $$props, $$invalidate) {
  	let selectName;
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('FormSelect', slots, []);
  	const dispatch = createEventDispatcher();
  	let { value = 'en' } = $$props;

  	let { options = [
  		// 语言列表
  		{ name: '中文', value: 'zh' },
  		{ name: '英语', value: 'en' },
  		{ name: '日语', value: 'ja' }
  	] } = $$props;

  	let { showList = false } = $$props; // 是否显示下拉框

  	// 选择语言点击事件
  	function handleSelect({ target }) {
  		$$invalidate(0, showList = false);
  		const { index } = target.dataset;
  		const item = options[Number(index)];
  		$$invalidate(5, value = item.value);
  		dispatch('handleChange', item);
  	}

  	// 下拉框点击事件
  	function handleClick() {
  		dispatch('handleClick');
  		$$invalidate(0, showList = !showList);
  	}

  	const writable_props = ['value', 'options', 'showList'];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FormSelect> was created with unknown prop '${key}'`);
  	});

  	$$self.$$set = $$props => {
  		if ('value' in $$props) $$invalidate(5, value = $$props.value);
  		if ('options' in $$props) $$invalidate(1, options = $$props.options);
  		if ('showList' in $$props) $$invalidate(0, showList = $$props.showList);
  	};

  	$$self.$capture_state = () => ({
  		createEventDispatcher,
  		onMount,
  		dispatch,
  		value,
  		options,
  		showList,
  		handleSelect,
  		handleClick,
  		selectName
  	});

  	$$self.$inject_state = $$props => {
  		if ('value' in $$props) $$invalidate(5, value = $$props.value);
  		if ('options' in $$props) $$invalidate(1, options = $$props.options);
  		if ('showList' in $$props) $$invalidate(0, showList = $$props.showList);
  		if ('selectName' in $$props) $$invalidate(2, selectName = $$props.selectName);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		if ($$self.$$.dirty & /*options, value*/ 34) {
  			$$invalidate(2, selectName = options.find(item => item.value === value).name);
  		}
  	};

  	return [showList, options, selectName, handleSelect, handleClick, value];
  }

  class FormSelect extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$2, create_fragment$2, safe_not_equal, { value: 5, options: 1, showList: 0 });

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "FormSelect",
  			options,
  			id: create_fragment$2.name
  		});
  	}

  	get value() {
  		throw new Error("<FormSelect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set value(value) {
  		throw new Error("<FormSelect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get options() {
  		throw new Error("<FormSelect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set options(value) {
  		throw new Error("<FormSelect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get showList() {
  		throw new Error("<FormSelect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set showList(value) {
  		throw new Error("<FormSelect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  /* src/components/Basics/LangSelect.svelte generated by Svelte v3.46.2 */
  const file$1 = "src/components/Basics/LangSelect.svelte";

  function create_fragment$1(ctx) {
  	let main;
  	let formselect0;
  	let updating_showList;
  	let t0;
  	let i;
  	let t1;
  	let formselect1;
  	let updating_showList_1;
  	let current;
  	let mounted;
  	let dispose;

  	function formselect0_showList_binding(value) {
  		/*formselect0_showList_binding*/ ctx[10](value);
  	}

  	let formselect0_props = {
  		options: /*langList*/ ctx[1],
  		value: /*value*/ ctx[0][0]
  	};

  	if (/*leftShowList*/ ctx[2] !== void 0) {
  		formselect0_props.showList = /*leftShowList*/ ctx[2];
  	}

  	formselect0 = new FormSelect({ props: formselect0_props, $$inline: true });
  	binding_callbacks.push(() => bind$1(formselect0, 'showList', formselect0_showList_binding));
  	formselect0.$on("handleClick", /*handleLeftClick*/ ctx[4]);
  	formselect0.$on("handleChange", /*handleChangeLeft*/ ctx[6]);

  	function formselect1_showList_binding(value) {
  		/*formselect1_showList_binding*/ ctx[11](value);
  	}

  	let formselect1_props = {
  		options: /*langList*/ ctx[1],
  		value: /*value*/ ctx[0][1]
  	};

  	if (/*rightShowList*/ ctx[3] !== void 0) {
  		formselect1_props.showList = /*rightShowList*/ ctx[3];
  	}

  	formselect1 = new FormSelect({ props: formselect1_props, $$inline: true });
  	binding_callbacks.push(() => bind$1(formselect1, 'showList', formselect1_showList_binding));
  	formselect1.$on("handleClick", /*handleRightClick*/ ctx[5]);
  	formselect1.$on("handleChange", /*handleChangeRight*/ ctx[7]);

  	const block = {
  		c: function create() {
  			main = element("main");
  			create_component(formselect0.$$.fragment);
  			t0 = space();
  			i = element("i");
  			t1 = space();
  			create_component(formselect1.$$.fragment);
  			attr_dev(i, "class", "trans-lang-middle iconfont icon-arrow-compare flex-center hover-color-main color-66");
  			add_location(i, file$1, 63, 2, 1368);
  			attr_dev(main, "class", "flex-between cursor-pointer svelte-zzcypp");
  			add_location(main, file$1, 55, 0, 1128);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, main, anchor);
  			mount_component(formselect0, main, null);
  			append_dev(main, t0);
  			append_dev(main, i);
  			append_dev(main, t1);
  			mount_component(formselect1, main, null);
  			current = true;

  			if (!mounted) {
  				dispose = [
  					listen_dev(i, "click", /*handleSwitch*/ ctx[8], false, false, false),
  					listen_dev(main, "click", /*handleClick*/ ctx[9], false, false, false)
  				];

  				mounted = true;
  			}
  		},
  		p: function update(ctx, [dirty]) {
  			const formselect0_changes = {};
  			if (dirty & /*langList*/ 2) formselect0_changes.options = /*langList*/ ctx[1];
  			if (dirty & /*value*/ 1) formselect0_changes.value = /*value*/ ctx[0][0];

  			if (!updating_showList && dirty & /*leftShowList*/ 4) {
  				updating_showList = true;
  				formselect0_changes.showList = /*leftShowList*/ ctx[2];
  				add_flush_callback(() => updating_showList = false);
  			}

  			formselect0.$set(formselect0_changes);
  			const formselect1_changes = {};
  			if (dirty & /*langList*/ 2) formselect1_changes.options = /*langList*/ ctx[1];
  			if (dirty & /*value*/ 1) formselect1_changes.value = /*value*/ ctx[0][1];

  			if (!updating_showList_1 && dirty & /*rightShowList*/ 8) {
  				updating_showList_1 = true;
  				formselect1_changes.showList = /*rightShowList*/ ctx[3];
  				add_flush_callback(() => updating_showList_1 = false);
  			}

  			formselect1.$set(formselect1_changes);
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(formselect0.$$.fragment, local);
  			transition_in(formselect1.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(formselect0.$$.fragment, local);
  			transition_out(formselect1.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(main);
  			destroy_component(formselect0);
  			destroy_component(formselect1);
  			mounted = false;
  			run_all(dispose);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment$1.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance$1($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('LangSelect', slots, []);
  	const dispatch = createEventDispatcher();

  	let { langList = [
  		{ name: '中文', value: 'zh' },
  		{ name: '英语', value: 'en' },
  		{ name: '日语', value: 'ja' }
  	] } = $$props;

  	let { value = ['en', 'zh'] } = $$props;
  	let leftShowList = false;
  	let rightShowList = false;

  	function handleLeftClick() {
  		$$invalidate(3, rightShowList = false);
  	}

  	function handleRightClick() {
  		$$invalidate(2, leftShowList = false);
  	}

  	function handleChangeLeft({ detail }) {
  		if (value[1] === detail.value) {
  			$$invalidate(0, value[1] = value[0], value);
  		}

  		$$invalidate(0, value[0] = detail.value, value);
  		dispatch('handleChange', value);
  	}

  	function handleChangeRight({ detail }) {
  		if (value[0] === detail.value) {
  			$$invalidate(0, value[0] = value[1], value);
  		}

  		$$invalidate(0, value[1] = detail.value, value);
  		dispatch('handleChange', value);
  	}

  	function handleSwitch() {
  		const temp = value[0];
  		$$invalidate(0, value[0] = value[1], value);
  		$$invalidate(0, value[1] = temp, value);
  		dispatch('handleChange', value);
  	}

  	function handleClick() {
  		$$invalidate(2, leftShowList = false);
  		$$invalidate(3, rightShowList = false);
  	}

  	const writable_props = ['langList', 'value'];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<LangSelect> was created with unknown prop '${key}'`);
  	});

  	function formselect0_showList_binding(value) {
  		leftShowList = value;
  		$$invalidate(2, leftShowList);
  	}

  	function formselect1_showList_binding(value) {
  		rightShowList = value;
  		$$invalidate(3, rightShowList);
  	}

  	$$self.$$set = $$props => {
  		if ('langList' in $$props) $$invalidate(1, langList = $$props.langList);
  		if ('value' in $$props) $$invalidate(0, value = $$props.value);
  	};

  	$$self.$capture_state = () => ({
  		FormSelect,
  		createEventDispatcher,
  		dispatch,
  		langList,
  		value,
  		leftShowList,
  		rightShowList,
  		handleLeftClick,
  		handleRightClick,
  		handleChangeLeft,
  		handleChangeRight,
  		handleSwitch,
  		handleClick
  	});

  	$$self.$inject_state = $$props => {
  		if ('langList' in $$props) $$invalidate(1, langList = $$props.langList);
  		if ('value' in $$props) $$invalidate(0, value = $$props.value);
  		if ('leftShowList' in $$props) $$invalidate(2, leftShowList = $$props.leftShowList);
  		if ('rightShowList' in $$props) $$invalidate(3, rightShowList = $$props.rightShowList);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	return [
  		value,
  		langList,
  		leftShowList,
  		rightShowList,
  		handleLeftClick,
  		handleRightClick,
  		handleChangeLeft,
  		handleChangeRight,
  		handleSwitch,
  		handleClick,
  		formselect0_showList_binding,
  		formselect1_showList_binding
  	];
  }

  class LangSelect extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance$1, create_fragment$1, safe_not_equal, { langList: 1, value: 0 });

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "LangSelect",
  			options,
  			id: create_fragment$1.name
  		});
  	}

  	get langList() {
  		throw new Error("<LangSelect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set langList(value) {
  		throw new Error("<LangSelect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get value() {
  		throw new Error("<LangSelect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set value(value) {
  		throw new Error("<LangSelect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  // by zhangxinxu welcome to visit my personal website http://www.zhangxinxu.com/
  // zxx.drag v1.0 2010-03-23 元素的拖拽实现

  var params = {
    left: 0,
    top: 0,
    currentX: 0,
    currentY: 0,
    flag: false
  };
  //获取相关CSS属性
  var getCss = function (o, key) {
    return o?.currentStyle
      ? o?.currentStyle?.[key]
      : document?.defaultView?.getComputedStyle(o, false)?.[key]
  };

  //拖拽的实现
  var startDrag = function (bar, target, callback) {
    if (getCss(target, 'left') !== 'auto') {
      params.left = getCss(target, 'left');
    }
    if (getCss(target, 'top') !== 'auto') {
      params.top = getCss(target, 'top');
    }
    //o是移动对象
    bar.onmousedown = function (event) {
      params.flag = true;
      if (!event) {
        event = window.event;
        //防止IE文字选中
        bar.onselectstart = function () {
          return false
        };
      }
      var e = event;
      params.currentX = e.clientX;
      params.currentY = e.clientY;
    };
    document.onmouseup = function () {
      params.flag = false;
      if (getCss(target, 'left') !== 'auto') {
        params.left = getCss(target, 'left');
      }
      if (getCss(target, 'top') !== 'auto') {
        params.top = getCss(target, 'top');
      }
    };
    document.onmousemove = function (event) {
      var e = event ? event : window.event;
      if (params.flag) {
        var nowX = e.clientX,
          nowY = e.clientY;
        var disX = nowX - params.currentX,
          disY = nowY - params.currentY;
        target.style.left = parseInt(params.left) + disX + 'px';
        target.style.top = parseInt(params.top) + disY + 'px';

        if (typeof callback == 'function') {
          callback((parseInt(params.left) || 0) + disX, (parseInt(params.top) || 0) + disY);
        }

        if (event.preventDefault) {
          event.preventDefault();
        }
        return false
      }
    };
  };

  /* src/components/main/TranslatePop.svelte generated by Svelte v3.46.2 */

  const { console: console_1 } = globals;
  const file = "src/components/main/TranslatePop.svelte";

  // (76:2) {#if isShow}
  function create_if_block(ctx) {
  	let div6;
  	let div3;
  	let div0;
  	let t0;
  	let div1;
  	let t1;
  	let div2;
  	let span0;
  	let t2;
  	let span1;
  	let t3;
  	let div4;
  	let langselect;
  	let t4;
  	let div5;
  	let transtextarea;
  	let updating_sourceText;
  	let updating_transService;
  	let updating_transType;
  	let div6_style_value;
  	let current;
  	let mounted;
  	let dispose;
  	let langselect_props = {};
  	langselect = new LangSelect({ props: langselect_props, $$inline: true });
  	/*langselect_binding*/ ctx[11](langselect);
  	langselect.$on("handleChange", /*handleLangChange*/ ctx[10]);

  	function transtextarea_sourceText_binding(value) {
  		/*transtextarea_sourceText_binding*/ ctx[12](value);
  	}

  	function transtextarea_transService_binding(value) {
  		/*transtextarea_transService_binding*/ ctx[13](value);
  	}

  	function transtextarea_transType_binding(value) {
  		/*transtextarea_transType_binding*/ ctx[14](value);
  	}

  	let transtextarea_props = {};

  	if (/*sourceText*/ ctx[1] !== void 0) {
  		transtextarea_props.sourceText = /*sourceText*/ ctx[1];
  	}

  	if (/*transService*/ ctx[3] !== void 0) {
  		transtextarea_props.transService = /*transService*/ ctx[3];
  	}

  	if (/*transType*/ ctx[6] !== void 0) {
  		transtextarea_props.transType = /*transType*/ ctx[6];
  	}

  	transtextarea = new TransTextarea({
  			props: transtextarea_props,
  			$$inline: true
  		});

  	binding_callbacks.push(() => bind$1(transtextarea, 'sourceText', transtextarea_sourceText_binding));
  	binding_callbacks.push(() => bind$1(transtextarea, 'transService', transtextarea_transService_binding));
  	binding_callbacks.push(() => bind$1(transtextarea, 'transType', transtextarea_transType_binding));

  	const block = {
  		c: function create() {
  			div6 = element("div");
  			div3 = element("div");
  			div0 = element("div");
  			t0 = space();
  			div1 = element("div");
  			t1 = space();
  			div2 = element("div");
  			span0 = element("span");
  			t2 = space();
  			span1 = element("span");
  			t3 = space();
  			div4 = element("div");
  			create_component(langselect.$$.fragment);
  			t4 = space();
  			div5 = element("div");
  			create_component(transtextarea.$$.fragment);
  			attr_dev(div0, "class", "trans-bar-left flex-between hover-color-orange svelte-1je1rlz");
  			add_location(div0, file, 85, 8, 2112);
  			attr_dev(div1, "id", "trans-bar-middle");
  			attr_dev(div1, "class", "svelte-1je1rlz");
  			add_location(div1, file, 86, 8, 2183);
  			attr_dev(span0, "class", "iconfont icon-push-pin padding-lr-8 hover-color-orange font-size-16 svelte-1je1rlz");
  			toggle_class(span0, "icon-push-is-pin", /*isPin*/ ctx[4]);
  			add_location(span0, file, 88, 10, 2266);
  			attr_dev(span1, "class", "iconfont icon-close hover-color-orange font-size-16 svelte-1je1rlz");
  			add_location(span1, file, 93, 10, 2464);
  			attr_dev(div2, "class", "trans-bar-right flex");
  			add_location(div2, file, 87, 8, 2221);
  			attr_dev(div3, "class", "trans-bar font-size-12 color-main flex-between padding-lr-16 svelte-1je1rlz");
  			add_location(div3, file, 84, 6, 2029);
  			attr_dev(div4, "class", "padding-16 padding-bottom-16");
  			add_location(div4, file, 99, 6, 2624);
  			attr_dev(div5, "class", "padding-lr-16");
  			add_location(div5, file, 102, 6, 2766);
  			attr_dev(div6, "id", "trans-box");
  			attr_dev(div6, "class", "select-trans-pop color-main padding-bottom-16 svelte-1je1rlz");
  			attr_dev(div6, "style", div6_style_value = queryStringify(/*boxStyle*/ ctx[2]));
  			attr_dev(div6, "draggable", "true");
  			toggle_class(div6, "select-trans-pop-pin", /*isPin*/ ctx[4]);
  			add_location(div6, file, 76, 4, 1796);
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, div6, anchor);
  			append_dev(div6, div3);
  			append_dev(div3, div0);
  			append_dev(div3, t0);
  			append_dev(div3, div1);
  			append_dev(div3, t1);
  			append_dev(div3, div2);
  			append_dev(div2, span0);
  			append_dev(div2, t2);
  			append_dev(div2, span1);
  			append_dev(div6, t3);
  			append_dev(div6, div4);
  			mount_component(langselect, div4, null);
  			append_dev(div6, t4);
  			append_dev(div6, div5);
  			mount_component(transtextarea, div5, null);
  			current = true;

  			if (!mounted) {
  				dispose = [
  					listen_dev(span0, "click", /*handlePinClick*/ ctx[7], false, false, false),
  					listen_dev(span1, "click", /*handleClose*/ ctx[8], false, false, false),
  					listen_dev(div6, "click", /*handleBoxClick*/ ctx[9], false, false, false)
  				];

  				mounted = true;
  			}
  		},
  		p: function update(ctx, dirty) {
  			if (dirty & /*isPin*/ 16) {
  				toggle_class(span0, "icon-push-is-pin", /*isPin*/ ctx[4]);
  			}

  			const langselect_changes = {};
  			langselect.$set(langselect_changes);
  			const transtextarea_changes = {};

  			if (!updating_sourceText && dirty & /*sourceText*/ 2) {
  				updating_sourceText = true;
  				transtextarea_changes.sourceText = /*sourceText*/ ctx[1];
  				add_flush_callback(() => updating_sourceText = false);
  			}

  			if (!updating_transService && dirty & /*transService*/ 8) {
  				updating_transService = true;
  				transtextarea_changes.transService = /*transService*/ ctx[3];
  				add_flush_callback(() => updating_transService = false);
  			}

  			if (!updating_transType && dirty & /*transType*/ 64) {
  				updating_transType = true;
  				transtextarea_changes.transType = /*transType*/ ctx[6];
  				add_flush_callback(() => updating_transType = false);
  			}

  			transtextarea.$set(transtextarea_changes);

  			if (!current || dirty & /*boxStyle*/ 4 && div6_style_value !== (div6_style_value = queryStringify(/*boxStyle*/ ctx[2]))) {
  				attr_dev(div6, "style", div6_style_value);
  			}

  			if (dirty & /*isPin*/ 16) {
  				toggle_class(div6, "select-trans-pop-pin", /*isPin*/ ctx[4]);
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(langselect.$$.fragment, local);
  			transition_in(transtextarea.$$.fragment, local);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(langselect.$$.fragment, local);
  			transition_out(transtextarea.$$.fragment, local);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(div6);
  			/*langselect_binding*/ ctx[11](null);
  			destroy_component(langselect);
  			destroy_component(transtextarea);
  			mounted = false;
  			run_all(dispose);
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_if_block.name,
  		type: "if",
  		source: "(76:2) {#if isShow}",
  		ctx
  	});

  	return block;
  }

  function create_fragment(ctx) {
  	let main;
  	let current;
  	let if_block = /*isShow*/ ctx[0] && create_if_block(ctx);

  	const block = {
  		c: function create() {
  			main = element("main");
  			if (if_block) if_block.c();
  			add_location(main, file, 74, 0, 1770);
  		},
  		l: function claim(nodes) {
  			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		},
  		m: function mount(target, anchor) {
  			insert_dev(target, main, anchor);
  			if (if_block) if_block.m(main, null);
  			current = true;
  		},
  		p: function update(ctx, [dirty]) {
  			if (/*isShow*/ ctx[0]) {
  				if (if_block) {
  					if_block.p(ctx, dirty);

  					if (dirty & /*isShow*/ 1) {
  						transition_in(if_block, 1);
  					}
  				} else {
  					if_block = create_if_block(ctx);
  					if_block.c();
  					transition_in(if_block, 1);
  					if_block.m(main, null);
  				}
  			} else if (if_block) {
  				group_outros();

  				transition_out(if_block, 1, 1, () => {
  					if_block = null;
  				});

  				check_outros();
  			}
  		},
  		i: function intro(local) {
  			if (current) return;
  			transition_in(if_block);
  			current = true;
  		},
  		o: function outro(local) {
  			transition_out(if_block);
  			current = false;
  		},
  		d: function destroy(detaching) {
  			if (detaching) detach_dev(main);
  			if (if_block) if_block.d();
  		}
  	};

  	dispatch_dev("SvelteRegisterBlock", {
  		block,
  		id: create_fragment.name,
  		type: "component",
  		source: "",
  		ctx
  	});

  	return block;
  }

  function instance($$self, $$props, $$invalidate) {
  	let { $$slots: slots = {}, $$scope } = $$props;
  	validate_slots('TranslatePop', slots, []);
  	let { isShow = true } = $$props;
  	let { sourceText = "" } = $$props;

  	let { boxStyle = {
  		left: "0px",
  		right: "0px",
  		position: "absolute"
  	} } = $$props;

  	let transService = "caiyun"; // 使用的翻译服务
  	let isPin = false;
  	let selectCom = null; // LangSelect组件实例
  	let transType = "en2zh"; // 语言

  	// 图钉icon点击事件
  	function handlePinClick() {
  		console.log("handlePinClick");
  		$$invalidate(4, isPin = !isPin);

  		if (isPin) {
  			console.log("-----固定");
  			$$invalidate(2, boxStyle = { ...boxStyle, position: "fixed" });
  		}
  	}

  	// 关闭icon点击事件
  	function handleClose() {
  		initCom();
  	}

  	// 组件点击事件
  	function handleBoxClick() {
  		selectCom.$$.ctx[9]();
  	}

  	onMount(() => {
  		
  	});

  	function handleLangChange({ detail }) {
  		$$invalidate(6, transType = detail.join("2"));
  	}

  	// 组件初始化
  	function initCom() {
  		$$invalidate(0, isShow = false);
  		$$invalidate(4, isPin = false);

  		$$invalidate(2, boxStyle = {
  			left: "0px",
  			right: "0px",
  			position: "absolute"
  		});

  		$$invalidate(1, sourceText = "");
  		$$invalidate(6, transType = "en2zh");
  	}

  	const writable_props = ['isShow', 'sourceText', 'boxStyle'];

  	Object.keys($$props).forEach(key => {
  		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<TranslatePop> was created with unknown prop '${key}'`);
  	});

  	function langselect_binding($$value) {
  		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
  			selectCom = $$value;
  			$$invalidate(5, selectCom);
  		});
  	}

  	function transtextarea_sourceText_binding(value) {
  		sourceText = value;
  		$$invalidate(1, sourceText);
  	}

  	function transtextarea_transService_binding(value) {
  		transService = value;
  		$$invalidate(3, transService);
  	}

  	function transtextarea_transType_binding(value) {
  		transType = value;
  		$$invalidate(6, transType);
  	}

  	$$self.$$set = $$props => {
  		if ('isShow' in $$props) $$invalidate(0, isShow = $$props.isShow);
  		if ('sourceText' in $$props) $$invalidate(1, sourceText = $$props.sourceText);
  		if ('boxStyle' in $$props) $$invalidate(2, boxStyle = $$props.boxStyle);
  	};

  	$$self.$capture_state = () => ({
  		onMount,
  		afterUpdate,
  		TransTextarea,
  		LangSelect,
  		startDrag,
  		queryStringify,
  		isShow,
  		sourceText,
  		boxStyle,
  		transService,
  		isPin,
  		selectCom,
  		transType,
  		handlePinClick,
  		handleClose,
  		handleBoxClick,
  		handleLangChange,
  		initCom
  	});

  	$$self.$inject_state = $$props => {
  		if ('isShow' in $$props) $$invalidate(0, isShow = $$props.isShow);
  		if ('sourceText' in $$props) $$invalidate(1, sourceText = $$props.sourceText);
  		if ('boxStyle' in $$props) $$invalidate(2, boxStyle = $$props.boxStyle);
  		if ('transService' in $$props) $$invalidate(3, transService = $$props.transService);
  		if ('isPin' in $$props) $$invalidate(4, isPin = $$props.isPin);
  		if ('selectCom' in $$props) $$invalidate(5, selectCom = $$props.selectCom);
  		if ('transType' in $$props) $$invalidate(6, transType = $$props.transType);
  	};

  	if ($$props && "$$inject" in $$props) {
  		$$self.$inject_state($$props.$$inject);
  	}

  	$$self.$$.update = () => {
  		if ($$self.$$.dirty & /*isShow*/ 1) {
  			(() => {
  				if (isShow) {
  					console.log({ isShow });

  					setTimeout(() => {
  						const targetDom = document.getElementById("trans-box");
  						const dragDom = document.getElementById("trans-bar-middle");

  						startDrag(dragDom, targetDom, (x, y) => {
  							$$invalidate(2, boxStyle = {
  								left: x + "px",
  								top: y + "px",
  								position: "fixed"
  							});

  							console.log(x, y, "----");
  						});
  					});
  				}
  			})();
  		}
  	};

  	return [
  		isShow,
  		sourceText,
  		boxStyle,
  		transService,
  		isPin,
  		selectCom,
  		transType,
  		handlePinClick,
  		handleClose,
  		handleBoxClick,
  		handleLangChange,
  		langselect_binding,
  		transtextarea_sourceText_binding,
  		transtextarea_transService_binding,
  		transtextarea_transType_binding
  	];
  }

  class TranslatePop extends SvelteComponentDev {
  	constructor(options) {
  		super(options);
  		init(this, options, instance, create_fragment, safe_not_equal, { isShow: 0, sourceText: 1, boxStyle: 2 });

  		dispatch_dev("SvelteRegisterComponent", {
  			component: this,
  			tagName: "TranslatePop",
  			options,
  			id: create_fragment.name
  		});
  	}

  	get isShow() {
  		throw new Error("<TranslatePop>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set isShow(value) {
  		throw new Error("<TranslatePop>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get sourceText() {
  		throw new Error("<TranslatePop>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set sourceText(value) {
  		throw new Error("<TranslatePop>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	get boxStyle() {
  		throw new Error("<TranslatePop>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}

  	set boxStyle(value) {
  		throw new Error("<TranslatePop>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
  	}
  }

  console.log("我是content.js");
  const app = new TranslatePop({
    target: document.body,
    props: {
      boxStyle: {
        left: "0px",
        right: "0px",
        position: "absolute",
      },
      sourceText: "",
      isShow: false,
    },
  });

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

  return app;

})();
