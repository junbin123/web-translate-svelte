<script>
  import { createEventDispatcher } from 'svelte'
  import { onMount } from 'svelte'
  const dispatch = createEventDispatcher()
  export let value = 'en'
  export let options = [
    // 语言列表
    {
      name: '中文',
      value: 'zh'
    },
    {
      name: '英语',
      value: 'en'
    },
    {
      name: '日语',
      value: 'ja'
    }
  ]
  $: selectName = options.find(item => item.value === value).name

  export let showList = false // 是否显示下拉框

  // 选择语言点击事件
  function handleSelect({ target }) {
    showList = false
    const { index } = target.dataset
    const item = options[Number(index)]
    value = item.value
    dispatch('handleChange', item)
  }
  // 下拉框点击事件
  function handleClick() {
    dispatch('handleClick')
    showList = !showList
  }
</script>

<main>
  <div
    id="select-box"
    class="color-main transition-300 bg-color-light-grey flex-between round-4"
    on:click|stopPropagation={handleClick}
  >
    <div class="font-size-14">{selectName}</div>
    <i class="transition-300 iconfont icon-arrow-down" class:arrow-up={showList} />
  </div>
  <div
    class="select-container round-4 bg-color-light-grey padding-tb-8 transition-300"
    class:select-spread={showList}
  >
    {#each options as item, index}
      <div on:click={handleSelect} data-index={index} class="select-item font-size-14 padding-lr-8">
        {item.name}
      </div>
    {/each}
  </div>
</main>

<style lang="scss" scoped>
  main {
    position: relative;
  }
  #select-box {
    width: 110px;
    height: 28px;
    line-height: 28px;
    padding-left: 8px;
    padding-right: 2px;
    box-shadow: inset 0 0 0 1px #9bb1c8;
    &:hover {
      box-shadow: inset 0 0 0 1px #517fa4;
    }
  }

  .select-container {
    width: 100%;
    position: absolute;
    overflow: hidden;
    // overflow-y: scroll;
    height: 110px;
    margin-top: 4px;
    box-shadow: 4px 4px 16px 0 rgba(0, 0, 0, 0.1), inset 0 0 0 1px #95a0b0;
    transform-origin: left top;
    transform: scaleY(0);
    transition: all 0.2s ease-in-out;
    .select-item {
      &:hover {
        background: #9bb1c8;
      }
      height: 28px;
      line-height: 28px;
    }
  }
  .select-spread {
    transform: scaleY(1);
  }

  .arrow-up {
    transform: rotate(180deg);
  }
  /* 滚动条 */
  // ::-webkit-scrollbar-thumb:horizontal {
  //   /*水平滚动条的样式*/
  //   width: 5px;
  //   // background-color: #cccccc;
  //   background: #e9ecf0;
  //   -webkit-border-radius: 6px;
  // }
  // ::-webkit-scrollbar-track-piece {
  //   // background-color: #fff; /*滚动条的背景颜色*/
  //   // background: #e9ecf0;
  //   -webkit-border-radius: 0; /*滚动条的圆角宽度*/
  // }
  // ::-webkit-scrollbar {
  //   width: 8px; /*滚动条的宽度*/
  //   height: 8px; /*滚动条的高度*/
  // }
  // ::-webkit-scrollbar-thumb:vertical {
  //   /*垂直滚动条的样式*/
  //   height: 40px;
  //   background-color: #999;
  //   -webkit-border-radius: 4px;
  //   outline-offset: -2px;
  // }
  // ::-webkit-scrollbar-thumb:hover {
  //   /*滚动条的hover样式*/
  //   height: 40px;
  //   // background-color: #9f9f9f;
  //   -webkit-border-radius: 4px;
  // }
</style>
