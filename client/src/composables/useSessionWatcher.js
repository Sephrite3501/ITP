import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

export function useSessionWatcher() {
  const auth = useAuthStore()
  const router = useRouter()
  const toast = useToast()

  let lastActivity = Date.now()
  let idleTimeout = null
  let refreshInterval = null

//   const INACTIVITY_LIMIT = 30 * 60 * 1000 // 30 mins
//   const REFRESH_INTERVAL = 25 * 60 * 1000 // 25 mins

  const INACTIVITY_LIMIT = 1 * 60 * 1000 // 1 min for testing
  const REFRESH_INTERVAL = 30 * 1000     // 30s for testing

  const updateActivity = () => {
    lastActivity = Date.now()
  }

    const logout = async () => {
    try {
        await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
        })
    } catch (err) {
        console.warn('[Inactivity Logout] Failed to clear server session')
    }

    auth.clearUser()
    toast.warning('You have been logged out due to inactivity.', {
        timeout: false, // 🛑 stays until manually dismissed
        closeOnClick: true,
        draggable: true
    })
    router.push('/login')
    }

  const startWatcher = () => {
    ['mousemove', 'keydown', 'scroll', 'click'].forEach(event => {
      window.addEventListener(event, updateActivity)
    })

    idleTimeout = setInterval(() => {
      if (Date.now() - lastActivity > INACTIVITY_LIMIT) {
        logout()
      }
    }, 60 * 1000)

    refreshInterval = setInterval(async () => {
      if (Date.now() - lastActivity < INACTIVITY_LIMIT) {
        try {
          await fetch('http://localhost:3001/api/auth/refresh', {
            method: 'POST',
            credentials: 'include'
          })
        } catch (err) {
          logout()
        }
      }
    }, REFRESH_INTERVAL)
  }

  const stopWatcher = () => {
    ['mousemove', 'keydown', 'scroll', 'click'].forEach(event => {
      window.removeEventListener(event, updateActivity)
    })
    clearInterval(idleTimeout)
    clearInterval(refreshInterval)
  }

  onMounted(startWatcher)
  onUnmounted(stopWatcher)
}
