<script>
  import TransTextarea from '../Basics/TransTextarea.svelte'
  import LangSelect from '../Basics/LangSelect.svelte'
  import { getImgUrl, getBrowserInfo } from '../../utils/common.js'
  import StatApi from '../../request/stat' // 数据统计
  const statApi = new StatApi()
  let selectCom = null // LangSelect组件实例
  let sourceText = '' // 要翻译的文本
  let transService = 'caiyun' // 翻译服务
  let transType = 'en2zh' // 语言
  function handleLangChange({ detail }) {
    transType = detail.join('2')
  }

  function handleClick() {
    selectCom.$$.ctx[9]()
  }
  function handleTrans() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      let message = { transType }
      chrome.tabs.sendMessage(tabs[0].id, message, res => {
        console.log('页面的数据', res)
        const { canTrans = false, currentUrl = '' } = res
        if (canTrans && currentUrl) {
          const data = {
            url: currentUrl,
            browserInfo: getBrowserInfo(),
            createTime: new Date().getTime()
          }
          statApi.transUrl(data)
        }
        setTimeout(() => {
          window.close()
        }, 100)
      })
    })
  }
</script>

<main on:click={handleClick} class="web-translate-svelte-popup">
  <div class="header flex-between padding-16">
    <img class="header-left" src={getImgUrl('./images/common/logo-header.png')} alt="logo" />
    <div
      class="header-right font-size-14 flex-between color-99 hover-color-main transition-300 cursor-pointer"
    >
      <!-- TODO:先注释，没时间弄 -->
      <!-- <i class="iconfont icon-setting" />
      <span class="trans-bar-left-name">设置</span>
      <i class="iconfont icon-arrow-right" /> -->
    </div>
  </div>
  <div class="padding-16 padding-bottom-16">
    <LangSelect on:handleChange={handleLangChange} bind:this={selectCom} />
  </div>
  <div class="padding-lr-16">
    <TransTextarea bind:sourceText bind:transService bind:transType />
  </div>
  <div class="btn-box padding-lr-16 cursor-pointer padding-bottom-16 font-size-16 font-weight-bold">
    <div class="btn color-white flex-center" on:click={handleTrans}>翻译当前页面</div>
  </div>
</main>

<style lang="scss" scoped>
  .web-translate-svelte-popup {
    width: 280px;
    height: 330px;
    background: #fafafa;
    .header {
      &-left {
        width: 108px;
        height: 30px;
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
