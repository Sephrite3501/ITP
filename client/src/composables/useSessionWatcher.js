import { onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '../stores/authStore.js'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { logSecurityClient } from '@/utils/logUtils.js'

export function useSessionWatcher() {
  const auth = useAuthStore()
  const router = useRouter()
  const toast = useToast()

  let lastActivity = Date.now()
  let idleTimeout = null
  let refreshInterval = null

  const INACTIVITY_LIMIT = 30 * 60 * 1000 // 30 min
  const REFRESH_INTERVAL = 30 * 1000 // 30 seconds
  const activityEvents = ['mousemove', 'keydown', 'scroll', 'click']

  const updateActivity = () => {
    lastActivity = Date.now()
  }

  const logout = async (reason = 'inactivity') => {
    const traceId = `LOGOUT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    try {
      await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch {
      // Silently fail; no console.warn
    }

    auth.clearUser()

    if (reason === 'inactivity') {
      toast.warning('You have been logged out due to inactivity.', { timeout: false })
      logSecurityClient({
        traceId,
        category: 'session',
        type: 'idle_logout',
        status: 'success',
        severity: 'low',
        userEmail: auth.user?.email,
        message: 'User logged out after inactivity'
      })
    } else if (reason === 'conflict') {
      toast.error('You have been logged out because your account was logged in elsewhere.', { timeout: false })
      logSecurityClient({
        traceId,
        category: 'session',
        type: 'conflict_logout',
        status: 'success',
        severity: 'high',
        userEmail: auth.user?.email,
        message: 'User logged out due to session conflict or refresh failure'
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
      const traceId = `REFRESH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      if (diff < INACTIVITY_LIMIT && auth.user?.email) {
        try {
          const res = await fetch('http://localhost:3001/api/auth/refresh', {
            method: 'POST',
            credentials: 'include'
          })

          if (!res.ok) throw new Error('Token refresh failed')
        } catch (err) {
          logSecurityClient({
            traceId,
            category: 'session',
            type: 'refresh_failed',
            status: 'fail',
            severity: 'high',
            userEmail: auth.user?.email,
            message: 'Refresh failed — triggering forced logout'
          })
          logout('conflict')
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
          logSecurityClient({
            traceId: `LOGOUT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            category: 'session',
            type: 'start',
            status: 'success',
            severity: 'low',
            userEmail: email,
            message: 'Started session watcher'
          })
          startWatcher()
        }
      },
      { immediate: true }
    )
  })

  onUnmounted(stopWatcher)
}
