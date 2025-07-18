<template>
  <div class="flex items-center justify-center min-h-[80vh] bg-gray-100 px-6 py-12">
    <div v-if="event" class="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-10 transition hover:shadow-2xl hover:-translate-y-1 duration-300">
      <h2 class="text-3xl font-bold text-gray-900 border-b-2 border-gray-200 pb-3 mb-6">
        {{ event.name }}
      </h2>
      <div v-if="event.image_paths?.banner" class="text-center mt-4">
        <h3 class="font-semibold mb-2">Banner</h3>
        <img :src="event.image_paths.banner" class="w-full max-w-3xl rounded shadow mx-auto" />
      </div>

      <div class="space-y-4 text-center text-gray-800 text-lg leading-relaxed">
        <p><span class="font-semibold">📅 Date:</span> {{ formatDate(event.date) }}</p>
        <p><span class="font-semibold">📍 Location:</span> {{ event.location }}</p>
        <p><span class="font-semibold">🎯 Type:</span> {{ event.event_type }}</p>
        <p><span class="font-semibold">📝 Description:</span> {{ event.description }}</p>
      </div>

      <!-- Guest Speakers (smaller images) -->
      <div v-if="event.image_paths?.guests?.length" class="text-center mt-6">
        <h3 class="font-semibold mb-2">Guest Speakers</h3>
        <div class="flex flex-wrap justify-center gap-4">
          <img
            v-for="(img, i) in event.image_paths.guests"
            :key="i"
            :src="img"
            class="w-32 h-32 object-cover rounded shadow"
          />
        </div>
      </div>
      <button
        @click="handleRegisterClick"
        :disabled="!event.poc"
        class="mt-8 w-full py-3 rounded-md font-medium text-white text-lg transition duration-200"
        :class="event.poc ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'"
      >
        Register
      </button>
    </div>

    <div v-else class="text-lg text-gray-600 italic text-center mt-20">
      Event not found.
    </div>

    <!-- Registration Modal -->
    <transition name="fade">
      <div v-if="showModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
          <h3 class="text-lg font-semibold mb-4">Event Registration</h3>
          <form @submit.prevent="submitRegistration">
            <label class="block mb-2">
              Name:
              <input v-model="form.name" type="text" class="w-full mt-1 border rounded px-3 py-2" required />
            </label>
            <label class="block mb-2">
              Email:
              <input v-model="form.email" type="email" class="w-full mt-1 border rounded px-3 py-2" required />
            </label>
            <label class="block mb-2">
              Contact Number:
              <input v-model="form.phone" type="tel" class="w-full mt-1 border rounded px-3 py-2" required />
            </label>
            <label class="block mb-4">
              Number of Pax:
              <input v-model.number="form.pax" type="number" min="1" class="w-full mt-1 border rounded px-3 py-2" required />
            </label>

            <div class="flex justify-end gap-2">
              <button type="button" @click="showModal = false" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
              <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Submit</button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/authStore' // adjust path if needed
const auth = useAuthStore()

const route = useRoute()
const event = ref(null)
const toast = useToast()
const backendURL = import.meta.env.VITE_API_BASE_URL


function formatDate(dateStr) {
  const date = new Date(dateStr);

  return date.toLocaleString('en-SG', {
    dateStyle: 'medium',
    timeStyle: 'short', // 👈 shows time like "6:00 PM"
    hour12: true        // 👈 use 12-hour format
  });
}

import { useRouter } from 'vue-router'
const router = useRouter()

const showModal = ref(false)

const form = ref({
  name: '',
  email: '',
  phone: '',
  pax: 1
})

function handleRegisterClick() {
  if (!auth.user) {
    toast.error('Please login before registering for an event.')
    return
  }
  showModal.value = true
}

onMounted(async () => {
  const slug = route.params.slug;

  try {
    const res = await fetch(`/api/events/${slug}`);
    if (!res.ok) throw new Error('Event not found');

    const eventData = await res.json();

    // Convert each image path to a full data URL (for banner and guest images)
    if (eventData.image_paths) {
      const newImagePaths = {};

      if (eventData.image_paths.banner) {
        const bannerRes = await fetch(`http://localhost:3001${eventData.image_paths.banner}`);
        const bannerBlob = await bannerRes.blob();
        newImagePaths.banner = await blobToDataURL(bannerBlob);
      }

      if (Array.isArray(eventData.image_paths.guests)) {
        newImagePaths.guests = await Promise.all(
          eventData.image_paths.guests.map(async (guestPath) => {
            const guestRes = await fetch(`http://localhost:3001${guestPath}`);
            const guestBlob = await guestRes.blob();
            return await blobToDataURL(guestBlob);
          })
        );
      }

      eventData.image_paths = newImagePaths;
    }

    event.value = eventData;
  } catch (err) {
    console.error('Failed to load event details:', err);
    router.replace({ name: 'NotFound' });
  }
});


// helper
function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function submitRegistration() {
  const slug = route.params.slug

  
  // Basic input validation
  const { name, email, phone, pax } = form.value
  if (!name || !email || !phone || !pax) {
    toast.warning('All fields are required.')
    return
  }

  // Email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    toast.warning('Please enter a valid email address.')
    return
  }

  // Phone format check (SG +65 optional)
  const phoneRegex = /^(?:\+65)?[689]\d{7}$/
  if (!phoneRegex.test(phone)) {
    toast.warning('Please enter a valid Singapore phone number.')
    return
  }

  // Pax must be a positive integer
  const paxNum = parseInt(pax, 10)
  if (isNaN(paxNum) || paxNum < 1) {
    toast.warning('Pax must be a positive number.')
    return
  }
  

  try {
    const res = await fetch(`/api/events/${slug}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        eventId: event.value.id,
        ...form.value
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

    showModal.value = false

  } catch (err) {
    toast.error('Please login before registering for an event.')
  }
}
</script>

<style scoped>

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
/*
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
*/
</style>
