<script>
  import iconClose from "../static/images/icon/icon-close.png";
  import { onMount } from "svelte";

  export let name = "hhh";

  onMount(() => {
    console.log("组件onMonut");
  });
</script>

<main>
  <div class="container">
    我是组件{name}
    <div class="container-box flex">
      <div class="tool-item">不翻译了</div>
      <div class="tool-item">
        

      </div>

      <img src={iconClose} alt="logo" class="tool-item" />
    </div>
  </div>
</main>

<style scoped>
  .container {
    position: fixed;
    right: 30px;
    z-index: 9999;
    width: 252px;
    height: 46px;
    cursor: pointer;
    background-image: linear-gradient(-44deg, #243949 0%, #517fa4 100%);
    bottom: 30px;
    border: 1px solid #eee;
    border-radius: 8px;
    color: #fff;
  }
  .tool-item {
    width: 24px;
    height: 24px;
  }
</style>
