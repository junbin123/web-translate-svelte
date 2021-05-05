<script>
  import { text_area_resize } from '../../utils/autoresize_textarea'
  import { debounce, clearText } from '../../utils/common'
  import { transServiceDict } from '../../static/trans'
  import Toast from '../Basics/Toast.svelte'
  import ClipboardJS from '../../utils/clipboard.js'
  import { onMount } from 'svelte'
  import { caiyunApi } from '../../request/translate/caiyun.js'

  export let sourceText = ''
  export let transService = 'caiyun'
  export let transType = 'en2zh'

  let sourceTextPre = '' // 保留上一个翻译文本，差量翻译
  let targetText = ''
  let dotLoading = false // 是否显示...

  $: sourceTextTemp = clearText(sourceText) + transType // 代理sourceText用于监听

  // 监听sourceText变化，请求接口
  $: watchSourceText(sourceTextTemp)

  function watchSourceText(str) {
    console.log('watchSourceText', '--------')
    if (clearText(sourceText)) {
      if (clearText(sourceText) !== clearText(sourceTextPre)) {
        const sourceList = getTransList(sourceText)
        const preSourceList = getTransList(sourceTextPre)
        const preTargetList = getTransList(targetText)
        diffTrans({ sourceList, preSourceList, preTargetList, transType }).then(res => {
          dotLoading = false
          targetText = res.join('<br>')
        })
      }
    } else {
      handleClear()
    }
  }

  // 请求翻译接口
  async function requestTrans({ source, transType }) {
    try {
      const res = await caiyunApi({ source, transType })
      return res.target
    } catch (err) {
      window.showToast('糟糕！翻译错误')
      console.log(err, '错误')
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
      const res = await requestTrans({ source: sourceList, transType })
      return res
    }
    const indexList = [] // sourceList未翻译下标列表
    const diffSourceList = [] // 需要翻译的列表,和indexList对应
    const targetList = new Array(sourceList.length).fill('') // 翻译好的列表
    sourceList.forEach((item, index) => {
      const searchIndex = preSourceList.findIndex(item2 => item2 === item)
      if (searchIndex === -1) {
        // 没找到,需要翻译
        indexList.push(index)
        diffSourceList.push(item)
      } else {
        // 找到,压入targetList
        targetList[index] = preTargetList[searchIndex]
      }
    })
    const res = await requestTrans({ source: diffSourceList, transType }) // 和indexList对应
    indexList.forEach((item, index) => {
      targetList[item] = res[index]
    })
    return targetList
  }

  // 初始化
  onMount(() => {})

  // 清空事件
  function handleClear() {
    sourceText = ''
    targetText = ''
    dotLoading = false
  }
  // 输入文本事件
  function handleInput({ target }) {
    sourceTextPre = sourceText
    sourceText = target.value
    dotLoading = !!clearText(sourceText)
  }
  // 将字符串转化为列表(以换行分割)
  function getTransList(str) {
    const list = str
      .split(/\r\n|<br>|\n+/)
      .filter(item => item.replace(/\s+/g, ''))
      .map(item => item.trim().replace(/\s+/g, ' '))
    return list
  }

  // 打开翻译网页
  function handleOpenWeb() {
    const url = transServiceDict[transService].getTransUrl({ source: sourceText, transType })
    window.open(url, '_blank')
  }

  const clipboard = new ClipboardJS('.icon-copy', {
    text: () => targetText
  })
  clipboard.on('success', e => {
    window.showToast('复制成功')
  })
</script>

<main class="round-4 font-size-14">
  <Toast />
  <div class="source flex">
    <textarea
      class="source-input padding-8 padding-tb-8"
      value={sourceText}
      use:text_area_resize
      placeholder="输入要翻译的内容"
      on:input={debounce(handleInput, 600)}
    />
    {#if sourceText}
      <div class="source-icon">
        <span
          class="iconfont icon-close transition-300 font-size-16 color-99 hover-color-main"
          on:click={handleClear}
        />
      </div>
    {/if}
  </div>
  <div class="target">
    <div class="target-text padding-8 color-main">
      {@html targetText}
      {#if dotLoading}
        <span>...</span>
      {/if}
    </div>
    <div class="target-footer flex-between padding-8">
      <div
        class="font-size-12 color-99 transition-300 flex cursor-pointer hover-color-main"
        on:click={handleOpenWeb}
        style="height:30px;line-height:30px"
      >
        <img
          src={transServiceDict[transService].src}
          width="16"
          height="16"
          alt={transService}
          style="margin-top:7px"
        />
        <span>{transServiceDict[transService].name}</span>
      </div>
      <div class="cursor-pointer">
        <span
          class="iconfont icon-copy padding-lr-8 hover-color-main color-99 transition-300 font-size-16"
        />
        <span
          class="iconfont icon-open-web hover-color-main color-99 transition-300 font-size-16"
          on:click={handleOpenWeb}
        />
      </div>
    </div>
  </div>
</main>

<style lang="scss" scoped>
  main {
    width: 100%;
    // background: #f5f7f8;
    background: #e9ecf0;
    min-height: 120px;
    overflow: hidden;
    .source {
      min-height: 60px;
      width: 100%;
      &-input {
        width: calc(100% - 26px);
        min-height: 60px;
        background: #e9ecf0;
        border: none;
        outline: none;
        resize: none;
        color: #333;
        font-size: 14px;
        border-radius: 0;
        box-sizing: border-box;
        margin: 0;
      }
      &-icon {
        width: 26px;
        text-align: center;
        padding-top: 6px;
        height: 100%;
      }
    }
    .target {
      min-height: 60px;
      width: 100%;
      background: #f5f6f7;
      .target-text {
        min-height: 30px;
        word-break: break-all;
      }
      .target-footer {
        height: 30px;
      }
    }
  }

  // textarea {
  //   border: none;
  //   outline: none;
  //   resize: none;
  //   background: white;
  //   padding: 0;
  //   margin: 0;
  //   color: #333;
  //   font-size: 14px;
  //   border-radius: 0;
  //   box-sizing: border-box;
  // }
</style>
