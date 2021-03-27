<script>
  import TransTextarea from '../Basics/TransTextarea.svelte'
  import LangSelect from '../Basics/LangSelect.svelte'
  import { getImgUrl } from '../../utils/common.js'
  let selectCom = null // LangSelect组件实例
  function handleLangChange({ detail }) {
    console.log(detail)
  }

  function handleClick() {
    selectCom.$$.ctx[9]()
  }
  function handleTrans() {}
</script>

<main on:click={handleClick}>
  <div class="header flex-between padding-16">
    <img class="header-left" src={getImgUrl('./images/common/logo-header.png')} alt="logo" />
    <div
      class="header-right font-size-14 flex-between color-99 hover-color-main transition-300 cursor-pointer"
    >
      <i class="iconfont icon-setting" />
      <span class="trans-bar-left-name">设置</span>
      <i class="iconfont icon-arrow-right" />
    </div>
  </div>
  <div class="padding-16 padding-bottom-16">
    <LangSelect on:handleChange={handleLangChange} bind:this={selectCom} />
  </div>
  <div class="padding-lr-16">
    <TransTextarea />
  </div>
  <div class="btn-box padding-lr-16 cursor-pointer padding-bottom-16">
    <div class="btn color-white flex-center" on:click={handleTrans}>翻译当前页面</div>
  </div>
</main>

<style lang="scss" scoped>
  main {
    width: 280px;
    min-height: 330px;
    background: white;
    .header {
      &-left {
        width: 108px;
        height: 30px;
      }
      &-right {
      }
    }
    .btn-box {
      padding-top: 32px;
      .btn {
        height: 42px;
        background-image: linear-gradient(-44deg, #243949 0%, #517fa4 100%);
        border-radius: 4px;
        &:hover {
          box-shadow: 0 0px 20px 0 rgba(0, 0, 0, 0.2);
        }
      }
    }
  }
</style>
