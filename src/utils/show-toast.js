import { toast } from '@zerodevx/svelte-toast'
export const showToast = {
  success: (msg) => {
    toast.push(msg, {
      theme: {
        '--toastBackground': '#F56565',
        '--toastBarBackground': '#C53030',
      },
    })
  },
  error: (msg) => {
    toast.push(msg, {
      theme: {
        '--toastBackground': '#F56565',
        '--toastBarBackground': '#C53030',
      },
    })
  },
}