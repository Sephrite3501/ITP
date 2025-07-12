<template>
  <section class="flex flex-col items-center px-4 py-12 bg-gray-50 min-h-screen">
    <!-- Page Title -->
    <div class="flex justify-between items-center mb-4">
     <h1 class="text-4xl font-bold">Committees</h1>
   </div>
    <span class="block w-24 h-1 bg-yellow-400 rounded-lg mb-10"></span>

    <!-- Loading / Error Handling -->
    <div v-if="isLoading" class="text-gray-600 text-lg py-10 animate-pulse">Loading…</div>
    <div v-else-if="error" class="text-red-500 py-10 text-center text-lg font-medium">{{ error }}</div>

    <div v-else class="w-full max-w-7xl">
      <!-- Leadership Row -->
      <div class="mb-12">
        <h2 class="text-2xl font-semibold text-gray-700 mb-6 text-center">Leadership</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 place-items-center gap-10 m-5">
          <LeadershipCard
            v-for="slot in leadership"
            :key="slot.role"
            :role="slot.role"
            :member="slot.member"
          />
        </div>
      </div>

      <!-- Chair Grid -->
      <div>
        <h2 class="text-2xl font-extrabold text-gray-700 mb-6 text-center">Committee Members</h2>
        <div
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6"
        >
          <ChairCard
            v-for="m in member"
            :key="m.id"
            :member="m"
          />
        </div>
      </div>
    </div>
  </section>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

import LeadershipCard from '../../components/LeadershipCard.vue'
import ChairCard      from '../../components/ChairCard.vue'

// ─── axios global hardening ─────────────────────────────────────────
// (same as before: baseURL, withCredentials, CSRF token, cache-control)
axios.defaults.baseURL         = import.meta.env.VITE_API_BASE_URL
axios.defaults.withCredentials = true
axios.defaults.headers.common['Cache-Control'] = 'no-store'
axios.interceptors.request.use(cfg => {
  const m = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  if (m) cfg.headers['X-CSRF-Token'] = decodeURIComponent(m[1])
  return cfg
})

// ─── Reactive state & data fetch ────────────────────────────────────
const raw       = ref({ leadership: [], member: [] })
const isLoading = ref(true)
const error     = ref(null)

// Make sanitizeMember safe against missing fields
function sanitizeMember(member = {}) {
  return {
    ...member,
    name:  typeof member.name  === 'string'
            ? member.name.replace(/</g, '&lt;').replace(/>/g, '&gt;')
            : '',
    email: typeof member.email === 'string'
            ? member.email.replace(/</g, '&lt;').replace(/>/g, '&gt;')
            : ''
  }
}

async function fetchCommittees() {
  isLoading.value = true
  try {
    const { data } = await axios.get('/api/committees')

    raw.value.leadership = Array.isArray(data.leadership)
      ? data.leadership.map(slot => ({
          role: slot.role,
          member: sanitizeMember(slot.member)
        }))
      : []

    raw.value.member = Array.isArray(data.member)
      ? data.member.map(m => sanitizeMember(m))
      : []

  } catch (err) {
    console.error('Failed to load committees:', err)
    error.value = 'Failed to load committees'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchCommittees)

const leadership = computed(() => raw.value.leadership)
const member      = computed(() => raw.value.member)
</script>

<style scoped>

img {
  display: block;
}
</style>
