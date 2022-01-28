<script>
  import LanguageSelect from "./LanguageSelect.svelte";
  import iconRight from "../static/images/icon-right.png";
  import { createEventDispatcher } from "svelte";
  import iconDone from "../static/images/icon-done.png";
  import { onMount } from "svelte";
  const dispatch = createEventDispatcher();
  const colorList = [
    { color: "rgba(252,222,159,0.40)", name: 0 },
    { color: "rgba(250,208,196,0.40)", name: 1 },
    { color: "rgba(150,251,196,0.30)", name: 2 },
    { color: "rgba(194,233,251,0.40)", name: 3 },
    { color: "rgba(195,207,226,0.30)", name: 4 },
    { color: "rgba(224,195,252,0.30)", name: 5 },
  ];

  const storageColor = window.localStorage.getItem("webTranslateColor");
  let selectColor = storageColor || colorList[0].color;
  let transType =
    window.localStorage.getItem("webTranslateTransType") || "en2zh";
  let langValue = transType.split("2");

  onMount(() => {
    console.log("组件onMonut");
    dispatch("changeColor", selectColor);
  });

  function changeColor(e) {
    const color = e.target.dataset.color;
    if (color) {
      selectColor = color;
      window.localStorage.webTranslateColor = color;
      dispatch("changeColor", color);
    }
  }

  function handleClick(e) {
    const type = e.target.dataset.type;
    const params = {
      transType: transType,
      color: selectColor,
      type,
    };
    dispatch("handleTranslate", params);
  }

  function changeLang(data) {
    transType = data.detail.join("2");
  }
</script>

<main>
  <div class="container">
    <div class="connect-dev flex justify-end">
      <a
        class="click-connect flex-center"
        href="https://junbin123.gitee.io/"
        target="_blank"
      >
        联系开发者
        <img src={iconRight} alt="icon" class="link-img" />
      </a>
    </div>
    <div class="cell-item flex align-center">
      <div class="cell-left flex justify-end">语言</div>
      <div class="cell-right">
        <LanguageSelect on:handleChange={changeLang} value={langValue} />
      </div>
    </div>
    <div class="cell-item flex align-center">
      <div class="cell-left flex justify-end">背景色</div>
      <div class="cell-right flex align-center" on:click={changeColor}>
        {#each colorList as item}
          <div class="color-box">
            {#if item.color === selectColor}
              <img src={iconDone} alt="icon" class="select-color" />
            {/if}
            <div
              class="color-item"
              style={"background:" + item.color}
              data-color={item.color}
            />
          </div>
        {/each}
      </div>
    </div>

    <div class="button-box flex-between" on:click={handleClick}>
      <div class="button-left flex-center" data-type="不翻译了">不翻译了</div>
      <div class="button-right flex-center" data-type="重新翻译">重新翻译</div>
    </div>
  </div>
</main>

<style scoped>
  .container {
    width: 300px;
    background: #232e3b;
    border: 1px solid #ddd;
    box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    /* padding-top: 20px; */
    -moz-user-select: none; /* 火狐 */
    -webkit-user-select: none; /* 谷歌 */
    -ms-user-select: none; /* IE */
    user-select: none;
    overflow: hidden;
  }

  .cell-item {
    color: #a0adbf;
    height: 30px;
    font-size: 12px;
    margin-bottom: 10px;
  }
  .cell-left {
    width: 67px;
    padding-right: 8px;
  }

  .color-item {
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }
  .color-box {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    margin-right: 10px;
    position: relative;
  }
  .button-box {
    width: 300px;
    height: 66px;
    padding: 0 20px;
    box-sizing: border-box;
    background: rgba(20, 28, 34, 0.4);
    box-shadow: 0 -1px 0 0 #38414d;
    margin-top: 20px;
    font-size: 14px;
    font-weight: bold;
    color: #d8d8d8;
  }
  .button-left {
    width: 120px;
    height: 36px;
    background: #243949;
    border-radius: 4px;
  }

  .button-left:hover {
    background: #2a4355;
  }
  .button-right {
    width: 120px;
    height: 36px;
    background: #ff6239;
    border-radius: 4px;
  }
  .button-right:hover {
    background: #fa643e;
  }
  .select-color {
    width: 20px;
    height: 20px;
    position: absolute;
    top: 0;
    left: 0;
  }
  .connect-dev {
    padding: 10px 0;
    padding-right: 20px;
  }
  .click-connect {
    font-size: 12px;
    width: 82px;
    color: #a0adbf;
    border-radius: 4px;
    height: 20px;
    padding-left: 6px;
    background: inherit;
    text-decoration: none;
  }
  .click-connect:hover {
    background: #3c4c5f;
    text-decoration: none;
  }

  .link-img {
    width: 16px;
    height: 16px;
    display: inline-block;
  }
</style>
