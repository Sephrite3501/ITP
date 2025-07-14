<template>
  <section class="activation-container">
    <div class="activation-box">
      <h1 class="activation-title">Account Activation</h1>
      <div v-if="loading" class="activation-message loading">
        Activating your account...
      </div>

      <div v-else-if="success" class="activation-message success">
        ✅ Your account has been activated successfully!
        <router-link to="/login" class="login-link">Go to Login</router-link>
      </div>

      <div v-else class="activation-message error">
        ❌ {{ error || 'Activation failed or expired.' }}
        <router-link to="/signup" class="login-link">Sign Up Again</router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getFriendlyError } from '@/utils/handleError'
import { logSecurityClient } from '@/utils/logUtils'

const route = useRoute()
const success = ref(false)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  document.title = 'Account Activation | IRC'

  const token = route.query.token
  const refId = `ACTIVATE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

  if (!token) {
    error.value = `Invalid activation link. (Ref: ${refId})`
    await logSecurityClient({
      category: 'auth',
      action: 'activation_failed',
      details: `Missing token (refId: ${refId})`,
      severity: 'medium'
    })
    loading.value = false
    return
  }

  try {
    const res = await fetch(`http://localhost:3001/api/auth/activate?token=${encodeURIComponent(token)}`)
    const result = await res.json()

    if (!res.ok) {
      error.value = getFriendlyError(result, 'Activation failed or expired.', refId)
      await logSecurityClient({
        category: 'auth',
        action: 'activation_failed',
        details: `Server rejected token (refId: ${refId})`,
        severity: 'high'
      })
    } else {
      success.value = true
      await logSecurityClient({
        category: 'auth',
        action: 'activation_success',
        details: `Account activated (refId: ${refId})`,
        severity: 'low'
      })
    }
  } catch (err) {
    error.value = getFriendlyError(err, 'Activation error occurred.', refId)
    await logSecurityClient({
      category: 'error',
      action: 'activation_error',
      details: `Unhandled error: ${err?.message} (refId: ${refId})`,
      severity: 'high'
    })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.activation-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f9fafb;
  min-height: 80vh;
  padding: 2rem;
}

.activation-box {
  background: white;
  padding: 2rem 3rem;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.activation-title {
  font-size: 2rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 1.5rem;
}

.activation-message {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  border-radius: 6px;
}

.success {
  color: #16a34a;
  background-color: #ecfdf5;
  border: 1px solid #bbf7d0;
}

.error {
  color: #dc2626;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
}

.loading {
  color: #374151;
}

.login-link {
  display: inline-block;
  margin-top: 1rem;
  color: #2563eb;
  font-weight: 500;
  text-decoration: underline;
}
</style>
