<template>
  <section class="flex items-center justify-center px-2">
    <div class="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 sm:p-10">
      <h1 class="text-2xl font-extrabold text-center text-gray-800 mb-6">Reset Your Password</h1>

      <form @submit.prevent="onSubmit" class="space-y-6">
        <!-- New Password -->
        <div>
          <label for="new-password" class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <div class="relative flex items-center">
            <input
              id="new-password"
              :type="showPassword ? 'text' : 'password'"
              v-model.trim="form.password"
              placeholder="Enter new password"
              @input="() => { touched.password = true; validatePassword() }"
              @blur="() => { touched.password = true; validatePassword() }"
              class="w-full border rounded-lg py-2 px-3 pr-16 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              :class="[
                touched.password && passwordError ? 'border-red-500'
                  : touched.password && form.password && !passwordError ? 'border-green-500'
                  : 'border-gray-300'
              ]"
              required
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 text-blue-600 font-medium text-sm"
            >
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
          <p v-if="passwordError" class="text-xs text-red-600 mt-1">{{ passwordError }}</p>
        </div>

        <!-- Confirm Password -->
        <div>
          <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <div class="relative flex items-center">
            <input
              id="confirm-password"
              :type="showConfirm ? 'text' : 'password'"
              v-model.trim="form.confirmPassword"
              placeholder="Re-enter password"
              @blur="touched.confirmPassword = true"
              class="w-full border rounded-lg py-2 px-3 pr-16 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              :class="[
                confirmMismatch ? 'border-red-500' :
                touched.confirmPassword && form.confirmPassword && !confirmMismatch ? 'border-green-500' :
                'border-gray-300'
              ]"
              required
            />
            <button
              type="button"
              @click="showConfirm = !showConfirm"
              class="absolute right-3 text-blue-600 font-medium text-sm"
            >
              {{ showConfirm ? 'Hide' : 'Show' }}
            </button>
          </div>
          <p v-if="confirmMismatch" class="text-xs text-red-600 mt-1">Passwords do not match</p>
        </div>

        <!-- Errors & Success -->
        <div v-if="error" class="bg-red-100 text-red-700 p-2 rounded text-sm mb-1">
          {{ error }}
        </div>
        <div v-if="success" class="bg-green-50 text-green-700 p-2 rounded text-sm mb-1">
          {{ success }}
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-400"
          :disabled="loading"
        >
          {{ loading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { logSecurityClient } from '@/utils/logUtils'

const router = useRouter()
const route = useRoute()

const form = reactive({
  password: '',
  confirmPassword: ''
})

const error = ref('')
const success = ref('')
const token = ref('')
const loading = ref(false)
const showPassword = ref(false)
const showConfirm = ref(false)
const passwordError = ref('')
const touched = reactive({ password: false, confirmPassword: false })

const refId = `RESET-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

const validatePassword = () => {
  const pwd = form.password
  passwordError.value = ''
  if (!pwd) {
    passwordError.value = 'Password is required'
  } else if (pwd.length < 8 || !/[A-Z]/.test(pwd)) {
    passwordError.value = 'Password must be at least 8 characters with one uppercase letter'
  }
}

const confirmMismatch = computed(() =>
  touched.confirmPassword && form.confirmPassword && form.confirmPassword !== form.password
)

const onSubmit = async () => {
  error.value = ''
  success.value = ''
  touched.password = true
  touched.confirmPassword = true
  validatePassword()

  if (passwordError.value || confirmMismatch.value) {
    error.value = `Please ensure passwords match and meet requirements. (Ref: ${refId})`
    return
  }

  loading.value = true
  try {
    const res = await fetch('http://localhost:3001/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token.value,
        password: form.password
      })
    })

    const result = await res.json()

    if (!res.ok) {
      error.value = result.error
        ? `${result.error} (Ref: ${refId})`
        : `Failed to reset password. (Ref: ${refId})`

      await logSecurityClient({
        category: 'auth',
        action: 'reset_failed',
        details: `Reset error (refId: ${refId})`,
        severity: 'medium'
      })
    } else {
      await logSecurityClient({
        category: 'auth',
        action: 'reset_success',
        details: `Password reset successful (refId: ${refId})`,
        severity: 'low'
      })
      router.push('/resetpasswordsuccess')
    }
  } catch (err) {
    error.value = `Network error. Please try again. (Ref: ${refId})`
    await logSecurityClient({
      category: 'error',
      action: 'reset_network_error',
      details: `Network error on reset (refId: ${refId})`,
      severity: 'high'
    })
  } finally {
    loading.value = false
  }
}

const tokenValid = ref(false)
const checkingToken = ref(true)

onMounted(async () => {
  document.title = 'Reset Password | IRC'
  token.value = route.query.token || ''
  if (!token.value) {
    tokenValid.value = false
    checkingToken.value = false
    await logSecurityClient({
      category: 'auth',
      action: 'reset_invalid_token',
      details: `Missing token (refId: ${refId})`,
      severity: 'high'
    })
    return
  }

  try {
    const res = await fetch('http://localhost:3001/api/auth/validate-reset-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.value })
    })
    const result = await res.json()
    tokenValid.value = result.valid === true

    if (!tokenValid.value) {
      await logSecurityClient({
        category: 'auth',
        action: 'reset_token_rejected',
        details: `Invalid or expired token (refId: ${refId})`,
        severity: 'medium'
      })
    }
  } catch (err) {
    tokenValid.value = false
    await logSecurityClient({
      category: 'error',
      action: 'reset_token_check_error',
      details: `Token check failed (refId: ${refId})`,
      severity: 'high'
    })
  } finally {
    checkingToken.value = false
  }
})
</script>