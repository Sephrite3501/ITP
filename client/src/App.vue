<template>
  <div id="app">
    <Navbar />
    <main class="min-h-screen bg-gray-100">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue';
</script>

<style>
/* Optional global fallback styles */
body {
  margin: 0;
  font-family: 'Inter', sans-serif;
}
</style>
