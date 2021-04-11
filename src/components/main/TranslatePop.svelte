<script>
  import { onMount, afterUpdate } from 'svelte'
  import TransTextarea from '../Basics/TransTextarea.svelte'
  import LangSelect from '../Basics/LangSelect.svelte'
  import { startDrag } from '../../utils/drag.js' // 拖拽方法
  import { queryStringify } from '../../utils/common.js' // 拖拽方法
  export let isShow = true // 是否显示
  export let sourceText = '' // 要翻译的文本
  export let boxStyle = {
    left: '0px',
    right: '0px',
    position: 'absolute'
  }
  let transService = 'caiyun' // 使用的翻译服务
  let isPin = false
  let selectCom = null // LangSelect组件实例
  let transType = 'en2zh' // 语言
  $: (() => {
    if (isShow) {
      console.log({ isShow })
      setTimeout(() => {
        const targetDom = document.getElementById('trans-box')
        const dragDom = document.getElementById('trans-bar-middle')
        startDrag(dragDom, targetDom, (x, y) => {
          boxStyle = {
            left: x + 'px',
            top: y + 'px',
            position: 'fixed'
          }
          console.log(x, y, '----')
        })
      })
    }
  })()

  // afterUpdate(() => {
  //   boxStyle = {
  //     ...boxStyle,
  //     left,
  //     top
  //   }
  // })

  // 图钉icon点击事件
  function handlePinClick() {
    console.log('handlePinClick')
    isPin = !isPin
    if (isPin) {
      console.log('-----固定')
      boxStyle = {
        ...boxStyle,
        position: 'fixed'
      }
    }
  }
  // 关闭icon点击事件
  function handleClose() {
    isShow = false
    isPin = false
  }
  // 组件点击事件
  function handleBoxClick() {
    selectCom.$$.ctx[9]()
  }

  onMount(() => {})
  function handleLangChange({ detail }) {
    transType = detail.join('2')
  }
</script>

<main>
  {#if isShow}
    <div
      id="trans-box"
      class="select-trans-pop color-main padding-bottom-16"
      class:select-trans-pop-pin={isPin}
      style={queryStringify(boxStyle)}
      on:click={handleBoxClick}
      draggable="true"
    >
      <div class="trans-bar font-size-12 color-main flex-between padding-lr-16">
        <div class="trans-bar-left flex-between hover-color-orange">
          <i class="iconfont icon-setting font-size-16" />
          <span class="trans-bar-left-name font-size-14">设置</span>
          <i class="iconfont icon-arrow-right font-size-16" />
        </div>
        <div id="trans-bar-middle" />
        <div class="trans-bar-right flex">
          <span
            class="iconfont icon-push-pin padding-lr-8 hover-color-orange font-size-16"
            class:icon-push-is-pin={isPin}
            on:click={handlePinClick}
          />
          <span
            class="iconfont icon-close hover-color-orange font-size-16"
            on:click={handleClose}
          />
        </div>
      </div>
      <div class="padding-16 padding-bottom-16">
        <LangSelect on:handleChange={handleLangChange} bind:this={selectCom} />
      </div>
      <div class="padding-lr-16">
        <TransTextarea bind:sourceText bind:transService bind:transType />
      </div>
    </div>
  {/if}
</main>

<style lang="scss" scoped>
  .select-trans-pop-pin {
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2) !important;
    background: rgba(255, 255, 255, 0.7) !important;
  }
  .select-trans-pop {
    width: 320px;
    backdrop-filter: blur(40px);
    border-radius: 4px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
    box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 1);
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
  }
</style>
