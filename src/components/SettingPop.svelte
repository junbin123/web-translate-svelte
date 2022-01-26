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

    <div class="button-box">
      <button class="button-left flex-center"> 不翻译了 </button>
      <button class="button-right flex-center"> 重新翻译 </button>
    </div>
  </div>
</main>

<style scoped>
  .container {
    width: 300px;
    height: 180px;
    background: #232e3b;
    border: 1px solid #e8e8e8;
    box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    padding: 20px 0;
  }
  .color-box {
    background: brown;
    width: 30px;
    height: 30px;
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
  .cell-right {
  }
  .dot-item {
    width: 18px;
    height: 18px;
    background: #243949;
    border-radius: 50%;
  }
  .color-item {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    margin-right: 10px;
  }
</style>
