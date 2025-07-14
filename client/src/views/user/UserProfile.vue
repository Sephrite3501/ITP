<template>
  <section class="profile-container">
    <div class="profile-layout">
      <!-- LEFT: Profile Box -->
      <div class="profile-box">
        <h1 class="profile-title">Your Profile</h1>

        <template v-if="!editing && !deleting">
          <div class="profile-field">
            <label>Name</label>
            <p>{{ user.name }}</p>
          </div>
          <div class="profile-field">
            <label>Email</label>
            <p>{{ user.email }}</p>
          </div>
          <div class="profile-field">
            <label>Contact Number</label>
            <p>{{ user.contact }}</p>
          </div>
          <div class="profile-field">
            <label>Address</label>
            <p>{{ user.address }}</p>
          </div>

          <div class="form-actions">
            <button @click="editing = true" class="edit-button">Edit Profile</button>
            <button @click="deleting = true" class="btn-danger">Delete My Account</button>
          </div>
        </template>

        <!-- Edit Profile Form -->
        <form v-if="editing" @submit.prevent="saveChanges" class="profile-form">
          <div class="form-row">
            <div class="form-group">
              <label>Email</label>
              <p>{{ user.email }}</p>
            </div>
            <div class="form-group">
              <label>Contact Number</label>
              <input v-model="form.contact" type="text" placeholder="e.g. +65 9123 4567" />
            </div>
          </div>

          <div class="form-group">
            <label>Address</label>
            <input v-model="form.address" type="text" placeholder="e.g. Blk 123 Street 1, #01-01" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Current Password <span class="required">*</span></label>
              <input v-model="form.currentPassword" type="password" required />
            </div>
            <div class="form-group">
              <label>New Password <small>(optional)</small></label>
              <input v-model="form.newPassword" type="password" />
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="save-button">Save Changes</button>
            <button type="button" class="cancel-button" @click="editing = false">Cancel</button>
          </div>
        </form>

        <!-- Delete Account Form -->
        <form v-if="deleting" @submit.prevent="deleteAccount" class="profile-form">
          <h2 class="text-xl font-semibold text-red-600">Delete Account</h2>
          <p class="text-sm text-gray-600 mb-3">
            This action is irreversible. You will not be able to log in again unless reactivated by an admin.
          </p>

          <div class="form-group">
            <label>Confirm Password <span class="required">*</span></label>
            <input v-model="confirmPassword" type="password" required />
          </div>

          <div class="form-actions">
            <button type="submit" class="btn-danger">Delete My Account</button>
            <button type="button" class="cancel-button" @click="deleting = false">Cancel</button>
          </div>

          <p v-if="deleteMessage" class="text-sm mt-2 text-red-600">{{ deleteMessage }}</p>
        </form>
      </div>

      <!-- RIGHT: Registered Events -->
      <div class="registered-events">
        <h2 class="section-title">Your Registered Events</h2>
        <ul v-if="registeredEvents.length > 0">
          <li v-for="event in registeredEvents" :key="event.id" class="event-card">
            <div class="event-header">
              <h3>{{ event.title }}</h3>
              <button class="unregister-button" @click="unregisterFromEvent(event.id)">✕</button>
            </div>
            <p>{{ event.date }}</p>
            <p>{{ event.location }}</p>
          </li>
        </ul>
        <p v-else class="no-events">You haven't registered for any events yet.</p>
      </div>
    </div>
  </section>
</template>


<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../../stores/authStore'
import { useToast } from 'vue-toastification'
import { logSecurityClient } from '@/utils/logUtils'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const editing = ref(false)
const deleting = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')
const confirmPassword = ref('')
const deleteMessage = ref('')
const refId = `PROFILE-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

const user = reactive({
  name: '',
  email: '',
  contact: '',
  address: ''
})

const form = reactive({
  contact: '',
  address: '',
  currentPassword: '',
  newPassword: ''
})

const registeredEvents = ref([])

const fetchProfile = async () => {
  try {
    const meRes = await axios.get('http://localhost:3001/api/auth/me', { withCredentials: true })
    const profileRes = await axios.get(`http://localhost:3001/api/user/user-profile?email=${encodeURIComponent(meRes.data.user.email)}`, {
      withCredentials: true
    })

    Object.assign(user, profileRes.data)
    form.contact = user.contact
    form.address = user.address
  } catch (err) {
    error.value = `Failed to load profile. Please login again. (Ref: ${refId})`
    await logSecurityClient({
      category: 'error',
      action: 'profile_load_failed',
      details: `Failed to load profile (refId: ${refId})`,
      severity: 'high'
    })
    router.push('/login')
  }
}

const fetchRegisteredEvents = async () => {
  try {
    const res = await axios.get('http://localhost:3001/api/user/registered-events', {
      withCredentials: true
    })
    registeredEvents.value = res.data || []
  } catch (err) {
    await logSecurityClient({
      category: 'error',
      action: 'fetch_registered_events_failed',
      details: `Failed to fetch registered events (refId: ${refId})`,
      severity: 'low'
    })
  }
}

const unregisterFromEvent = async (eventId) => {
  try {
    await axios.delete(`http://localhost:3001/api/user/unregister/${eventId}`, {
      withCredentials: true
    })
    registeredEvents.value = registeredEvents.value.filter(e => e.id !== eventId)
    toast.success(`Successfully unregistered from event.`)

    await logSecurityClient({
      category: 'user',
      action: 'event_unregistered',
      details: `User unregistered from event ID ${eventId} (refId: ${refId})`,
      severity: 'low'
    })
  } catch (err) {
    toast.error(`Failed to unregister from event. (Ref: ${refId})`)
    await logSecurityClient({
      category: 'error',
      action: 'event_unregister_failed',
      details: `Failed to unregister from event ID ${eventId} (refId: ${refId})`,
      severity: 'medium'
    })
  }
}

const validateInputs = () => {
  if (!/^[\d+\s\-]{7,15}$/.test(form.contact)) {
    error.value = `Enter a valid contact number. (Ref: ${refId})`
    return false
  }
  if (form.address.length < 5 || form.address.length > 100) {
    error.value = `Enter a valid address (5–100 chars). (Ref: ${refId})`
    return false
  }
  return true
}

const saveChanges = async () => {
  error.value = ''
  success.value = ''
  loading.value = true

  if (!validateInputs()) {
    loading.value = false
    return
  }

  try {
    await axios.post(
      'http://localhost:3001/api/user/update-profile',
      {
        email: user.email,
        contact: form.contact,
        address: form.address,
        currentPassword: form.currentPassword,
        newPassword: form.newPassword || undefined
      },
      { withCredentials: true }
    )

    user.contact = form.contact
    user.address = form.address
    editing.value = false
    form.currentPassword = ''
    form.newPassword = ''
    success.value = 'Profile updated successfully.'

    await logSecurityClient({
      category: 'user',
      action: 'profile_updated',
      details: `Profile updated for ${user.email} (refId: ${refId})`,
      severity: 'low'
    })
  } catch (err) {
    error.value = err.response?.data?.error || `Update failed. (Ref: ${refId})`
    await logSecurityClient({
      category: 'error',
      action: 'profile_update_failed',
      details: `Update failed for ${user.email} (refId: ${refId})`,
      severity: 'medium'
    })
  } finally {
    loading.value = false
  }
}

const deleteAccount = async () => {
  try {
    const { email } = auth.user
    const res = await axios.post('http://localhost:3001/api/user/delete-account', {
      email,
      currentPassword: confirmPassword.value
    }, { withCredentials: true })

    // Show success toast
    toast.success(res.data.message || 'Account deleted successfully.')

    await logSecurityClient({
      category: 'user',
      action: 'account_deleted',
      details: `User ${email} deleted their account (refId: ${refId})`,
      severity: 'high'
    })

    // Clear user state and redirect
    auth.clearUser()
    await axios.post('/api/auth/logout', {}, { withCredentials: true }) // optional cleanup
    router.push('/login')

  } catch (err) {
    const msg = err.response?.data?.error || `Failed to delete account. (Ref: ${refId})`
    toast.error(msg)
    deleteMessage.value = msg

    await logSecurityClient({
      category: 'error',
      action: 'account_deletion_failed',
      details: `Deletion failed for ${auth.user.email} (refId: ${refId})`,
      severity: 'high'
    })
  }
}


onMounted(() => {
  document.title = 'User Profile | IRC'
  fetchProfile()
  fetchRegisteredEvents()
})
</script>


<style scoped>
.profile-container {
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
  background: #f9fafb;
  min-height: 80vh;
}

.profile-box {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.profile-title {
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2rem;
  color: #111827;
}

.profile-field {
  margin-bottom: 1rem;
}
.profile-field label {
  font-weight: 500;
  color: #374151;
}
.profile-field p {
  margin: 0.25rem 0;
  font-size: 1rem;
  color: #111827;
}

.edit-button,
.btn-danger,
.cancel-button,
.save-button {
  margin-top: 1rem;
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.edit-button {
  background: #2563eb;
  color: white;
}
.cancel-button {
  background: #e5e7eb;
  color: #374151;
}
.save-button {
  background: #2563eb;
  color: white;
  margin-bottom: 0.5rem;
}

.form-group {
  margin-bottom: 1.2rem;
  flex: 1;
}
.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.3rem;
  color: #374151;
}
.form-group input {
  width: 100%;
  padding: 0.6rem;
  font-size: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}
.form-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 640px) {
  .form-row {
    flex-direction: row;
  }
}

.required {
  color: #dc2626;
  margin-left: 0.25rem;
}

input {
  color: #111827; /* visible text */
  background-color: white;
}

input::placeholder {
  color: #6b7280; /* visible placeholder */
}

p {
  color: #111827; /* visible text */
  background-color: white;
}

.profile-form input {
  padding: 0.6rem;
  font-size: 1rem;
  border-radius: 6px;
  border: 1px solid #d1d5db;
}

.profile-form label {
  font-weight: 500;
  margin-bottom: 0.3rem;
  color: #374151;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (min-width: 640px) {
  .form-actions {
    flex-direction: row;
    justify-content: flex-start;
  }
}

.btn-danger {
  background: #dc2626;
  color: white;
  margin-bottom: 0.5rem;
}

.profile-layout {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
}

@media (min-width: 1024px) {
  .profile-layout {
    flex-direction: row;
    align-items: flex-start;
  }
}

.registered-events {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  flex: 1;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  max-height: 100%;
  overflow-y: auto;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #111827;
}

.event-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  background-color: #f9fafb;
}

.event-card h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #1f2937;
}

.event-card p {
  margin: 0.3rem 0;
  color: #4b5563;
}

.no-events {
  color: #6b7280;
  font-style: italic;
}

.unregister-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #dc2626;
  cursor: pointer;
  padding: 0;
  margin-left: 1rem;
  line-height: 1;
}

.unregister-button:hover {
  color: #b91c1c;
}
.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

</style>