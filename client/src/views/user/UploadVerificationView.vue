<template>
  <section class="upload-container">
    <div class="upload-box">
      <h1 class="upload-title">Upload Verification Documents</h1>
      <p class="upload-subtext">
        Please upload the following documents to verify your account:
      </p>

      <form @submit.prevent="uploadDocuments" enctype="multipart/form-data">
        <div class="form-group">
          <label for="idDocument">ID Document</label>
          <input id="idDocument" type="file" @change="e => handleFileChange(e, 'id')" required />
        </div>

        <div class="form-group">
          <label for="proofAddress">Proof of Address</label>
          <input id="proofAddress" type="file" @change="e => handleFileChange(e, 'address')" required />
        </div>

        <button type="submit" :disabled="uploading">
          {{ uploading ? 'Uploading...' : 'Submit Documents' }}
        </button>

        <p v-if="uploadStatus" :class="['upload-status', uploadStatus.includes('Failed') ? 'text-error' : 'text-success']">
          {{ uploadStatus }}
        </p>
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const idFile = ref(null)
const addressFile = ref(null)
const uploading = ref(false)
const uploadStatus = ref('')
const router = useRouter()

function handleFileChange(event, type) {
  const file = event.target.files[0]
  if (type === 'id') idFile.value = file
  if (type === 'address') addressFile.value = file
}

async function uploadDocuments() {
  uploadStatus.value = ''
  uploading.value = true

  const formData = new FormData()
  formData.append('paymentProof', idFile.value)
  formData.append('identityProof', addressFile.value)


  try {
    const res = await fetch('http://localhost:3001/api/user/upload-documents', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    })
    const result = await res.json()
    if (!res.ok) throw new Error(result.error || 'Upload failed')
    uploadStatus.value = result.message || 'Documents uploaded!'
    router.push('/userprofile')
  } catch (err) {
    uploadStatus.value = 'Failed to upload. Please try again.'
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.upload-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem 1rem;
  min-height: 80vh;
  background: #f9fafb;
}

.upload-box {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.upload-title {
  font-size: 1.75rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 0.5rem;
  color: #111827;
}

.upload-subtext {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #4b5563;
  font-size: 0.95rem;
}

.form-group {
  margin-bottom: 1.2rem;
}

label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.4rem;
  color: #374151;
}

input[type="file"] {
  width: 100%;
}

button {
  width: 100%;
  padding: 0.75rem;
  background: #2563eb;
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
}

.upload-status {
  margin-top: 1rem;
  font-size: 0.9rem;
  text-align: center;
}

.text-success {
  color: #15803d;
}

.text-error {
  color: #dc2626;
}
</style>
