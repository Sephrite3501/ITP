<template>
  <div class="event-detail-container">
    <div v-if="event" class="event-detail-card">
      <h2>{{ event.name }}</h2>
      <p class="event-date">{{ formatDate(event.date) }}</p>
      <p class="event-location">Location: {{ event.location }}</p>
      <p class="event-type">Type: {{ event.event_type }}</p>
      <p class="event-description">{{ event.description }}</p>
      <p class="event-poc">POC: {{ event.poc ? "Yes" : "No" }}</p>
        <button class="register-button" @click="registerForEvent">
         Register
        </button>
    </div>

    <div v-else class="loading">
      Loading event details...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'

const route = useRoute()
const event = ref(null)
const toast = useToast()

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString()
}

onMounted(async () => {
  const slug = route.params.slug

  try {
    console.log('Fetching event by slug:', slug)
    const res = await fetch(`/api/events/${slug}`)
    console.log('Response status:', res)
    console.log('Fetching event by slug:', slug)

    if (!res.ok) throw new Error('Event not found')
    event.value = await res.json()
  } catch (err) {
    console.error('Failed to load event details:', err)
  }
})

async function registerForEvent() {
  const slug = route.params.slug

  try {
    const res = await fetch(`/api/events/${slug}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add Authorization: Bearer <token> if using login
      },
      body: JSON.stringify({
        eventId: event.value.id,
        userId: 1 // Replace with actual user ID from auth/session
      })
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data?.error || 'Failed to register')
    }

    if (data.message === 'User already registered') {
      toast.info('You are already registered for this event.')
    } else {
      toast.success('Successfully registered for this event!')
    }

  } catch (err) {
    toast.error('Please login Before registering for an event.')
  }
}
</script>

<style scoped>
.event-detail-container {
  padding: 3rem 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  background: #f5f7fa;
}

.event-detail-card {
  background-color: #ffffff;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  max-width: 600px;
  width: 100%;
  transition: transform 0.2s ease;
}

.event-detail-card:hover {
  transform: translateY(-4px);
}

h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: #2c3e50;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0.5rem;
}

.event-date,
.event-location,
.event-type,
.event-description,
.event-poc {
  margin: 1rem 0;
  font-size: 1.05rem;
  color: #444;
  line-height: 1.6;
}

.event-date::before {
  content: "📅 ";
}
.event-location::before {
  content: "📍 ";
}
.event-type::before {
  content: "🎯 ";
}
.event-description::before {
  content: "📝 ";
}
.event-poc::before {
  content: "👤 ";
}

.loading {
  font-size: 1.2rem;
  color: #888;
  font-style: italic;
}

.register-button {
  margin-top: 2rem;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.2s ease;
}

.register-button:hover {
  background-color: #218838;
}

</style>
