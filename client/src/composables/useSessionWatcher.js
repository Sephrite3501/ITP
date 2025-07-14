// src/composables/useSessionWatcher.js

import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/authStore.js'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { watch } from 'vue'


export function useSessionWatcher() {
  const auth = useAuthStore()
  const router = useRouter()
  const toast = useToast()

  let lastActivity = Date.now()
  let idleTimeout = null
  let refreshInterval = null

  const INACTIVITY_LIMIT = 30 * 60 * 1000 // 30 min for inactivity
  const REFRESH_INTERVAL = 30 * 1000     // 30 seconds for refresh
  const activityEvents = ['mousemove', 'keydown', 'scroll', 'click']

  const updateActivity = () => {
    lastActivity = Date.now()
  }

  const logout = async (reason = 'inactivity') => {
    try {
      await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (err) {
      console.warn('[SessionWatcher] Failed to clear server session')
    }

    auth.clearUser()

    if (reason === 'inactivity') {
      toast.warning('You have been logged out due to inactivity.', {
        timeout: false,
        closeOnClick: true,
        draggable: true
      })
    } else if (reason === 'conflict') {
      toast.error('You have been logged out because your account was logged in elsewhere.', {
        timeout: false,
        closeOnClick: true,
        draggable: true
      })
    }

    router.push('/login')
  }

const startWatcher = () => {
  activityEvents.forEach(event => {
    window.addEventListener(event, updateActivity)
  })

  idleTimeout = setInterval(() => {
    const diff = Date.now() - lastActivity
    if (diff > INACTIVITY_LIMIT) {
      logout('inactivity')
    }
  }, 60 * 1000)

refreshInterval = setInterval(async () => {
  const diff = Date.now() - lastActivity

  if (diff < INACTIVITY_LIMIT && auth.user?.email) {
    console.log('[SessionWatcher] Checking session activity:', auth.user)

    try {
      const res = await fetch('http://localhost:3001/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      })

      if (!res.ok) throw new Error('Token refresh failed')

    } catch (err) {
      console.warn('[SessionWatcher] Refresh failed:', err)
      logout('conflict') // 🧨 trigger logout
    }
  }
}, REFRESH_INTERVAL)

}


  const stopWatcher = () => {
    activityEvents.forEach(event => {
      window.removeEventListener(event, updateActivity)
    })
    clearInterval(idleTimeout)
    clearInterval(refreshInterval)
  }


    onMounted(() => {
    watch(
        () => auth.user?.email,
        (email) => {
        if (email) {
            console.log('[SessionWatcher] Starting session watcher for:', email)
            startWatcher()
        }
        },
        { immediate: true }
    )
    })
  onUnmounted(stopWatcher)
}
