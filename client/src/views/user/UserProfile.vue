<template>
  <section class="flex justify-center items-start px-4 py-10">
    <div class="profile-layout w-full max-w-6xl">
      <!-- LEFT: Profile Box -->
      <div class="w-full lg:max-w-xl bg-white rounded-2xl shadow-xl p-8">
        <h1 class="text-2xl font-bold text-gray-800 mb-6 text-center">Your Profile</h1>
        <template v-if="!editing && !deleting">
          <div v-if="user.profile_image_path" class="mb-4 flex flex-col items-center">
            <img v-if="photoDataURL" :src="photoDataURL" alt="Profile Photo" class="rounded-lg border object-cover max-w-[160px] max-h-[160px]"/>
          </div>
          <div class="mb-5">
            <div class="mb-4"><span class="block font-medium text-gray-600">Name</span><p class="text-lg text-gray-900">{{ user.name }}</p></div>
            <div class="mb-4"><span class="block font-medium text-gray-600">Email</span><p class="text-lg text-gray-900 break-all">{{ user.email }}</p></div>
            <div class="mb-4"><span class="block font-medium text-gray-600">Contact Number</span><p class="text-lg text-gray-900">{{ user.contact }}</p></div>
            <div class="mb-4"><span class="block font-medium text-gray-600">Address</span><p class="text-lg text-gray-900 break-words">{{ user.address }}</p></div>
            <div class="mb-4"><span class="block font-medium text-gray-600">Organization</span><p class="text-lg text-gray-900">{{ user.organization }}</p></div>
          </div>
          <div class="flex flex-col sm:flex-row gap-4 mt-6">
            <button @click="editing = true" class="flex-1 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition">Edit Profile</button>
            <button @click="deleting = true" class="flex-1 py-2 px-4 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition">Delete My Account</button>
          </div>
        </template>

        <!-- Edit Profile Form -->
        <form v-if="editing" @submit.prevent="saveChanges" class="mt-2 space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <p class="text-gray-900 break-all">{{ user.email }}</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">Contact Number</label>
              <input v-model="form.contact" type="text" placeholder="e.g. +65 9123 4567"
                class="w-full border border-gray-300 rounded-lg py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Address</label>
            <input v-model="form.address" type="text" placeholder="e.g. Blk 123 Street 1, #01-01"
              class="w-full border border-gray-300 rounded-lg py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">Organization</label>
            <input v-model="form.organization" type="text" placeholder="Your organization"
              class="w-full border border-gray-300 rounded-lg py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">
                Current Password <span class="text-red-600 font-bold">*</span>
              </label>
              <input v-model="form.currentPassword" type="password" required
                class="w-full border border-gray-300 rounded-lg py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">New Password <span class="text-xs text-gray-400">(optional)</span></label>
              <input v-model="form.newPassword" type="password"
                class="w-full border border-gray-300 rounded-lg py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
            </div>
          </div>
          <div v-if="error" class="bg-red-100 text-red-700 rounded p-2 text-sm">{{ error }}</div>
          <div v-if="success" class="bg-green-50 text-green-700 rounded p-2 text-sm">{{ success }}</div>
          <div class="flex flex-col sm:flex-row gap-4 mt-6">
            <button type="submit" class="flex-1 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition">Save Changes</button>
            <button type="button" class="flex-1 py-2 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow hover:bg-gray-300 transition" @click="editing = false">Cancel</button>
          </div>
        </form>

        <!-- Delete Account Form -->
        <form v-if="deleting" @submit.prevent="deleteAccount" class="mt-2 space-y-4">
          <h2 class="text-xl font-semibold text-red-600">Delete Account</h2>
          <p class="text-sm text-gray-600 mb-2">
            This action is irreversible. You will not be able to log in again unless reactivated by an admin.
          </p>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">
              Confirm Password <span class="text-red-600 font-bold">*</span>
            </label>
            <input v-model="confirmPassword" type="password" required
              class="w-full border border-gray-300 rounded-lg py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-red-500 transition" />
          </div>
          <div class="flex flex-col sm:flex-row gap-4 mt-4">
            <button type="submit" class="flex-1 py-2 px-4 bg-red-600 text-white font-semibold rounded-lg shadow hover:bg-red-700 transition">Delete My Account</button>
            <button type="button" class="flex-1 py-2 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg shadow hover:bg-gray-300 transition" @click="deleting = false">Cancel</button>
          </div>
          <p v-if="deleteMessage" class="text-sm mt-2 text-red-600">{{ deleteMessage }}</p>
        </form>
      </div>

      <!-- RIGHT: Registered Events -->
      <div class="flex-1 bg-white rounded-2xl shadow-xl p-8">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Your Registered Events</h2>
        <ul v-if="registeredEvents.length > 0" class="space-y-4">
          <li v-for="event in registeredEvents" :key="event.id" class="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div class="flex justify-between items-center mb-1">
              <h3 class="text-lg font-bold text-gray-700">{{ event.title }}</h3>
              <button class="ml-2 text-red-600 hover:text-red-800 font-bold text-lg" @click="unregisterFromEvent(event.id)" title="Unregister">✕</button>
            </div>
            <p class="text-sm text-gray-600 mb-0.5">{{ formatDate(event.date) }}</p>
            <p class="text-sm text-gray-600">{{ event.location }}</p>
          </li>
        </ul>
        <p v-else class="text-gray-500 italic mt-6">You haven't registered for any events yet.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, onMounted, computed} from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../../stores/authStore'
import { useToast } from 'vue-toastification'
import { logSecurityClient } from '@/utils/logUtils'
import api from '../../utils/axiosInstance'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()

const editing = ref(false)
const deleting = ref(false)
const loading = ref(false)
const photoDataURL = ref(null)
const error = ref('')
const success = ref('')
const confirmPassword = ref('')
const deleteMessage = ref('')
const refId = `PROFILE-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

const user = reactive({
  name: '',
  email: '',
  contact: '',
  address: '',
  organization: ''
})

const form = reactive({
  contact: '',
  address: '',
  organization: '',
  currentPassword: '',
  newPassword: ''
})

const registeredEvents = ref([])

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

async function fetchProfilePhoto() {
  try {
    const blob = await axios.get("http://localhost:3001/api/user/profile-photo", {
      responseType: "blob",
      withCredentials: true
    }).then(res => res.data);
    photoDataURL.value = await blobToDataURL(blob);
  } catch (error) {
    photoDataURL.value = null;
  }
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('en-SG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    hour12: true
  });
}

const fetchProfile = async () => {
  try {
    const meRes = await axios.get('http://localhost:3001/api/auth/me', { withCredentials: true })
    const profileRes = await axios.get(`http://localhost:3001/api/user/user-profile?email=${encodeURIComponent(meRes.data.user.email)}`, {
      withCredentials: true
    })

    Object.assign(user, profileRes.data)
    form.contact = user.contact
    form.address = user.address
    form.organization = user.organization
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
    await api.delete(`http://localhost:3001/api/user/unregister/${eventId}`, {
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
  if (form.organization && form.organization.length < 2 && form.organization.length > 100) {
    error.value = `Enter a valid organization (2–100 chars). (Ref: ${refId})`
    return false
  }
  if (form.newPassword && form.newPassword.length < 8 && !/[A-Z]/.test(form.newPassword)) {
  error.value = `Password must be at least 8 characters. (Ref: ${refId})`
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
    const { data } = await api.get('/api/auth/csrf-token');
    const csrfToken = data.csrfToken;

    await axios.post(
      'http://localhost:3001/api/user/update-profile',
      {
        email: user.email,
        contact: form.contact,
        address: form.address,
        organization: form.organization,
        currentPassword: form.currentPassword,
        newPassword: form.newPassword || undefined
      },
      {
        withCredentials: true,
        headers: {
          'X-CSRF-Token': csrfToken
        }
      }
    );

    user.contact = form.contact;
    user.address = form.address;
    user.organization = form.organization;
    editing.value = false;
    form.currentPassword = '';
    form.newPassword = '';
    success.value = 'Profile updated successfully.';
    toast.success('Profile updated successfully.');

    await logSecurityClient({
      category: 'user',
      action: 'profile_updated',
      details: `Profile updated for ${user.email} (refId: ${refId})`,
      severity: 'low'
    });
  } catch (err) {
    error.value = err.response?.data?.error || `Update failed. (Ref: ${refId})`;
    await logSecurityClient({
      category: 'error',
      action: 'profile_update_failed',
      details: `Update failed for ${user.email} (refId: ${refId})`,
      severity: 'medium'
    });
  } finally {
    loading.value = false;
  }
};


const deleteAccount = async () => {
  try {
    const { email } = auth.user
    const res = await api.post('http://localhost:3001/api/user/delete-account', {
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
  fetchProfilePhoto()
})
</script>

<style scoped>
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
</style>