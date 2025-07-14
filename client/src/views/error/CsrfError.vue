<template>
  <div class="error-page">
    <h1>Security Warning</h1>
    <p>Your session has expired or the request was invalid.</p>
    <router-link to="/login">Log in again</router-link>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { logCsrfError } from '@/utils/logUtils'

onMounted(() => {
  document.title = 'CSRF Error | IRC'
  logCsrfError()
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
