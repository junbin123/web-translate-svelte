<script>
  import { onMount } from 'svelte'
  import FormSelect from '../FormSelect.svelte'
  import Toast from '../Basics/Toast.svelte'
  import ClipboardJS from '../../utils/clipboard.js'
  import { startDrag } from '../../utils/drag.js' // 拖拽方法
  import { queryStringify } from '../../utils/common.js' // 拖拽方法
  import { baiduOptions, caiyunOptions, deeplOptions, googleOptions, youdaoOptions } from '../../static/options/index' // 翻译语言下拉框数据
  import { transServiceDict } from '../../static/trans'

  const clipboard = new ClipboardJS('.icon-copy', {
    text: () => targetText
  })
  clipboard.on('success', e => {
    window.showToast('已复制译文')
  })

  const langList = caiyunOptions
  let sourceLang = 'en'
  let targetLang = 'zh'
  let leftSelect
  let rightSelect
  let leftShowList = false
  let rightShowList = false

  let transService = 'google' // 使用的翻译服务

  let sourceText = '要翻译的原文'
  let targetText = '翻译好赛盖饭的'

  let isPin = false
  let isShow = true

  let boxStyle = {}
  let boxLeft = ''
  let boxTop = ''

  // 图钉icon点击事件
  function handlePinClick() {
    isPin = !isPin
    if (isPin) {
      boxStyle = {
        position: 'fixed',
        left: boxLeft,
        top: boxTop
      }
    }
  }
  // 关闭icon点击事件
  function handleClose() {
    isShow = false
  }
  // 复制点击事件
  function handleCopy() {}
  // 跳转网页点击
  function handleOpenWeb() {
    window.open('http://fanyi.youdao.com/', '_blank')
  }
  // 左边选择器点击
  function handleLeftClick(e) {
    rightShowList = false
  }
  // 右边选择器点击
  function handleRightClick(e) {
    leftShowList = false
  }
  // 翻译语言切换
  function handleSelectChange() {
    console.log({ sourceLang, targetLang })
  }
  // 组件点击事件
  function handleBoxClick() {
    leftShowList = false
    rightShowList = false
  }

  // 拖拽方法处理
  onMount(() => {
    const targetDom = document.getElementById('trans-box')
    const dragDom = document.getElementById('trans-bar-middle')
    startDrag(dragDom, targetDom, (x, y) => {
      boxLeft = x + 'px'
      boxTop = y + 'px'
      console.log(x, y, '00')
    })
  })
</script>

<main>
  <Toast />
  {#if isShow}
    <div
      id="trans-box"
      class="select-trans-pop color-main"
      class:select-trans-pop-pin={isPin}
      style={queryStringify(boxStyle)}
      on:click={handleBoxClick}
      draggable="true"
    >
      <div class="trans-bar font-size-12 color-main flex-between padding-lr-16">
        <div class="trans-bar-left flex-between hover-color-orange">
          <i class="iconfont icon-setting font-size-16" />
          <span class="trans-bar-left-name">设置</span>
          <i class="iconfont icon-arrow-right" />
        </div>
        <div id="trans-bar-middle" />
        <div class="trans-bar-right flex">
          <span class="iconfont icon-push-pin padding-lr-8 hover-color-orange" class:icon-push-is-pin={isPin} on:click={handlePinClick} />
          <span class="iconfont icon-close hover-color-orange" on:click={handleClose} />
        </div>
      </div>
      <div class="trans-lang flex-between padding-lr-16">
        <FormSelect
          on:handleClick={handleLeftClick}
          options={langList}
          on:handleChange={handleSelectChange}
          bind:value={sourceLang}
          bind:this={leftSelect}
          bind:showList={leftShowList}
        />
        <i class="trans-lang-middle iconfont icon-arrow-compare flex-center hover-color-orange" />
        <FormSelect
          on:handleClick={handleRightClick}
          options={langList}
          on:handleChange={handleSelectChange}
          bind:value={targetLang}
          bind:this={rightSelect}
          bind:showList={rightShowList}
        />
      </div>
      <div class="padding-lr-16 padding-tb-8">
        <span class="color-99 font-size-10 leading-8">原文</span>
        <div class="font-size-14 color-33">{sourceText}</div>
      </div>
      <div class="trans-target padding-lr-16">
        <span class="color-99 font-size-10 leading-8">译文</span>
        <div class="font-size-14">{targetText}</div>
        <div class="trans-footer flex-between">
          <div class="font-size-12 color-66 transition-300 flex" on:click={handleOpenWeb}>
            <img src={transServiceDict[transService].src} width="16" height="16" alt={transService} />
            <span>{transServiceDict[transService].name}</span>
          </div>
          <div>
            <span class="iconfont icon-copy padding-lr-8 hover-color-orange" on:click={handleCopy} />
            <span class="iconfont icon-open-web hover-color-orange" on:click={handleOpenWeb} />
          </div>
        </div>
      </div>
    </div>
  {/if}
</main>

<style lang="scss" scoped>
  .select-trans-pop-pin {
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2) !important;
    background: rgba(255, 255, 255, 0.5) !important;
  }
  .select-trans-pop {
    width: 320px;
    backdrop-filter: blur(40px);
    border-radius: 4px;
    cursor: pointer;
    position: absolute;
    overflow: hidden;
    box-sizing: border-box;
    box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.1);
    background: rgba(250, 250, 250, 0.6);
    left: 0;
    top: 0;
    z-index: 999;
    .trans-bar {
      height: 36px;
      width: 100%;
      .trans-bar-left {
        line-height: 36px;
        .trans-bar-left-name {
          margin-right: 4px;
          margin-left: 2px;
        }
      }
      #trans-bar-middle {
        height: 100%;
        flex: 1;
        cursor: move;
      }
      .trans-bar-right {
        .icon-push-pin {
          transform: rotate(90deg);
        }
        .icon-close:hover {
          transform: rotate(-180deg);
        }
        .icon-push-is-pin {
          transform: rotate(45deg);
          color: #ff6239;
        }
      }
    }
    .trans-lang {
      width: 280px;
    }
    .trans-target {
      background: rgba(255, 255, 255, 0.4);
    }
    .trans-footer {
      margin-top: 8px;
      height: 30px;
    }
  }
</style>
