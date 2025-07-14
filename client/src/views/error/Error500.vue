<template>
  <div class="error-page">
    <h1>500 - Server Error</h1>
    <p>Oops! Something went wrong on our end.</p>
    <router-link to="/">Try Again or Return Home</router-link>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { log500Error } from '@/utils/logUtils'

onMounted(() => {
  document.title = '500 Server Error | IRC'
  log500Error()
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
