<template>
  <section class="flex justify-center items-center px-4 py-12">
    <div class="w-full max-w-lg bg-white p-8 sm:p-12 rounded-2xl shadow-xl text-center">
      <h1 class="text-2xl md:text-3xl font-bold text-gray-800 mb-8">Account Activation</h1>
      
      <div v-if="loading"
        class="text-base mb-8 p-4 rounded-md text-gray-700 bg-gray-100">
        Activating your account...
      </div>
      
      <div v-else-if="success"
        class="inline-block px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition">
        ✅ Your account has been activated successfully!
        <router-link
          to="/login"
          class="inline-block mt-6 px-6 py-2 rounded-md font-semibold transition text-green-950 hover:text-white hover:bg-green-600 hover:shadow focus:outline-none"
        >
          Go to Login
        </router-link>
      </div>
      
      <div v-else
        class="text-base mb-8 p-4 rounded-md text-red-700 bg-red-50 border border-red-200">
        ❌ {{ error || 'Activation failed or expired.' }}
        <router-link
          to="/signup"
          class="inline-block px-6 py-2 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition"
        >
          Sign Up Again
        </router-link>
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
