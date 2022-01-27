<script>
  import clickClose from "../static/images/click-close.png";
  import clickLogo from "../static/images/click-logo.png";
  import SettingPop from "./SettingPop.svelte";
  import { onMount } from "svelte";
  let showPop = false;

  document.body.addEventListener(
    "click",
    function ({ target }) {
      if (
        target.closest("#web-translate-svelte") &&
        !target.className.split(" ").find((item) => item === "click-item")
      ) {
        showPop = false;
      }
    },
    { passive: true }
  );

  //使用

  onMount(() => {
    console.log("组件onMonut");
  });

  function handleClick() {
    showPop = !showPop;
  }
  function handleTranslate(data) {
    const { type, color, transType } = data.detail;
    if (type === "重新翻译") {
      console.log(1);
      return;
    }
    if (type === "不翻译了") {
      console.log(2);
    }
    console.log(color, transType, "0--------------------");
  }

  function changeColor(data) {
    console.log(data.detail, "changeColor");
  }
</script>

<main>
  <div class="container" id="web-translate-svelte">
    <div class="click-box" on:click={handleClick}>
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
