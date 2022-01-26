<script>
  import { onMount } from "svelte";

  onMount(() => {
    console.log("组件onMonut");
  });
</script>

<main>
  <div class="container">
    <div class="cell-item flex align-center">
      <div class="cell-left font-size-12 flex justify-end">语言</div>
      <div class="cell-right">a;fjsdg</div>
    </div>
    <div class="cell-item flex align-center">
      <div class="cell-left font-size-12 flex justify-end">背景色</div>
      <div class="cell-right">
        <div class="color-box" />
      </div>
    </div>

    <div class="button-box">
      <button class="button-left flex-center">
        不翻译了
      </button>
      <button class="button-right flex-center">
        重新翻译
      </button>
    </div>
  </div>
</main>

<style scoped>
  .container {
    width: 300px;
    height: 180px;
    background: #fafafa;
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
  .cell-item{
    height: 30px;
  }
  .cell-left{
    width: 67px;
    padding-right: 6px;
    color: #243949;
  }
  .cell-right{

  }


</style>
