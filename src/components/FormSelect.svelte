<script>
  import { createEventDispatcher } from "svelte";
  
  import iconDown from "../static/images/icon-down.png";
  const dispatch = createEventDispatcher();
  export let value = "en";
  export let options = [
    // 语言列表
    {
      name: "中文",
      value: "zh",
    },
    {
      name: "英语",
      value: "en",
    },
    {
      name: "日语",
      value: "ja",
    },
  ];
  $: selectName = options.find((item) => item.value === value).name;

  export let showList = false; // 是否显示下拉框

  // 选择语言点击事件
  function handleSelect({ target }) {
    showList = false;
    const { index } = target.dataset;
    const item = options[Number(index)];
    value = item.value;
    dispatch("handleChange", item);
  }
  // 下拉框点击事件
  function handleClick() {
    dispatch("handleClick");
    showList = !showList;
  }

  function onMove() {
    console.log("11");
    showList = !showList;
  }
</script>

<main>
  <div
    id="select-box"
    class="transition-300 flex-between"
    on:blur={onMove}
    on:focus={onMove}
    on:click|stopPropagation={handleClick}
  >
    <div>{selectName}</div>
    <img
      src={iconDown}
      alt="icon"
      class="icon-box transition-300"
      class:arrow-up={showList}
    />
  </div>
  <div
    class="select-container transition-300"
    class:select-spread={showList}
  >
    {#each options as item, index}
      <div
        on:click={handleSelect}
        data-index={index}
        class="select-item"
      >
        {item.name}
      </div>
    {/each}
  </div>
</main>

<style scoped>
  main {
    position: relative;
    cursor: pointer;
  }
  #select-box {
    width: 80px;
    height: 30px;
    line-height: 30px;
    padding-left: 8px;
    padding-right: 2px;
    font-size: 12px;
    background: #37475b;
    color: #e8e8e8;
    border-radius: 4px;
  }
  #select-box:hover {
    background: #4e617a;
  }

  .select-container {
    border-radius: 4px;
    background: #37475b;
    font-size: 12px;
    width: 100%;
    color: #a0adbf;
    position: absolute;
    overflow: hidden;
    margin-top: 4px;
    transform-origin: left top;
    transform: scaleY(0);
    transition: all 0.2s ease-in-out;
    padding: 4px 0;
  }
  .select-item {
    height: 28px;
    line-height: 28px;
    padding-left: 8px
  }
  .select-item:hover {
    background: #4e617a;
    color: #e8e8e8;
  }

  .select-spread {
    transform: scaleY(1);
  }

  .arrow-up {
    transform: rotate(180deg);
  }
  .icon-box {
    width: 20px;
    height: 20px;
    margin: 0;
    padding: 0;
  }
</style>
