<template>
  <section class="flex flex-col items-center px-4 py-12 bg-gray-50 min-h-screen">

   <div class="flex justify-between items-center mb-4">
     <h1 class="text-4xl font-bold">Committees History</h1>
   </div>


    <!-- Snapshot list -->
    <ul class="space-y-2 mb-6">
      <li
        v-for="snap in snapshots"
        :key="snap.id"
        class="flex items-center justify-between p-2 border rounded hover:bg-gray-100 cursor-pointer"
        @click="loadSnapshot(snap.id)"
      >
        <span>{{ new Date(snap.taken_at).toLocaleDateString() }}</span>
        <span class="text-sm text-blue-600">View</span>
      </li>
    </ul>

    <div v-if="isLoading" class="text-gray-600">Loading…</div>
    <div v-else-if="error" class="text-red-500">{{ error }}</div>

    <!-- Render the selected snapshot -->
    <div v-else-if="board.leadership.length || board.chair.length" class="space-y-12">
      <div>
        <h2 class="text-2xl font-semibold mb-4">Leadership</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <LeadershipCard
            v-for="slot in board.leadership"
            :key="slot.role"
            :role="slot.role"
            :member="slot.member"
          />
        </div>
      </div>
      <div>
        <h2 class="text-2xl font-semibold mb-4">Chairs</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <ChairCard
            v-for="m in board.chair"
            :key="m.id"
            :member="m"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import LeadershipCard from '../../components/LeadershipCard.vue'
import ChairCard      from '../../components/ChairCard.vue'


const snapshots   = ref([])
const board       = reactive({ leadership: [], chair: [] })
const isLoading   = ref(false)
const error       = ref(null)

async function fetchSnapshots() {
  isLoading.value = true
  error.value = null
  try {
    const { data } = await axios.get('/api/committees/snapshots')
    snapshots.value = data
  } catch (e) {
    error.value = 'Failed to load history'
  } finally {
    isLoading.value = false
  }
}

async function loadSnapshot(id) {
  isLoading.value = true
  error.value = null
  try {
    const { data } = await axios.get(`/api/committees/snapshots/${id}`)
    board.leadership = data.leadership
    board.chair      = data.chair
  } catch {
    error.value = 'Failed to load snapshot'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchSnapshots)
</script>

<style scoped>
/* Tailwind only */
</style>
