<template>
  <section class="p-6">
    <h1 class="text-2xl font-bold mb-6">Verification Queue</h1>

    <table class="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
      <thead class="bg-gray-100 text-gray-600 uppercase text-sm">
        <tr>
          <th class="py-3 px-4">Name</th>
          <th class="py-3 px-4">Email</th>
          <th class="py-3 px-4">Submitted</th>
          <th class="py-3 px-4">Documents</th>
          <th class="py-3 px-4">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in queue" :key="user.id" class="text-gray-700">
          <td class="py-2 px-4">{{ user.name }}</td>
          <td class="py-2 px-4">{{ user.email }}</td>
          <td class="py-2 px-4">{{ new Date(user.submitted_at).toLocaleString() }}</td>
          <td class="py-2 px-4">
            <a :href="`http://localhost:3001/uploads/${user.payment_proof_path?.split('/').pop()}`" target="_blank">Payment</a> |
            <a :href="`http://localhost:3001/uploads/${user.identity_proof_path?.split('/').pop()}`" target="_blank">ID</a>
          </td>
          <td class="py-2 px-4">
            <button @click="approveUser(user.id)" class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Approve</button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="message" class="mt-4 text-green-600">{{ message }}</p>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const queue = ref([])
const message = ref('')

const fetchQueue = async () => {
  const res = await axios.get('http://localhost:3001/api/user/admin/verification-queue', { withCredentials: true })
  queue.value = res.data
}

const approveUser = async (userId) => {
  try {
    await axios.post('http://localhost:3001/api/user/admin/approve-user', { userId }, { withCredentials: true })
    message.value = `User ${userId} approved.`
    await fetchQueue() // Refresh list
  } catch (err) {
    console.error('Approval failed:', err)
    message.value = err.response?.data?.error || 'Approval failed.'
  }
}

onMounted(fetchQueue)
</script>
