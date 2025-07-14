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
            <a href="#" @click.prevent="loadRegistrations(event.id, event.name)">
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
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-box">
            <h3>Registered Users - {{ selectedEventName }}</h3>
            <ul>
            <li v-for="user in selectedEventUsers" :key="user.id">
                {{ user.name }} ({{ user.email }})
            </li>
            </ul>
            <button @click="showModal = false" class="close-btn">Close</button>
        </div>
    </div>
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal-box">
            <h3>Add New Event</h3>
            <form @submit.prevent="submitNewEvent">
            <input v-model="newEvent.name" placeholder="Event Name" required />
            <input v-model="newEvent.date" type="date" required />
            <input v-model="newEvent.location" placeholder="Location" />
            <input v-model="newEvent.event_type" placeholder="Type (Workshop, Panel, etc.)" />
            <textarea v-model="newEvent.description" placeholder="Description"></textarea>

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
                <input v-model="eventToEdit.location" placeholder="Location" />
                <input v-model="eventToEdit.event_type" placeholder="Type" />
                <textarea v-model="eventToEdit.description" placeholder="Description"></textarea>

                <label for="edit-poc">PoC Status:</label>
                <select v-model="eventToEdit.poc" id="edit-poc">
                    <option :value="true">Current (PoC)</option>
                    <option :value="false">Past</option>
                </select>

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

const showModal = ref(false)
const selectedEventUsers = ref([])
const selectedEventName = ref('')
const toast = useToast()
const showAddModal = ref(false)
const showOnlyPOC = ref(false)
const filterMode = ref('all')

const showEditModal = ref(false)
const eventToEdit = ref(null)

const events = ref([])

const newEvent = ref({
  name: '',
  date: '',
  location: '',
  event_type: '',
  description: ''
})

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString()
}

async function fetchEvents() {
  const res = await fetch('/api/admin/with-registration-count')
  events.value = await res.json()
}

async function deleteEvent(id) {
  if (!confirm("Are you sure you want to delete this event?")) return
  try {
    const res = await fetch(`/api/admin/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Failed to delete')
    toast.success('Event deleted')
    fetchEvents()
  } catch (err) {
    console.error(err)
    toast.error('Error deleting event')
  }
}

async function loadRegistrations(eventId, eventName) {
  try {
    const res = await fetch(`/api/admin/${eventId}/registrations`)
    selectedEventUsers.value = await res.json()
    selectedEventName.value = eventName
    showModal.value = true
  } catch (err) {
    toast.error('Failed to load registrations')
  }
}

async function submitNewEvent() {
  try {
    const res = await fetch('/api/admin/create-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent.value)
    })

    if (!res.ok) throw new Error('Failed to create event')

    toast.success('Event created successfully!')
    showAddModal.value = false
    fetchEvents()
  } catch (err) {
    console.error(err)
    toast.error('Error creating event')
  }
}

async function submitEditEvent() {
  try {
    const res = await fetch(`/api/admin/edit-event/${eventToEdit.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventToEdit.value)
    })

    if (!res.ok) throw new Error('Failed to update event')

    toast.success('Event updated successfully!')
    showEditModal.value = false
    fetchEvents()
  } catch (err) {
    console.error(err)
    toast.error('Error updating event')
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
  eventToEdit.value = { ...event } // Clone to avoid direct mutation
  showEditModal.value = true
}

onMounted(fetchEvents)
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
