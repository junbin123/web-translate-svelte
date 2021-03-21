<script>
  import { text_area_resize } from '../../utils/autoresize_textarea'
  import { debounce, clearText } from '../../utils/common'
  import { transServiceDict } from '../../static/trans'
  import Toast from '../Basics/Toast.svelte'
  import ClipboardJS from '../../utils/clipboard.js'
  import { onMount } from 'svelte'
  export let sourceText = ''
  export let transService = 'google'
  export let transType = 'en2zh'

  let preSourceText = sourceText // 保留上一个翻译文本，差量翻译
  let transLoading = false // 是否处于翻译请求中
  let targetText = ''

  $: if (transLoading) {
    targetText += '...'
    console.log('变', transLoading)
  } else if (targetText.slice(-3) === '...') {
    targetText = targetText.slice(0, -3)
    console.log('不变', transLoading)
  }

  // 监听sourceText变化
  $: if (clearText(sourceText)) {
    const list = getTransList(sourceText)
    console.log('监听sourceText', sourceText, list)
    // TODO:发现变化，请求翻译接口
  } else {
    sourceText = ''
  }

  // 初始化
  onMount(() => {})

  // 清空事件
  function handleClear() {
    sourceText = ''
    targetText = ''
    transLoading = false
  }
  // 输入文本事件
  function handleInput({ target }) {
    sourceText = target.value
    transLoading = true
  }
  // 将字符串转化为列表(以换行分割)
  function getTransList(str) {
    const list = str
      .split(/[\r\n]/)
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
      class="source-input padding-8 padding-tb-16"
      value={sourceText}
      use:text_area_resize
      placeholder="输入要翻译的内容"
      on:input={debounce(handleInput, 600)}
    />
    {#if sourceText}
      <div class="source-icon"><span class="iconfont icon-close transition-300 font-size-16 color-99 hover-color-main" on:click={handleClear} /></div>
    {/if}
  </div>
  <div class="target">
    <div class="target-text padding-8 color-main">{targetText}</div>
    <div class="target-footer flex-between padding-8">
      <div class="font-size-12 color-99 transition-300 flex cursor-pointer hover-color-main" on:click={handleOpenWeb}>
        <img src={transServiceDict[transService].src} width="16" height="16" alt={transService} />
        <span>{transServiceDict[transService].name}</span>
      </div>
      <div class="cursor-pointer">
        <span class="iconfont icon-copy padding-lr-8 hover-color-main color-99 transition-300 font-size-16" />
        <span class="iconfont icon-open-web hover-color-main color-99 transition-300 font-size-16" on:click={handleOpenWeb} />
      </div>
    </div>
  </div>
</main>

<style lang="scss" scoped>
  main {
    width: 100%;
    background: #f5f7f8;
    min-height: 120px;
    overflow: hidden;
    .source {
      min-height: 60px;
      width: 100%;
      &-input {
        width: calc(100% - 26px);
        min-height: 60px;
        background: #f5f7f8;
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
      background: #ebedf0;
      display: flex;
      flex-direction: column;
      .target-text {
        flex: 1;
      }
      .target-footer {
        height: 30px;
      }
    }
  }
</style>
