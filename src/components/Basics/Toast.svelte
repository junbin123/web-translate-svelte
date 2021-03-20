<script>
  import { onMount } from 'svelte'
  import { fade, fly } from 'svelte/transition'
  import { backOut } from 'svelte/easing'

  let toasts = [] // 알람이 연속적으로 발생할 수 있으니 배열로 생성
  let retainMs = 2000 // 생성되고 사라질 시간

  // 알람을 추가한다, 변수로 단순하게 메시지 한 줄 받음
  let toastId = 0
  const pushToast = (msg = '') => {
    toasts = [
      ...toasts,
      {
        _id: ++toastId,
        msg
      }
    ] // 새로운 할당
    setTimeout(() => {
      unshiftToast()
    }, retainMs)
  }

  // 오래된 알람 하나 삭제
  const unshiftToast = () => {
    toasts = toasts.filter((a, i) => i > 0) // 새로운 할당
  }

  onMount(() => {
    window.showToast = pushToast
  })
</script>

<div class="toast-wrapper">
  {#each toasts as toast (toast._id)}
    <div class="toast-item" in:fly={{ delay: 0, duration: 300, x: 0, y: 50, opacity: 0.1, easing: backOut }} out:fade={{ duration: 300, opacity: 0 }}>
      {toast.msg}
    </div>
  {/each}
</div>

<style>
  .toast-wrapper {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    text-align: center;
    z-index: 9999;
  }
  .toast-item {
    border-radius: 4px;
    padding: 12px 10px;
    margin: 10px auto;
    max-width: 400px;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
  }
</style>
