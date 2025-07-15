<template>
  <section class="flex items-center justify-center px-2">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10">
      <h1 class="text-2xl font-extrabold text-center text-gray-800 mb-4">Enter Your OTP</h1>

      <p class="text-base text-center text-gray-600 mb-6">
        We’ve sent a 6-digit code to your email:<br>
        <strong>{{ email }}</strong>
      </p>

      <form @submit.prevent="onSubmit" class="space-y-6">
        <div>
          <label for="otp" class="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
          <input
            id="otp"
            v-model.trim="otp"
            type="text"
            maxlength="6"
            autocomplete="one-time-code"
            pattern="\d*"
            placeholder="Enter code"
            required
            @input="validateOtp"
            @blur="markTouched('otp')"
            :class="[
              'w-full border rounded-lg py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500 transition',
              otpError ? 'border-red-500' 
                : touched.otp && otp.length === 6 && !otpError 
                  ? 'border-green-500' 
                  : 'border-gray-300'
            ]"
          />
          <p v-if="otpError" class="text-xs text-red-600 mt-1">{{ otpError }}</p>
        </div>

        <div v-if="errorMessage" class="bg-red-100 text-red-700 p-2 rounded text-sm mb-2">
          {{ errorMessage }}
        </div>

        <button
          type="submit"
          class="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-400"
          :disabled="loading"
        >
          {{ loading ? 'Verifying...' : 'Verify Code' }}
        </button>
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { logSecurityClient } from '@/utils/logUtils'
import { getFriendlyError } from '@/utils/handleError'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const otp = ref('')
const errorMessage = ref('')
const loading = ref(false)
const refId = `OTP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
const otpError = ref('')
const touched = reactive({ otp: false })

const validateOtp = () => {
  otpError.value = ''
  if (!otp.value || otp.value.length !== 6 || !/^\d{6}$/.test(otp.value)) {
    otpError.value = 'Please enter the full 6-digit numeric code.'
  }
}

const markTouched = (field) => {
  touched[field] = true
  validateOtp()
}

onMounted(() => {
  document.title = 'Verify OTP | IRC'

  email.value = route.query.email || ''
  if (!email.value) {
    errorMessage.value = `Missing email. Please go back and try again. (Ref: ${refId})`
    logSecurityClient({
      category: 'auth',
      action: 'otp_email_missing',
      details: `No email in query string (refId: ${refId})`,
      severity: 'medium'
    })
  }
})

const onSubmit = async () => {
  errorMessage.value = ''
  loading.value = true
  touched.otp = true
  validateOtp()
  if (otpError.value) {
    loading.value = false
    return
  }
  try {
    const res = await fetch('http://localhost:3001/api/auth/verify-otp', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, otp: otp.value })
    })

    const data = await res.json()

    if (!res.ok) {
      errorMessage.value = data.error
        ? `${data.error} (Ref: ${refId})`
        : `OTP verification failed. (Ref: ${refId})`

      await logSecurityClient({
        category: 'auth',
        action: 'otp_verify_failed',
        details: `OTP failed for ${email.value} (refId: ${refId})`,
        severity: 'medium'
      })
    } else {
      // Fetch session details
      const sessionRes = await fetch('http://localhost:3001/api/auth/me', { credentials: 'include' })
      const sessionData = await sessionRes.json()
      if (sessionRes.ok && sessionData?.user) {
        auth.setUser(sessionData.user)
      }

      await logSecurityClient({
        category: 'auth',
        action: 'otp_verify_success',
        details: `OTP success for ${email.value} (refId: ${refId})`,
        severity: 'low'
      })

      await router.replace({ path: '/userprofile' })
      await router.go()
    }
  } catch (err) {
    errorMessage.value = getFriendlyError(err, 'OTP verification failed.', refId)
    await logSecurityClient({
      category: 'error',
      action: 'otp_verify_network_error',
      details: `Unexpected error for ${email.value} (refId: ${refId})`,
      severity: 'high'
    })
  } finally {
    loading.value = false
  }
}
</script>
