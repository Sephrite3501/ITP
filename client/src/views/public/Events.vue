<template>
  <div class="min-h-screen bg-gray-100 py-12 px-6 max-w-7xl mx-auto">
    <!-- POC Events Section -->
    <section class="mb-12">
      <h2 class="text-2xl font-semibold text-gray-800 mb-6 border-b-2 border-gray-300 pb-2">
        Current Events
      </h2>
      <div class="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-stretch">
        <div
          v-for="event in pocEvents"
          :key="event.id"
          class="flex flex-col justify-between p-6 bg-white rounded-xl shadow-md hover:-translate-y-1 transition-transform duration-200"
        >
          <h3 class="text-lg font-semibold text-gray-800">{{ event.name }}</h3>
          <p class="text-sm text-gray-600 mt-1">{{ formatDate(event.date) }}</p>
          <p class="text-base text-gray-700 mt-2">{{ event.event_type }}</p>
          <div class="flex justify-end mt-4">
            <button
              class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              @click="viewEvent(event.slug)"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Non-POC Events Section -->
    <section>
      <h2 class="text-2xl font-semibold text-gray-800 mb-6 border-b-2 border-gray-300 pb-2">
        Past Events
      </h2>
      <div class="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-stretch">
        <div
          v-for="event in nonPocEvents"
          :key="event.id"
          class="flex flex-col justify-between p-6 bg-white rounded-xl shadow-md opacity-65 grayscale-[20%] hover:-translate-y-1 transition-transform duration-200"
        >
          <h3 class="text-lg font-semibold text-gray-800">{{ event.name }}</h3>
          <p class="text-sm text-gray-600 mt-1">{{ formatDate(event.date) }}</p>
          <p class="text-base text-gray-700 mt-2">{{ event.event_type }}</p>
          <div class="flex justify-end mt-4">
            <button
              class="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              @click="viewEvent(event.slug)"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()

const pocEvents = ref([])
const nonPocEvents = ref([])

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString()
}


function viewEvent(slug) {
  if (slug) {
    router.push(`/events/${slug}`)
  } else {
    console.warn("Invalid event slug:", slug)
  }
}

onMounted(async () => {
  try {
    const res = await fetch('/api/events/getAll')
    const events = await res.json()

    console.log("Fetched events:", events) // Debugging output

    pocEvents.value = events.filter(e => e.poc === true)
    nonPocEvents.value = events.filter(e => e.poc === false)
  } catch (err) {
    console.error("Failed to load events:", err)
  }
})
</script>

<style scoped>
/*
.events-container {
  padding: 3rem 2rem;
  background-color: #f7f9fb;
  min-height: 100vh;
}

.events-section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #ddd;
  padding-bottom: 0.5rem;
}

.event-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.event-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.5rem;
  border-radius: 12px;
  background-color: #ffffff;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease;
}

.event-card:hover {
  transform: translateY(-4px);
}

.event-card.past {
  opacity: 0.65;
  filter: grayscale(0.2);
}

.event-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
}

.event-date {
  font-size: 0.95rem;
  color: #666;
}

.event-description {
  font-size: 1rem;
  color: #555;
  margin-top: 0.5rem;
}

.event-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.2rem;
}

.view-button {
  padding: 0.5rem 1rem;
  font-size: 0.95rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.view-button:hover {
  background-color: #0056b3;
}
*/
</style>
