<script>
  import { onMount } from 'svelte'
  import FormSelect from '../FormSelect.svelte'
  const langList = [
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
  let sourceLang = 'en'
  let targetLang = 'zh'
  let leftSelect
  let rightSelect
  let leftShowList = false
  let rightShowList = false

  let isPin = true
  let name = 'jjj'
  let boxStyle = {
    position: 'fixed',
    top: 8 + 'px',
    left: 8 + 'px'
  }
  const pinClass = 'iconfont icon-push-pin hover-transition icon-push-is-pin'
  const noPinClass = 'iconfont icon-push-pin hover-transition'
  function handlePinClick() {}
  function handleClose() {}
  function handleLeftClick(e) {
    rightShowList = false
    console.log(e)
  }
  function handleRightClick(e) {
    leftShowList = false
    console.log(e)
  }
  function handleSelectChange(e) {
    console.log({ sourceLang, targetLang })
  }
  // 组件点击
  function handleBoxClick() {
    leftShowList = false
    rightShowList = false
  }
  onMount(() => {
    console.log('onMount')
  })
</script>

<main>
  <div class="select-trans-pop color-main" class:select-trans-pop-pin={isPin} style={boxStyle} on:click={handleBoxClick}>
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
      <div class="font-size-14 color-333">In recent years, many companies have begun to use formal proofs to provide assurance for software.</div>
    </div>
    <div class="trans-target padding-lr-16">
      <span class="color-99 font-size-10 leading-8">译文</span>
      <div class="font-size-14">近年来，许多公司已开始使用形式证明来为软件提供保证。</div>
      <div class="font-size-10 color-99 trans-target-api transition-300">由彩云小译提供翻译服务</div>
    </div>
  </div>
</main>

<style lang="scss" scoped>
  .select-trans-pop-pin {
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.2);
    background: rgba(255, 255, 255, 0.5);
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
    background: rgba(250, 250, 250, 0.6);
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
          &:hover {
            transform: rotate(45deg);
          }
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
      padding-bottom: 40px;
    }
    .trans-target > .trans-target-api {
      margin-top: 16px;
      float: right;
      height: 24px;
      line-height: 24px;
    }
    .trans-target > .trans-target-api:hover {
      color: #243949;
    }
  }
</style>
