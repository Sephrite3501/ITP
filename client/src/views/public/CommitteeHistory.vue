<template>
  <section class="p-6 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6 text-center">Prior Committees</h1>
    <span class="block w-48 h-1 bg-yellow-400 rounded mb-8 mx-auto"></span>

    <!-- Snapshot selector -->
    <div
      v-if="snapshots.length"
      class="mb-6 flex flex-wrap justify-center gap-2"
    >
      <button
        v-for="snap in snapshots"
        :key="snap.id"
        @click="selectSnapshot(snap.id)"
        :class="[
          'px-3 py-1 rounded font-medium',
          selectedId === snap.id
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        ]"
      >
        {{ formatDate(snap.period_start) }}
      </button>
    </div>

    <!-- Display the period range -->
    <div
      v-if="selectedMeta"
      class="text-center text-gray-600 mb-4"
    >
      Period:
      <strong>{{ formatDate(selectedMeta.period_start) }}</strong>
      –
      <strong>{{ formatDate(selectedMeta.period_end) }}</strong>
    </div>

    <!-- Loading / Error -->
    <div
      v-if="isLoading"
      class="text-gray-600 text-center py-10 animate-pulse"
    >
      Loading…
    </div>
    <div
      v-else-if="error"
      class="text-red-500 text-center py-10"
    >
      {{ error }}
    </div>

    <!-- Table for selected snapshot -->
    <div v-else-if="tableRows.length">
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
        </tbody>
      </table>
    </div>

    <!-- No data message -->
    <div
      v-else-if="!isLoading && !error"
      class="text-gray-500 text-center py-10"
    >
      No snapshot selected or no data available.
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'

const snapshots = ref([])           // { id, period_start, period_end }[]
const selectedId = ref(null)
const selectedMeta = computed(() =>
  snapshots.value.find(s => s.id === selectedId.value)
)

const board = reactive({ leadership: [], member: [] })
const isLoading = ref(false)
const error     = ref(null)

async function fetchSnapshots() {
  isLoading.value = true
  error.value     = null
  try {
    const { data } = await axios.get('/api/committees/snapshots')
    snapshots.value = data
    // auto‑select the most recent
    if (data.length) selectSnapshot(data[0].id)
  } catch (err) {
    console.error('Failed to load snapshot list:', err)
    error.value = 'Unable to load snapshot history.'
  } finally {
    isLoading.value = false
  }
}

async function selectSnapshot(id) {
  selectedId.value = id
  isLoading.value = true
  error.value     = null

  // clear out old board
  board.leadership = []
  board.member     = []

  try {
    const { data } = await axios.get(`/api/committees/snapshots/${id}`)
    board.leadership = data.leadership || []
    board.member     = data.member     || []
  } catch (err) {
    console.error(`Failed to load snapshot ${id}:`, err)
    error.value = 'Unable to load that snapshot.'
  } finally {
    isLoading.value = false
  }
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, {
    year:  'numeric',
    month: 'short',
    day:   'numeric'
  })
}

const tableRows = computed(() => {
  const rows = []
  for (const slot of board.leadership) {
    rows.push({
      position:     slot.role,
      name:         slot.member.name,
      organization: slot.member.organization || ''
    })
  }
  for (const m of board.member) {
    rows.push({
      position:     'Committee Member',
      name:         m.name,
      organization: m.organization || ''
    })
  }
  return rows
})

onMounted(fetchSnapshots)
</script>

<style scoped>
/* Tailwind-only, as above */
</style>
