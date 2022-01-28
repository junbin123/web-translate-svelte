<script>
  import clickClose from "./static/images/click-close.png";
  import clickLogo from "./static/images/click-logo.png";
  import SettingPop from "./components/SettingPop.svelte";
  import {
    fullTrans,
    removeAllDom,
    changeNodeColor,
    getNodeLength,
  } from "./utils/full_translate.js";
  import { onMount } from "svelte";
  let showPop = false;
  let currTransType =
    window.localStorage.getItem("webTranslateTransType") || "en2zh";

  onMount(() => {
    console.log("组件onMonut");
  });
  // 点击其他区域隐藏弹窗
  document.body.addEventListener(
    "click",
    function ({ target }) {
      if (
        !target.closest("#web-translate-svelte") &&
        !target.className.split(" ").find((item) => item === "click-item")
      ) {
        showPop = false;
      }
    },
    { passive: true }
  );

  // 监听扩展icon的点击
  chrome.runtime.onMessage.addListener(
    async (request, sender, sendResponse) => {
      const length = getNodeLength();
      const urlKey = encodeURIComponent("hasTrans" + window.location.href);
      if (length > 0 && window.sessionStorage.getItem(urlKey)) {
        return;
      }
      window.sessionStorage.setItem(urlKey, 1);
      const target = document.getElementById("web-translate-svelte").style;
      if (target.display === "none") {
        target.display = "block";
      }
      fullTrans({ transType: currTransType });
      // sendResponse({ canTrans: true, currentUrl, msg: "开始翻译" });
    }
  );

  function handleTranslate(data) {
    const { type, color, transType } = data.detail;
    const urlKey = encodeURIComponent("hasTrans" + window.location.href);
    if (type === "重新翻译") {
      if (transType !== currTransType) {
        currTransType = transType;
        window.localStorage.setItem("webTranslateTransType", transType);
        window.sessionStorage.setItem(urlKey, 1);
        removeAllDom();
        fullTrans({ transType });
        showPop = false;
        return;
      }

      if (!window.sessionStorage.getItem(urlKey)) {
        window.sessionStorage.setItem(urlKey, 1);
        removeAllDom();
        fullTrans({ transType });
        showPop = false;
        return;
      }

      if (getNodeLength() > 0) {
        showPop = false;
        return;
      }

      window.sessionStorage.setItem(urlKey, 1);
      fullTrans({ transType });
      showPop = false;
      return;
    }
    if (type === "不翻译了") {
      window.sessionStorage.removeItem(urlKey);
      showPop = false;
      removeAllDom();
    }
  }

  function changeColor(data) {
    console.log(data.detail, "changeColor");
    changeNodeColor({ color: data.detail });
  }
</script>

<main>
  <div
    class="container web-translate-svelte"
    id="web-translate-svelte"
    style="display:none"
  >
    <div class="click-box" on:click={() => (showPop = !showPop)}>
      {#if showPop}
        <img src={clickClose} alt="close" class="click-item" />
      {:else}
        <img src={clickLogo} alt="logo" class="click-item" />
      {/if}
    </div>
    <div
      id="pop-box"
      class={`transition-300 ${showPop ? "show-pop" : "hide-pop"}`}
    >
      <SettingPop
        on:handleTranslate={handleTranslate}
        on:changeColor={changeColor}
      />
    </div>
  </div>
</main>

<style scoped>
  .container {
    position: fixed;
    right: 30px;
    z-index: 9999;
    cursor: pointer;
    background-image: linear-gradient(-44deg, #243949 0%, #517fa4 100%);
    bottom: 30px;
    border: 1px solid #eee;
    border-radius: 8px;
  }

  .click-box {
    position: fixed;
    right: 30px;
    z-index: 9999;
    width: 36px;
    height: 36px;
    cursor: pointer;
    bottom: 30px;
  }
  .click-item {
    width: 36px;
    height: 36px;
  }
  #pop-box {
    position: fixed;
    bottom: 68px;
    right: 68px;
    z-index: 9999;
    cursor: pointer;
    transform-origin: right bottom;
  }
  .show-pop {
    transform: scale(1);
  }
  .hide-pop {
    transform: scale(0);
  }
</style>
