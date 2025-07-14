<template>
  <div class="events-container">
    <!-- POC Events Section -->
    <section class="events-section">
      <h2 class="section-title">Current Events</h2>
      <div class="event-list">
        <div v-for="event in pocEvents" :key="event.id" class="event-card">
          <h3 class="event-title">{{ event.name }}</h3>
          <p class="event-date">{{ formatDate(event.date) }}</p>
          <p class="event-description">{{ event.event_type }}</p>

          <div class="event-footer">
            <button class="view-button" @click="viewEvent(event.slug)">View</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Non-POC Events Section -->
    <section class="events-section">
      <h2 class="section-title">Past Events</h2>
      <div class="event-list">
        <div v-for="event in nonPocEvents" :key="event.id" class="event-card past">
          <h3 class="event-title">{{ event.name }}</h3>
          <p class="event-date">{{ formatDate(event.date) }}</p>
          <p class="event-description">{{ event.event_type }}</p>

          <div class="event-footer">
            <button class="view-button" @click="viewEvent(event.slug)">View</button>
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

</style>
