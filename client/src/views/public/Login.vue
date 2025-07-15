<template>
  <section class="flex items-center justify-center px-2">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10">
      <h1 class="text-2xl font-extrabold text-center text-gray-800 mb-8">Login</h1>
      <form @submit.prevent="onSubmit" class="space-y-6">
        <!-- Email Field -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            type="email"
            v-model.trim="form.email"
            autocomplete="email"
            placeholder="e.g. you@example.com"
            @blur="markTouched('email')"
            :class="[
              'w-full border rounded-lg py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition',
              errors.email ? 'border-red-500'
              : touched.email && form.email && !errors.email ? 'border-green-500'
              : 'border-gray-300'
            ]"
          />
          <p v-if="errors.email" class="text-xs text-red-600 mt-1">{{ errors.email }}</p>
        </div>
        <!-- Password Field -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div class="relative flex items-center">
            <input
              :type="showPassword ? 'text' : 'password'"
              id="password"
              v-model.trim="form.password"
              autocomplete="current-password"
              placeholder="Enter your password"
              @blur="markTouched('password')"
              :class="[
                'w-full border rounded-lg py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition pr-10',
                errors.password ? 'border-red-500'
                : touched.password && form.password && !errors.password ? 'border-green-500'
                : 'border-gray-300'
              ]"
            />
            <span
              class="absolute right-3 inset-y-0 flex items-center h-full text-blue-500 cursor-pointer text-base select-none"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? 'Hide' : 'Show' }}
            </span>
          </div>
          <p v-if="errors.password" class="text-xs text-red-600 mt-1">{{ errors.password }}</p>
        </div>
        <!-- reCAPTCHA and Error -->
        <div>
          <div id="recaptcha" class="mt-2 mb-4"></div>
          <p v-if="error" class="bg-red-100 text-red-700 p-2 rounded text-sm mb-1">{{ error }}</p>
        </div>
        <!-- Submit Button -->
        <div>
          <button
            type="submit"
            class="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
            :disabled="loading"
          >
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </div>
        <!-- Forgot Password Link -->
        <router-link
          to="/resetpasswordrequest"
          class="block text-center text-blue-600 font-medium mt-4 underline hover:text-blue-800 transition"
        >
          Forgot password?
        </router-link>
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

const markTouched = (field) => {
  touched[field] = true;      
  validateField(field);
}

const tempEmailDomains = [
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "throwawaymail.com"
]

const isTempEmail = (email) =>
  tempEmailDomains.some(domain => email.toLowerCase().endsWith('@' + domain))

const validateField = (field) => {
  const value = form[field]
  delete errors[field]

  switch (field) {
    case 'email':
      if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.email = 'Valid email is required'
      } else if (isTempEmail(value)) {
        errors.email = 'Temporary emails are not allowed'
      }
      break
    case 'password':
      if (!value || value.length < 8 || !/[A-Z]/.test(value)) {
        errors.password = 'Password must be at least 8 characters with one uppercase letter'
      }
      break
    }
}

const validate = () => {
  validateField('email');
  validateField('password');
  return !errors.email && !errors.password;
};


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
