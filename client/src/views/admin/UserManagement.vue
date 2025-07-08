<template>
  <section class="admin-container">
    <div class="admin-box">
      <h1 class="admin-title">User Management</h1>

      <div class="filter-row">
        <input
          v-model="search"
          class="search-input"
          type="text"
          placeholder="Search by name or email"
        />

        <select v-model="statusFilter" class="status-filter">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <table class="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Contact</th>
            <th>Type</th>
            <th>Status</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in paginatedUsers" :key="user.id">
            <td>{{ user.name }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.contact }}</td>
            <td>{{ user.member_type }}</td>
            <td>{{ user.account_status }}</td>
            <td>{{ user.user_role }}</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button @click="prevPage" :disabled="page === 1">Prev</button>
        <span>Page {{ page }}</span>
        <button @click="nextPage" :disabled="page * limit >= filteredUsers.length">Next</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const users = ref([])
const search = ref('')
const statusFilter = ref('')
const page = ref(1)
const limit = 10

const fetchUsers = async () => {
  try {
    const res = await fetch('http://localhost:3001/api/user/admin/users', { credentials: 'include' })
    const data = await res.json()
    users.value = data.users || []
  } catch (err) {
    console.error('Failed to load users:', err)
  }
}

onMounted(fetchUsers)

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
</script>

<style scoped>
.admin-container {
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
  background: #f9fafb;
  min-height: 80vh;
}
.admin-box {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}
.admin-title {
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1.5rem;
  color: #111827;
}
.filter-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: center;
}
.search-input {
  flex: 1;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  color: #111827;
}
.status-filter {
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  color: #111827;
}
.user-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}
.user-table th,
.user-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
}
.user-table th {
  background: #f3f4f6;
  color: #111827;
}
.pagination {
  display: flex;
  justify-content: center;
  gap: 1rem;
  align-items: center;
}
.pagination button {
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
.pagination button:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}
</style>
