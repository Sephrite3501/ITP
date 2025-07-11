<template>
  <section class="p-6 pl-64 bg-[#c0bebe] min-h-screen text-gray-900">
    <h1 class="text-4xl font-bold mb-10 text-green-500">Committees Management</h1>

    <div v-for="role in roles" :key="role" class="mb-16 pb-2.5">
      <div class="bg-white border border-gray-200 rounded-lg shadow-md p-5">
        <h2 class="text-2xl font-semibold mb-4 text-blue-700">{{ role }}</h2>

        <!-- current members -->
        <ul class="space-y-2 mb-4">
          <li
            v-for="m in assignments[role]"
            :key="m.id"
            class="flex items-center justify-between bg-gray-50 p-2 rounded hover:bg-gray-100 transition"
          >
            <span class="text-gray-800 font-medium">{{ m.name }}</span>
            <button
              @click="removeMember(m.id)"
              class="text-red-600 hover:text-red-800 hover:bg-red-100 p-1 px-2 rounded transition"
              title="Remove"
            >✕</button>
          </li>
        </ul>

        <!-- add new -->
        <div class="relative">
          <button
            v-if="!showAdd[role]"
            @click="openAdd(role)"
            class="px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 transition"
          >
            ＋ Add Member
          </button>

          <div v-else class="relative">
            <input
              v-model="searchTerm[role]"
              @input="onSearch(role)"
              @blur="closeAdd(role)"
              class="w-full border rounded px-3 py-2 mt-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400"
              placeholder="Search users…"
              autocomplete="off"
            />

            <ul
              v-if="suggestions[role]?.length"
              class="absolute z-10 bg-white border rounded mt-1 w-full max-h-48 overflow-y-auto shadow-lg"
            >
              <li
                v-for="u in suggestions[role]"
                :key="u.id"
                @mousedown.prevent="addMember(role, u.id)"
                class="px-4 py-2 hover:bg-gray-100 cursor-pointer transition"
              >
                <span class="font-medium text-gray-900">{{ u.name }}</span>
                <span class="text-xs text-gray-500 ml-2">({{ u.email }})</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>



<script setup>
import { reactive, onMounted } from 'vue'
import axios from 'axios'


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

function debounce(fn, wait = 300) {
  let timeout
  return function (...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn.apply(this, args), wait)
  }
}

// 1) Roles matching your server logic
const roles = [
  'General Co-Chair',
  'General Chair',
  'Technical Program Chair',
  'Chair'
]

// 2) Reactive state
const assignments = reactive({})
const showAdd      = reactive({})
const searchTerm   = reactive({})
const suggestions  = reactive({})

// 3) Load assignments
async function fetchAssignments() {
  try {
    const { data } = await axios.get('/api/committees')
    roles.forEach(r => {
      if (r === 'Chair') {
        assignments[r] = data.chair || []
      } else {
        assignments[r] = (data.leadership || [])
          .filter(slot => slot.role === r)
          .map(slot => slot.member)
      }
    })
  } catch (err) {
    console.error('Failed to fetch assignments', err)
    // optionally report to your client-side logger (Sentry, etc.)
  }
}
onMounted(fetchAssignments)

// 4) Add/remove toggles
function openAdd(role) {
  showAdd[role] = true
  searchTerm[role] = ''
  suggestions[role] = []
}
function closeAdd(role) {
  setTimeout(() => (showAdd[role] = false), 100)
}

// 5) Debounced search (prevents DoS/spam)
const debouncedSearch = debounce(async role => {
  const q = searchTerm[role]?.trim()
  if (!q) {
    suggestions[role] = []
    return
  }
  try {
    const { data } = await axios.get('/api/admin/committees/members', {
      params: { search: q }
    })
    suggestions[role] = data.filter(u =>
      !assignments[role].some(m => m.id === u.id)
    )
  } catch (err) {
    console.error('Search error', err)
  }
}, 300)

function onSearch(role) {
  debouncedSearch(role)
}

// 6) Assign a user to a role
async function addMember(role, userId) {
  try {
    await axios.post('/api/committees/leadership', { role, memberId: userId })
    await fetchAssignments()
    showAdd[role] = false
  } catch (err) {
    console.error('Failed to add member', err)
  }
}

// 7) Remove a user from its role
async function removeMember(userId) {
  try {
    await axios.delete('/api/committees/leadership', { data: { memberId: userId } })
    await fetchAssignments()
  } catch (err) {
    console.error('Failed to remove member', err)
  }
}
</script>

<style scoped>
h1
{
  color: #ffffff;
  font-size: 50px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 1rem;
  display: inline-block;
  transition: color 0.3s ease;
}
</style>
