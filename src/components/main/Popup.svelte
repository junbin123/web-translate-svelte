<script>
  import TransTextarea from '../Basics/TransTextarea.svelte'
  export let name
</script>

<main>
  <div class="container">{name}</div>
  <TransTextarea />
</main>

<style>
  main {
    width: 280px;
    min-height: 330px;
    background: white;
  }
</style>
