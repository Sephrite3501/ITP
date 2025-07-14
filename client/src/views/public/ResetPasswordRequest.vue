<template>
  <section class="reset-container">
    <div class="reset-box">
      <h1 class="reset-title">Forgot Password?</h1>
      <p class="reset-subtext">Enter your registered email and we’ll send you a reset link.</p>

      <form @submit.prevent="onSubmit" class="reset-form">
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" required placeholder="you@example.com" />
        </div>

        <div class="form-group">
          <div id="recaptcha" class="recaptcha-box"></div>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">{{ success }}</div>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Sending...' : 'Send Reset Link' }}
        </button>
      </form>
    </div>
  </section>
</template>


<script setup>
import { reactive, ref, onMounted } from 'vue'
import { getFriendlyError } from '@/utils/handleError'
import { logSecurityClient } from '@/utils/logUtils'

const form = reactive({
  email: ''
})
const loading = ref(false)
const error = ref('')
const success = ref('')
const refId = `RESETREQ-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

onMounted(() => {
  document.title = 'Reset Password Request | IRC'
})

const executeRecaptcha = () => {
  return new Promise((resolve, reject) => {
    if (!window.grecaptcha || typeof window.grecaptcha.ready !== 'function') {
      return reject('reCAPTCHA not loaded')
    }
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, { action: 'reset_password' })
        .then(resolve)
        .catch(reject)
    })
  })
}

const onSubmit = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const token = await executeRecaptcha()

    if (!form.email || !form.email.includes('@')) {
      error.value = `Please enter a valid email address (Ref: ${refId})`
      await logSecurityClient({
        category: 'auth',
        action: 'reset_request_invalid_input',
        details: `User submitted invalid email input (refId: ${refId})`,
        severity: 'medium'
      })
      return
    }

    const response = await fetch('http://localhost:3001/api/auth/reset-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        recaptchaToken: token
      })
    })

    const result = await response.json()

    if (!response.ok || result?.error) {
      error.value = getFriendlyError({ response: { data: result } }, 'Reset failed.', refId)

      await logSecurityClient({
        category: 'auth',
        action: 'reset_request_failed',
        details: `Reset request rejected by server (refId: ${refId})`,
        severity: 'medium'
      })
    } else {
      success.value = result.message || 'If your email is registered, a reset link has been sent.'
      await logSecurityClient({
        category: 'auth',
        action: 'reset_request_success',
        details: `Reset link sent (refId: ${refId})`,
        severity: 'low'
      })
    }
  } catch (err) {
    error.value = getFriendlyError(err, 'Reset request error.', refId)

    await logSecurityClient({
      category: 'error',
      action: 'reset_request_network_error',
      details: `Network error during reset request (refId: ${refId})`,
      severity: 'high'
    })
  } finally {
    loading.value = false
  }
}
</script>



<style scoped>
.reset-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem 1rem;
  min-height: 70vh;
  background: #f3f4f6;
}

.reset-box {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 450px;
  width: 100%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.reset-title {
  font-size: 1.75rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 0.5rem;
  color: #111827; 
}

.reset-subtext {
  font-size: 0.95rem;
  text-align: center;
  margin-bottom: 1.5rem;
  color: #111827; 
}

.reset-form .form-group {
  margin-bottom: 1.2rem;
}

.reset-form label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.3rem;
}

.reset-form input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
}

button {
  width: 100%;
  padding: 0.75rem;
  background: #2563eb;
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
}

.recaptcha-box {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.error-message {
  background: #fee2e2;
  color: #b91c1c;
  padding: 0.5rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.success-message {
  background: #dcfce7;
  color: #15803d;
  padding: 0.5rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

input::placeholder {
  color: #383839; /* Tailwind's gray-400 for better visibility */
  opacity: 1; /* Make sure it's not faded */
}

input {
  color: #111827; /* Ensure typed text is visible */
}

label {
  color: #374151; /* Tailwind's gray-700 */
  font-weight: 500;
  margin-bottom: 0.25rem;
  display: block;
}
</style>
