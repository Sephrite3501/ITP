<template>
  <section class="p-6 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6 text-center">Committees</h1>
    <span class="block w-48 h-1 bg-yellow-400 rounded mb-8 mx-auto"></span>

    <!-- Loading / Error -->
    <div v-if="isLoading" class="text-gray-600 text-center py-10 animate-pulse">
      Loading…
    </div>
    <div v-else-if="error" class="text-red-500 text-center py-10">
      {{ error }}
    </div>

    <!-- Table -->
    <div v-else>
      <table class="table-auto w-full border-collapse">
        <thead>
          <tr class="bg-gray-200">
            <th class="px-4 py-2 border text-left">Position</th>
            <th class="px-4 py-2 border text-left">Name</th>
            <th class="px-4 py-2 border text-left">Organization</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, idx) in tableRows"
            :key="`${row.position}-${row.name}-${idx}`"
            class="even:bg-gray-50"
          >
            <td class="px-4 py-2 border">{{ row.position }}</td>
            <td class="px-4 py-2 border">{{ row.name }}</td>
            <td class="px-4 py-2 border">{{ row.organization }}</td>
          </tr>
          <tr v-if="!tableRows.length">
            <td colspan="3" class="px-4 py-2 border text-center text-gray-500">
              No committee data available.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL
axios.defaults.withCredentials = true
axios.defaults.headers.common['Cache-Control'] = 'no-store'
axios.interceptors.request.use(cfg => {
  const m = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  if (m) cfg.headers['X-CSRF-Token'] = decodeURIComponent(m[1])
  return cfg
})

const raw       = ref({ leadership: [], member: [] })
const isLoading = ref(true)
const error     = ref(null)

async function fetchCommittees() {
  isLoading.value = true
  error.value     = null
  try {
    const { data } = await axios.get('/api/committees')

    raw.value.leadership = data.leadership || []
    raw.value.member     = data.member     || []
  } catch (err) {
    console.error('Failed to load committees:', err)
    error.value = 'Failed to load committees.'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchCommittees)

const tableRows = computed(() => {
  const rows = []
  // 1) leadership slots in the order your API returned them
  for (const slot of raw.value.leadership) {
    rows.push({
      position:     slot.role,
      name:         slot.member.name,
      organization: slot.member.organization || ''
    })
  }
  // 2) then each committee member
  for (const m of raw.value.member) {
    rows.push({
      position:     'Committee Member',
      name:         m.name,
      organization: m.organization || ''
    })
  }
  return rows
})
</script>

<style scoped>
.leadership-cols,
.chair-cols {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (min-width: 640px) {
  .leadership-cols,
  .chair-cols {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .leadership-cols > * {
    flex: 1 1 calc(50% - 0.75rem); /* 2 items per row on sm+ */
  }
  .chair-cols > * {
    flex: 1 1 calc(33.333% - 0.75rem); /* 3 items per row on sm+ */
  }
}

@media (min-width: 768px) {
  .leadership-cols > * {
    flex: 1 1 calc(33.333% - 0.75rem); /* 3 items per row on md+ */
  }
  .chair-cols > * {
    flex: 1 1 calc(25% - 0.75rem); /* 4 items per row on md+ */
  }
}

@media (min-width: 1024px) {
  .chair-cols > * {
    flex: 1 1 calc(16.666% - 0.75rem); /* 6 items per row on lg+ */
  }
}

img {
  display: block;
}
</style>
