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
            <a :href="`http://localhost:3001/api/protected/download/${user.profile_image_path?.split('/').pop()}`" target="_blank" rel="noopener">Passport Photo</a> |
            <a :href="`http://localhost:3001/api/protected/download/${user.payment_path?.split('/').pop()}`" target="_blank" rel="noopener">Payment</a> |
            <a :href="`http://localhost:3001/api/protected/download/${user.identity_path?.split('/').pop()}`" target="_blank" rel="noopener">ID</a>
          </td>
          <td class="py-2 px-4">
            <button @click="approveUser(user.submission_id, user.user_id, user.name)" class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Approve</button>
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
import { logSecurityClient } from '@/utils/logUtils'
import { useToast } from 'vue-toastification'

const toast = useToast()
const queue = ref([])
const message = ref('')

const fetchQueue = async () => {
  const res = await axios.get('http://localhost:3001/api/admin/verification-queue', { withCredentials: true })
  queue.value = res.data
}

const approveUser = async (submissionId, userId, userName) => {
  const refId = `VERIFY-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  try {
    await axios.post('http://localhost:3001/api/admin/approve-user', {
      submissionId,
      userId
    }, { withCredentials: true })

    // ✅ Show a toast message
    toast.success(`${userName} approved successfully!`, {
      timeout: 3000
    })

    // 📝 Set status message (optional if using toast)
    message.value = `${userName} approved. (Ref: ${refId})`

    await logSecurityClient({
      category: 'admin',
      action: 'approve_user',
      targetUserId: userId,
      refId,
      details: `User ${userName} approved by admin (submissionId=${submissionId})`,
      severity: 'high'
    })

    await fetchQueue()
  } catch (err) {
    message.value = `Approval failed. (Ref: ${refId})`

    toast.error(`Approval failed for ${userName} (Ref: ${refId})`)

    await logSecurityClient({
      category: 'error',
      action: 'approve_user_failed',
      targetUserId: userId,
      refId,
      details: `Failed to approve user ${userName} - ${err?.message}`,
      severity: 'critical'
    })
  }
}

onMounted(() => {
  document.title = 'Admin | Verification'
  fetchQueue()
})
</script>
