<template>
  <section class="flex flex-col items-center justify-center min-h-[60vh] px-4">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10 text-center">
      <h1 class="text-3xl font-extrabold mb-4 text-pink-600">
        500 – Server Error
      </h1>
      <p class="text-gray-700 text-base mb-6">
        Oops! Something went wrong on our end.
      </p>
      <router-link
        to="/"
        class="inline-block mt-2 px-6 py-2 bg-pink-600 text-white font-semibold rounded-lg shadow hover:bg-pink-700 transition"
      >
        Try Again or Return Home
      </router-link>
    </div>
  </section>
</template>

<script setup>
import { onMounted } from 'vue'
import { log500Error } from '@/utils/logUtils'

onMounted(() => {
  document.title = '500 Server Error | IRC'
  log500Error()
})
</script>
