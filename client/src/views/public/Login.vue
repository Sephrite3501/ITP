<template>
  <section class="login-container">
    <div class="login-box">
      <h1 class="login-title">Login</h1>

      <form @submit.prevent="onSubmit" class="login-form">
        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            v-model.trim="form.email"
            @blur="touched.email = true"
            :class="inputClass('email')"
            autocomplete="email"
          />
          <p v-if="touched.email && errors.email" class="field-error">{{ errors.email }}</p>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-wrapper">
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model.trim="form.password"
              @blur="touched.password = true"
              :class="inputClass('password')"
              autocomplete="current-password"
            />
            <span class="toggle-password" @click="showPassword = !showPassword">
              {{ showPassword ? '🙈' : '👁️' }}
            </span>
          </div>
          <p v-if="touched.password && errors.password" class="field-error">{{ errors.password }}</p>
        </div>

        <div id="recaptcha" class="recaptcha-box"></div>

        <p v-if="error" class="error-message">{{ error }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>

        <router-link to="/resetpasswordrequest" class="forgot-link">Forgot password?</router-link>
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { logSecurityClient } from '@/utils/logUtils'

const router = useRouter()
const form = reactive({ email: '', password: '' })
const touched = reactive({ email: false, password: false })
const errors = reactive({})
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

onMounted(() => {
  document.title = 'Login | IRC'
})

const inputClass = (field) =>
  touched[field] && errors[field] ? 'error-input' : touched[field] ? 'valid-input' : ''

const validate = () => {
  errors.email = ''
  errors.password = ''

  if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.email = 'Valid email is required'
  }
  if (!form.password) {
    errors.password = 'Password is required'
  }

  return Object.values(errors).every((v) => !v)
}

const executeRecaptcha = () =>
  new Promise((resolve, reject) => {
    if (!window.grecaptcha || typeof window.grecaptcha.ready !== 'function') {
      return reject('reCAPTCHA not loaded properly')
    }
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, { action: 'login' })
        .then(resolve)
        .catch(reject)
    })
  })

const onSubmit = async () => {
  touched.email = true
  touched.password = true
  error.value = ''

  if (!validate()) return

  loading.value = true
  const refId = `LOGIN-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

  try {
    const recaptchaToken = await executeRecaptcha()

    const res = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, recaptchaToken })
    })

    const result = await res.json()
    if (!res.ok) {
      error.value = result.error
        ? `${result.error} (Ref: ${refId})`
        : `Login failed. (Ref: ${refId})`

      await logSecurityClient({
        category: 'auth',
        action: 'login_failed',
        details: `Email: ${form.email}, refId: ${refId}`,
        severity: 'medium'
      })
    } else {
      await logSecurityClient({
        category: 'auth',
        action: 'login_success',
        details: `User: ${form.email}, refId: ${refId}`,
        severity: 'low'
      })
      router.push({ path: '/verify-otp', query: { email: form.email } })
    }
  } catch (err) {
    error.value = `Unexpected error. Please try again. (Ref: ${refId})`

    await logSecurityClient({
      category: 'error',
      action: 'login_error',
      details: `Unhandled exception for ${form.email} (refId: ${refId}) - ${err?.message}`,
      severity: 'high'
    })
  } finally {
    loading.value = false
  }
}
</script>


<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem 1rem;
  background: #f9fafb;
  min-height: 80vh;
}

.login-box {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 460px;
  width: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.login-title {
  font-size: 1.8rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1.5rem;
  color: #111827;
}

.login-form .form-group {
  margin-bottom: 1.2rem;
}

.login-form label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.3rem;
  color: #374151;
}

.login-form input {
  width: 100%;
  padding: 0.6rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  color: #111827;
}

.valid-input {
  border-color: #16a34a;
}

.error-input {
  border-color: #dc2626;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  flex: 1;
}

.toggle-password {
  position: absolute;
  right: 0.75rem;
  cursor: pointer;
  font-size: 1rem;
  user-select: none;
}

button {
  width: 100%;
  padding: 0.8rem;
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

.forgot-link {
  display: block;
  text-align: center;
  margin-top: 1rem;
  color: #2563eb;
  font-weight: 500;
  text-decoration: underline;
}

.error-message {
  background: #fee2e2;
  color: #b91c1c;
  padding: 0.5rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.field-error {
  font-size: 0.9rem;
  color: #dc2626;
  margin-top: 0.25rem;
}

.recaptcha-box {
  margin: 1rem 0;
}
</style>
