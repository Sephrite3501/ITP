<template>
  <section class="flex items-center justify-center px-4">
    <div class="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8 sm:p-12 text-center">
      <h1 class="text-2xl sm:text-3xl font-bold text-green-600 mb-4">
        Password Reset Successful 🎉
      </h1>
      <p class="text-base text-gray-700 mb-8">
        You can now log in using your new password.
      </p>
      <router-link
        to="/login"
        class="inline-block px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition"
      >
        Go to Login
      </router-link>
    </div>
  </section>
</template>

<script setup>
import { onMounted } from 'vue'
import { logSecurityClient } from '@/utils/logUtils'

onMounted(() => {
  document.title = 'Password Reset Success | IRC'

  logSecurityClient({
    category: 'auth',
    action: 'reset_success_page_view',
    details: 'User landed on reset password success page',
    severity: 'low'
  })
})
</script>