<template>
  <div class="error-page">
    <h1>404 - Page Not Found</h1>
    <p>Oops! The page you're looking for doesn't exist.</p>
    <router-link to="/">Return to Home</router-link>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { log404Access } from '@/utils/logUtils'

onMounted(() => {
  document.title = '404 Not Found | IRC'
  log404Access()
})
</script>

<style scoped>
.error-page {
  text-align: center;
  padding: 4rem 1rem;
}
h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #e83e8c;
}
p {
  font-size: 1.2rem;
  color: #000;
}
a {
  margin-top: 1rem;
  display: inline-block;
  color: #e83e8c;
  text-decoration: underline;
}
</style>
