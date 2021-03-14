<!-- 目标文本组件 -->
<script>
  export let name
</script>

<main>
  <div class="container">Hello {name}!</div>
</main>

<style>
  
  .content-class {
    display: inline-block;
    color: rgba(0, 0, 0, 0);
    background-image: linear-gradient(-225deg, #231557 0%, #44107a 29%, #ff1361 67%, #fff800 100%);
    text-shadow: none;
    border-radius: 4px;
    animation: animateGlow 2s ease-in-out infinite;
    background-size: 200% 200%;
  }
  .content-class-complete {
    display: inline-block;
  }
  .content-class-complete:hover {
    box-shadow: 0 0 0 1px #f09819;
  }
  @keyframes animateGlow {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
</style>
