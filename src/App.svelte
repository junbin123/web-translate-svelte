<script>
  import Popup from './components/main/Popup.svelte'
  import TranlatePop from './components/main/TranslatePop.svelte'
  // import LangSelect from './components/LangSelect.svelte'
  // import { targetLang, sourceLang } from './store/index.js'
  // import { onMount } from 'svelte'
  // import StatApi from './api/statApi' // 数据统计
  // import { getBrowserInfo } from './utils/index' // 常用方法
  // const statApi = new StatApi()

  // let leftLangSelect
  // let rightLangSelect
  // let isDefaultSetting = false // 当前是否为默认选项
  // let defaultSource = 'en' // 默认原始语言
  // let defaultTarget = 'zh' // 默认目标语言
  // let langDict = {
  //   zh: {
  //     name: '中文',
  //     index: 0
  //   },
  //   en: {
  //     name: '英语',
  //     index: 1
  //   },
  //   ja: {
  //     name: '日语',
  //     index: 2
  //   }
  // } // 语言字典
  // let langList = [
  //   // 语言列表
  //   {
  //     name: '中文',
  //     value: 'zh',
  //     index: 0
  //   },
  //   {
  //     name: '英语',
  //     value: 'en',
  //     index: 1
  //   },
  //   {
  //     name: '日语',
  //     value: 'ja',
  //     index: 2
  //   }
  // ]
  // let leftIndex = 1 // 原始语言下标
  // let rightIndex = 0 // 目标语言下标
  // // 设置默认选项
  // function handleSetting() {
  //   isDefaultSetting = !isDefaultSetting
  //   targetLang.set('jj')
  // }
  // // 语言切换事件
  // function handleSwitch() {
  //   const temp = leftIndex
  //   leftIndex = rightIndex
  //   rightIndex = temp
  // }
  // function handleCancel() {
  //   const msg = {
  //     action: 'noTrans'
  //   }
  //   sendMsgToContent(msg).then(res => {
  //     if (res.status === 'done') {
  //       window.close()
  //     }
  //   })
  //   console.log('cancel')
  // }
  // // 发送数据给content的方法
  // // msg 发送给content的数据
  // function sendMsgToContent(msg) {
  //   const promise = new Promise((resolve, reject) => {
  //     chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  //       chrome.tabs.sendMessage(tabs[0].id, msg, res => {
  //         resolve(res)
  //         console.log('来自页面的数据：', res)
  //       })
  //     })
  //   })
  //   return promise
  // }
  // function handleStart() {
  //   console.log('click---')
  //   chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
  //     let message = { source: langList[leftIndex].value, target: langList[rightIndex].value }
  //     chrome.tabs.sendMessage(tabs[0].id, message, res => {
  //       window.close()
  //       console.log('页面的数据', res)
  //       const { canTrans, currentUrl } = res
  //       if (canTrans) {
  //         const data = {
  //           url: currentUrl,
  //           browserInfo: getBrowserInfo(),
  //           createTime: new Date().getTime()
  //         }
  //         statApi.transUrl(data)
  //       }
  //     })
  //   })
  // }
  // function handleLeftChange(event) {
  //   const index = Number(event.detail.index)
  //   console.log(index, rightIndex)
  //   if (index === rightIndex || index === leftIndex) return
  //   leftIndex = index
  // }

  // function handleRightChange(event) {
  //   const index = Number(event.detail.index)
  //   if (index === leftIndex || index === rightIndex) return
  //   rightIndex = index
  // }
  // // 空白区域点击，收起下拉框
  // function handleBlank() {
  //   leftLangSelect.$$.ctx[7]()
  //   rightLangSelect.$$.ctx[7]()
  // }
  // function handleLeftClick() {
  //   rightLangSelect.$$.ctx[7]()
  // }
  // function handleRightClick() {
  //   leftLangSelect.$$.ctx[7]()
  // }
  // onMount(async () => {
  //   sourceLang.subscribe(value => {
  //     defaultSource = value
  //   })

  //   targetLang.subscribe(value => {
  //     defaultTarget = value
  //   })
  // })
</script>

<main>
  <Popup />
  <TranlatePop />
  <!-- <img src="images/logo.png" alt="logo" id="logo-img" />
  <div id="select-box" class="flex-between">
    <LangSelect
      on:handleChange={handleLeftChange}
      on:handleClick={handleLeftClick}
      {langList}
      selectIndex={leftIndex}
      bind:this={leftLangSelect}
      align="left"
    />
    <i class="iconfont icon-arrow-compare font-size-20 color-brand d-active-opacity" on:click={handleSwitch} />
    <LangSelect
      on:handleChange={handleRightChange}
      on:handleClick={handleRightClick}
      {langList}
      selectIndex={rightIndex}
      bind:this={rightLangSelect}
      align="right"
    />
  </div>
  <button class="btn-box btn-one color-white bg-color-brand" on:click={handleStart}>开始翻译</button>
  <button class="btn-box btn-two color-gray bg-color-gray" on:click={handleCancel}>不翻译了</button> -->
</main>

<style lang="scss">
  @import '../styles/iconfont.css';
  @import '../styles/common.css';
  main {
    position: relative;
  }
  /* #logo-img {
    width: 120px;
    height: 40px;
  }
  #select-box {
    width: 260px;
    height: 36px;
    margin-top: 20px;
  }
  .default-box {
    height: 26px;
    line-height: 26px;
    padding: 0 10px;
    font-size: 12px;
    margin-top: 6px;
    display: inline-block;
    border-radius: 13px;
    cursor: default;
    position: absolute;
    right: 20px;
    transition: width 0.3s ease-in-out;
    width: 92px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .btn-box {
    width: 260px;
    height: 42px;
    font-size: 16px;
    text-align: center;
    line-height: 42px;
    border-radius: 21px;
  }
  .btn-one {
    margin-top: 66px;
  }

  .btn-one:hover {
    background-image: linear-gradient(-225deg, #231557 0%, #44107a 29%, #ff1361 67%, #fff800 100%);
    animation: animateGlow 4s ease-in-out infinite;
    background-size: 200% 200%;
    box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.1);
  }
  @keyframes animateGlow {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  .btn-one:active {
    opacity: 0.8;
  }

  .btn-two {
    margin-top: 8px;
  }
  .btn-two:hover {
    background: #ededed;
  }
  .btn-two:active {
    background: #ddd;
  }
  .default-select {
    color: white;
    background: linear-gradient(-45deg, #243949 0%, #517fa4 100%);
    width: 122px;
  } */
</style>
