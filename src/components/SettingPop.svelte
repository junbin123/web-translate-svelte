<script>
  import LanguageSelect from "./LanguageSelect.svelte";
  import { onMount } from "svelte";

  onMount(() => {
    console.log("组件onMonut");
  });

  const colorList = [
    { value: "#57A627", name: 0 },
    { value: "#DB4455", name: 1 },
    { value: "#DB4455", name: 2 },
    { value: "#DB4455", name: 3 },
    { value: "#DB4455", name: 4 },
    { value: "#DB4455", name: 5 },
  ];
</script>

<main>
  <div class="container">
    <div class="cell-item flex align-center">
      <div class="cell-left flex justify-end">语言</div>
      <div class="cell-right">
        <LanguageSelect />
      </div>
    </div>
    <div class="cell-item flex align-center">
      <div class="cell-left flex justify-end">背景色</div>
      <div class="cell-right flex align-center">
        {#each colorList as { value }}
          <div>
            <div class="color-item" style={"background:" + value} />
          </div>
        {/each}
      </div>
    </div>

    <div class="button-box flex-between">
      <div class="button-left flex-center">不翻译了</div>
      <div class="button-right flex-center">重新翻译</div>
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
    padding-top: 20px;
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
    margin-right: 10px;
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
</style>
