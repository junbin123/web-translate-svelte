<script>
  import clickClose from "../static/images/click-close.png";
  import clickLogo from "../static/images/click-logo.png";
  import { onMount } from "svelte";

  // export let name = "hhh";

  onMount(() => {
    console.log("组件onMonut");
  });
  let showPop = false;
  function handleClick() {
    showPop = !showPop;
  }
</script>

<main>
  <div class="container">
    <div class="click-box" on:click={handleClick}>
      {#if showPop}
        <img src={clickClose} alt="close" class="click-item" />
      {:else}
        <img src={clickLogo} alt="logo" class="click-item" />
      {/if}
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
</style>
