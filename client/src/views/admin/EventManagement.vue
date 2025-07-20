<template>
  <div class="event-management">
    <div class="event-management-header">
        <h2>Event Management</h2>
        <button class="add-button" @click="showAddModal = true">Add</button>
    </div>
    <table class="event-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Date</th>
          <th>Type</th>
          <th>Location</th>
            <th @click="cycleFilterMode" class="clickable-header">
            Status 
            <span v-if="filterMode === 'current'">🟢 Current</span>
            <span v-else-if="filterMode === 'past'">🟠 Past</span>
            <span v-else>⚪ All</span>
            </th>
          <th>Registrations</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="event in filteredEvents" :key="event.id">
          <td>{{ event.name }}</td>
          <td>{{ formatDate(event.date) }}</td>
          <td>{{ event.event_type }}</td>
          <td>{{ event.location }}</td>
          <td>{{ event.poc ? "Current" : "Past" }}</td>
          <td>
            <a href="#" @click.prevent="loadRegistrations(event.id, event.name), adminViewEvent(event.slug)">
                {{ event.registration_count }}
            </a>
            </td>
          <td>
            <button class="edit-btn" @click="openEditModal(event)">🔧</button>
            <button class="delete-btn" @click="deleteEvent(event.id)">❌</button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal-box">
            <h3>Add New Event</h3>
            <form @submit.prevent="submitNewEvent">
            <input v-model="newEvent.name" placeholder="Event Name" required />
            <input v-model="newEvent.date" type="date" required />
            <input v-model="newEvent.time" type="time" required />
            <input v-model="newEvent.location" placeholder="Location" />
            <input v-model="newEvent.event_type" placeholder="Type (Workshop, Panel, etc.)" />
            <textarea v-model="newEvent.description" placeholder="Description"></textarea>
            <label class="block font-semibold">Banner Image (max 1)</label>
            <input type="file" name="bannerImage" accept="image/*" @change="handleBannerUpload" />

            <label class="block mt-4 font-semibold">Guest Speaker Images (max 2)</label>
            <input type="file" name="guestImages" accept="image/*" multiple @change="handleGuestUpload" />

            <button type="submit" class="submit-btn">Create</button>
            <button type="button" class="close-btn" @click="showAddModal = false">Cancel</button>
            </form>
        </div>
        </div>
    </div>
    <div v-if="showOnlyPOC" class="info-banner">
        Filtering: Showing only PoC (Current) events
    </div>
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal-box">
            <h3>Edit Event</h3>
            <form @submit.prevent="submitEditEvent">
                <input v-model="eventToEdit.name" placeholder="Event Name" required />
                <input v-model="eventToEdit.date" type="date" required />
                <input v-model="eventToEdit.time" type="time" required />
                <input v-model="eventToEdit.location" placeholder="Location" />
                <input v-model="eventToEdit.event_type" placeholder="Type" />
                <textarea v-model="eventToEdit.description" placeholder="Description"></textarea>

                <label for="edit-poc">PoC Status:</label>
                <select v-model="eventToEdit.poc" id="edit-poc">
                    <option :value="true">Current (PoC)</option>
                    <option :value="false">Past</option>
                </select>
                <label class="block mt-3">Banner Image:</label>
                  <input type="file" accept="image/*" @change="onEditBannerChange" />

                  <label class="block mt-3">Guest Speaker Images:</label>
                  <input type="file" accept="image/*" multiple @change="onEditGuestChange" />
                  <small class="text-gray-500">Max 2 guest images</small>
                <button type="submit" class="submit-btn">Update</button>
                <button type="button" class="close-btn" @click="showEditModal = false">Cancel</button>
            </form>
        </div>
        </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'
import axios from 'axios'
import api from '../../utils/axiosInstance'
import DOMPurify from 'dompurify';
const router = useRouter()

const showModal = ref(false)
const selectedEventUsers = ref([])
const selectedEventName = ref('')
const toast = useToast()
const showAddModal = ref(false)
const showOnlyPOC = ref(false)
const filterMode = ref('all')

const bannerImage = ref(null);
const guestImages = ref([]);

const editBannerFile = ref(null)
const editGuestFiles = ref([])

const showEditModal = ref(false)
const eventToEdit = ref(null)

const events = ref([])

const newEvent = ref({
  name: '',
  date: '',
  time: '',
  location: '',
  event_type: '',
  description: '',
  images: []
})

// ————— axios global hardening —————
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL
axios.defaults.withCredentials = true
axios.interceptors.request.use(cfg => {
  const token = getCsrfToken()
  if (token) cfg.headers['X-CSRF-Token'] = token
  return cfg
})

// helper to read CSRF token from a secure, httpOnly cookie set by the server
function getCsrfToken() {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}
function sanitizeInput(value) {
  return DOMPurify.sanitize(String(value || '').trim());
}
function handleBannerUpload(e) {
  bannerImage.value = e.target.files[0] || null;
}

function handleGuestUpload(e) {
  const files = [...e.target.files];
  if (files.length > 2) {
    toast.error("You can only upload up to 2 guest images.");
    guestImages.value = [];
    return;
  }
  guestImages.value = files;
}

function onEditBannerChange(e) {
  editBannerFile.value = e.target.files[0] || null
}

function onEditGuestChange(e) {
  editGuestFiles.value = Array.from(e.target.files).slice(0, 2)
}
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString()
}

async function fetchEvents() {
  const res = await axios.get('/api/admin/with-registration-count')
  events.value = res.data
}

async function deleteEvent(id) {
  if (!confirm("Are you sure you want to delete this event?")) return;

  try {
    await api.delete(`/api/admin/${id}`);
    toast.success('Event deleted');
    fetchEvents();
  } catch (err) {
    console.error('Delete error:', err);

    const message =
      err.response?.data?.error ||
      err.response?.statusText ||
      err.message ||
      "Failed to delete event";

    toast.error(message);
  }
}

async function loadRegistrations(eventId, eventName) {
  try {
    const res = await axios.get(`/api/admin/${eventId}/registrations`)
    selectedEventUsers.value = res.data
    selectedEventName.value = eventName
    showModal.value = true
  } catch (err) {
    toast.error('Failed to load registrations')
  }
}

async function submitNewEvent() {
  if (!newEvent.value.name?.trim()) return toast.error("Event name is required.");
  if (!newEvent.value.date?.trim()) return toast.error("Date is required.");
  if (!newEvent.value.time?.trim()) return toast.error("Time is required.");
  if (!newEvent.value.location?.trim()) return toast.error("Location is required.");
  if (!newEvent.value.event_type?.trim()) return toast.error("Event type is required.");

  // 🧼 Sanitize inputs using your function
  const formData = new FormData();
  formData.append('name', sanitizeInput(newEvent.value.name));
  formData.append('date', sanitizeInput(newEvent.value.date));
  formData.append('time', sanitizeInput(newEvent.value.time));
  formData.append('location', sanitizeInput(newEvent.value.location));
  formData.append('event_type', sanitizeInput(newEvent.value.event_type));
  formData.append('description', sanitizeInput(newEvent.value.description || ''));

  if (bannerImage.value) {
    formData.append('bannerImage', bannerImage.value);
  }

  for (const file of guestImages.value) {
    formData.append('guestImages', file);
  }

  try {
    const { data } = await api.get('/api/auth/csrf-token');
    const csrfToken = data.csrfToken;

    const res = await api.post('/api/admin/create-event', formData, {
      headers: {
        'X-CSRF-Token': csrfToken,
      },
      withCredentials: true,
    });

    toast.success('Event created!');
    showAddModal.value = false;
    fetchEvents();
  } catch (err) {
    console.error("Full error object:", err);

    const message =
      err.response?.data?.error ||
      err.response?.statusText ||
      err.message ||
      "Unknown error";

    toast.error(message);
  }
}





async function submitEditEvent() {
  // Sanitize inputs
  const sanitizedName = sanitizeInput(eventToEdit.value.name);
  const sanitizedDate = sanitizeInput(eventToEdit.value.date);
  const sanitizedTime = sanitizeInput(eventToEdit.value.time);
  const sanitizedLocation = sanitizeInput(eventToEdit.value.location);
  const sanitizedType = sanitizeInput(eventToEdit.value.event_type);
  const sanitizedDesc = sanitizeInput(eventToEdit.value.description);
  const sanitizedPoc = sanitizeInput(eventToEdit.value.poc);

  if (!sanitizedName) return toast.error("Event name is required.");
  if (!sanitizedDate) return toast.error("Date is required.");
  if (!sanitizedTime) return toast.error("Time is required.");
  if (!sanitizedLocation) return toast.error("Location is required.");
  if (!sanitizedType) return toast.error("Event type is required.");
  if (!sanitizedDesc) return toast.error("Description is required.");

  try {
    const formData = new FormData();
    formData.append('name', sanitizedName);
    formData.append('date', `${sanitizedDate}T${sanitizedTime}`);
    formData.append('location', sanitizedLocation);
    formData.append('event_type', sanitizedType);
    formData.append('description', sanitizedDesc);
    formData.append('poc', sanitizedPoc);

    if (editBannerFile.value) {
      formData.append("bannerImage", editBannerFile.value);
    }

    for (let i = 0; i < editGuestFiles.value.length; i++) {
      formData.append("guestImages", editGuestFiles.value[i]);
    }

    const { data } = await api.get('/api/auth/csrf-token');
    const csrfToken = data.csrfToken;

    await api.put(`/api/admin/edit-event/${eventToEdit.value.id}`, formData, {
      headers: {
        'X-CSRF-Token': csrfToken,
      },
      withCredentials: true,
    });

    toast.success('Event updated successfully!');
    showEditModal.value = false;
    fetchEvents();
  } catch (err) {
    console.error('Edit error:', err);

    const message =
      err.response?.data?.error || 
      err.response?.statusText || 
      err.message || 
      "Unknown error";

    toast.error(message);
  }
}




const filteredEvents = computed(() => {
  return events.value.filter(e => {
    if (filterMode.value === 'current') return e.poc === true
    if (filterMode.value === 'past') return e.poc === false
    return true // all
  })
})

function cycleFilterMode() {
  if (filterMode.value === 'all') filterMode.value = 'current'
  else if (filterMode.value === 'current') filterMode.value = 'past'
  else filterMode.value = 'all'
}

function openEditModal(event) {
  const isoDate = new Date(event.date).toISOString();
  const [datePart, timePartWithMs] = isoDate.split('T');
  const time24h = timePartWithMs.slice(0, 5); // e.g., "14:30"

  eventToEdit.value = {
    ...event,
    date: datePart,
    time: time24h
  };

  showEditModal.value = true;
}

onMounted(fetchEvents)


function adminViewEvent(slug) {
  if (slug) {
    router.push(`/admin/event-management/${slug}`)
  } else {
    console.warn("Invalid event slug:", slug)
  }
}
</script>

<style scoped>
.event-management {
  padding: 2rem;
}

h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.event-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.event-table th,
.event-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eaeaea;
}

.delete-btn {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #d9534f;
}

.delete-btn:hover {
  color: #c9302c;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-box {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  width: 400px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.close-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.event-management-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.add-button {
  padding: 0.5rem 1rem;
  background-color: #91afc6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.add-button:hover {
  background-color: #91afc6;
}

.modal-box form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modal-box input,
.modal-box textarea {
  padding: 0.5rem;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.submit-btn {
  padding: 0.5rem;
  background-color: #91afc6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.submit-btn:hover {
  background-color: #0056b3;
}

.clickable-header {
  cursor: pointer;
  color: #007bff;
  user-select: none;
}
.clickable-header:hover {
  text-decoration: underline;
}

.info-banner {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background-color: #e9f7ef;
  color: #155724;
  border-left: 5px solid #28a745;
  border-radius: 6px;
}

.clickable-header {
  cursor: pointer;
  color: #007bff;
  user-select: none;
}

.clickable-header:hover {
  text-decoration: underline;
}
.action-cell button {
  margin-right: 0.5rem;
}

select {
  padding: 0.4rem;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
}
</style>
