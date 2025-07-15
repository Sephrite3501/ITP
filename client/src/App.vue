<template>
  <div id="app" class="min-h-screen flex flex-col font-sans text-gray-900 bg-gray-50">
    <Navbar />

    <main class="flex-1 px-4 py-6 sm:px-6 lg:px-8 bg-gray-100">
      <router-view />
    </main>

    <footer class="bg-white shadow mt-6 py-4 text-center text-gray-500 text-sm">
      © 2015 International Researchers Club. All rights reserved.
    </footer>
  </div>
</template>

<script setup>
import { useSessionWatcher } from './composables/useSessionWatcher'
useSessionWatcher()

import Navbar from './components/Navbar.vue'
</script>

<style scoped></style>