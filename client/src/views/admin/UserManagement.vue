<template>
  <section class="flex justify-center px-4 py-10">
    <div class="w-full max-w-6xl bg-white rounded-2xl shadow-xl p-6 sm:p-10">
      <h1 class="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-8">User Management</h1>

      <!-- Filter row -->
      <div class="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <input
          v-model="search"
          type="text"
          placeholder="Search by name or email"
          class="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
        <select
          v-model="statusFilter"
          class="w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
          <option value="locked">Locked</option>
        </select>
      </div>

      <!-- User table -->
      <div class="overflow-x-auto">
        <table class="w-full table-auto border-collapse text-sm">
          <thead>
            <tr class="bg-gray-100 text-gray-800">
              <th class="p-3 text-left">Name</th>
              <th class="p-3 text-left">Email</th>
              <th class="p-3 text-left">Contact</th>
              <th class="p-3 text-left">Type</th>
              <th class="p-3 text-left">Status</th>
              <th class="p-3 text-left">Role</th>
              <th class="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in paginatedUsers" :key="user.id" class="border-b border-gray-200">
              <td class="p-3 text-gray-700">{{ user.name }}</td>
              <td class="p-3 text-gray-700 break-all">{{ user.email }}</td>
              <td class="p-3 text-gray-700">{{ user.contact }}</td>
              <td class="p-3 text-gray-700">{{ user.member_type }}</td>
              <td class="p-3 text-gray-700 capitalize">{{ user.account_status }}</td>
              <td class="p-3 text-gray-700 capitalize">{{ user.user_role }}</td>
              <td class="p-3 space-x-2">
                <button
                  v-if="user.account_status !== 'locked'"
                  @click="updateStatus(user.id, 'lock')"
                  class="px-2 py-1 rounded bg-blue-600 text-white text-xs hover:bg-blue-700 transition"
                >
                  Lock
                </button>
                <button
                  v-if="user.account_status === 'locked'"
                  @click="updateStatus(user.id, 'unlock')"
                  class="px-2 py-1 rounded bg-yellow-500 text-white text-xs hover:bg-yellow-600 transition"
                >
                  Unlock
                </button>
                <button
                  @click="updateStatus(user.id, 'delete')"
                  class="px-2 py-1 rounded bg-red-600 text-white text-xs hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex justify-center items-center gap-4 mt-6">
        <button
          @click="prevPage"
          :disabled="page === 1"
          class="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          Prev
        </button>
        <span class="text-gray-700 font-medium">Page {{ page }}</span>
        <button
          @click="nextPage"
          :disabled="page * limit >= filteredUsers.length"
          class="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          Next
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { logSecurityClient } from '@/utils/logUtils'

const toast = useToast()
const users = ref([])
const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const limit = 10

onMounted(() => {
  document.title = 'Admin | User Management'
  fetchUsers()
})

const fetchUsers = async () => {
  try {
    const res = await fetch('http://localhost:3001/api/admin/users', { credentials: 'include' })
    const data = await res.json()
    users.value = data.users || []
  } catch (err) {
    toast.error('Failed to load user list.')
  }
}

const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(search.value.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.value.toLowerCase())
    const matchesStatus = !statusFilter.value || user.account_status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const paginatedUsers = computed(() => {
  const start = (page.value - 1) * limit
  return filteredUsers.value.slice(start, start + limit)
})

const nextPage = () => {
  if (page.value * limit < filteredUsers.value.length) page.value++
}
const prevPage = () => {
  if (page.value > 1) page.value--
}

const updateStatus = async (userId, action) => {
  const refId = `ADMIN-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  const endpoints = {
    lock: 'lock-user',
    unlock: 'unlock-user',
    delete: 'delete-user'
  }

  try {
    const res = await fetch(`http://localhost:3001/api/admin/${endpoints[action]}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Request failed')

    toast.success(data.message || `${action} successful`)
    await logSecurityClient({
      category: 'admin',
      action: `admin_${action}_user`,
      refId,
      details: `User ${userId} ${action}ed by admin (refId: ${refId})`,
      severity: 'high'
    })

    await fetchUsers()
  } catch (err) {
    toast.error(`Failed to ${action} user. (Ref: ${refId})`)
    await logSecurityClient({
      category: 'error',
      action: `admin_${action}_failed`,
      refId,
      details: `Failed to ${action} user ${userId} (refId: ${refId})`,
      severity: 'critical'
    })
  }
}
</script>


<!-- <script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { logSecurityClient } from '@/utils/logUtils'

const toast = useToast()
const users = ref([])
const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const limit = 10

onMounted(() => {
  document.title = 'Admin | User Management'
  fetchUsers()
})

const fetchUsers = async () => {
  try {
    const res = await fetch('http://localhost:3001/api/admin/users', { credentials: 'include' })
    const data = await res.json()
    users.value = data.users || []
  } catch (err) {
    toast.error('Failed to load user list.')
  }
}

const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(search.value.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.value.toLowerCase())
    const matchesStatus = !statusFilter.value || user.account_status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

const paginatedUsers = computed(() => {
  const start = (page.value - 1) * limit
  return filteredUsers.value.slice(start, start + limit)
})

const nextPage = () => {
  if (page.value * limit < filteredUsers.value.length) page.value++
}
const prevPage = () => {
  if (page.value > 1) page.value--
}

const updateStatus = async (userId, action) => {
  const refId = `ADMIN-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  const endpoints = {
    lock: 'lock-user',
    unlock: 'unlock-user',
    delete: 'delete-user'
  }

  try {
    const res = await fetch(`http://localhost:3001/api/admin/${endpoints[action]}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Request failed')

    toast.success(data.message || `${action} successful`)
    await logSecurityClient({
      category: 'admin',
      action: `admin_${action}_user`,
      refId,
      details: `User ${userId} ${action}ed by admin (refId: ${refId})`,
      severity: 'high'
    })

    await fetchUsers()
  } catch (err) {
    toast.error(`Failed to ${action} user. (Ref: ${refId})`)
    await logSecurityClient({
      category: 'error',
      action: `admin_${action}_failed`,
      refId,
      details: `Failed to ${action} user ${userId} (refId: ${refId})`,
      severity: 'critical'
    })
  }
}
</script> -->