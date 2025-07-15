<template>
  <section class="flex justify-center items-center px-4">
    <div class="max-w-md w-full bg-white p-8 rounded-2xl text-center shadow-md">
      <h1 class="text-2xl md:text-3xl font-bold text-green-600 mb-4">Signup Successful 🎉</h1>
      <p class="text-base text-gray-700 mb-6">
        Please check your email for an activation link to complete your registration.
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
  document.title = 'Signup Success | IRC'

  // Optional: track that the user reached this confirmation screen
  logSecurityClient({
    category: 'auth',
    action: 'signup_success_page_view',
    details: 'User landed on signup success confirmation screen',
    severity: 'low'
  })
})
</script>