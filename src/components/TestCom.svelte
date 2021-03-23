<script>
  import { onMount } from 'svelte'
  export let name

  onMount(() => {
    console.log('组件onMonut')
  })
</script>

<main>
  <div class="container">我是组件{name}</div>
</main>

<style type="text/scss">
  main {
    .container {
      position: fixed;
      left: 0;
      top: 0;
      width: 100px;
      height: 100px;
      background: red;
      z-index: 9999;
    }
  }
</style>
