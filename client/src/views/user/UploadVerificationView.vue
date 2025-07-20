<template>
  <section class="flex items-center justify-center px-2">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10">
      <h1 class="text-2xl font-extrabold text-center text-gray-800 mb-4">
        Upload Verification Documents
      </h1>
      <p class="text-base text-center text-gray-700 mb-8">
        Please upload the following documents to verify your account:
      </p>
      <form @submit.prevent="uploadDocuments" enctype="multipart/form-data" class="space-y-7">
        <div>
          <label for="profilePicture" class="block text-sm font-medium text-gray-700 mb-1">
            Passport Photo
          </label>
          <input
            id="profilePicture"
            type="file"
            class="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            @change="e => handleFileChange(e, 'profile')"
            required
            accept="image/jpeg, image/png"
          />
        </div>
        <div>
          <label for="idDocument" class="block text-sm font-medium text-gray-700 mb-1">
            ID Document
          </label>
          <input
            id="idDocument"
            type="file"
            class="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            @change="e => handleFileChange(e, 'id')"
            required
          />
        </div>
        <div>
          <label for="proofPayment" class="block text-sm font-medium text-gray-700 mb-1">
            Proof of Payment
          </label>
          <input
            id="proofPayment"
            type="file"
            class="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            @change="e => handleFileChange(e, 'payment')"
            required
          />
        </div>
        <button
          type="submit"
          class="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
          :disabled="uploading"
        >
          {{ uploading ? 'Uploading...' : 'Submit Documents' }}
        </button>
        <p
          v-if="uploadStatus"
          :class="['mt-4 text-center text-sm font-medium', uploadStatus.includes('Failed') ? 'text-red-600' : 'text-green-700']"
        >
          {{ uploadStatus }}
        </p>
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { logSecurityClient } from '@/utils/logUtils'
import api from '../../utils/axiosInstance'

const idFile = ref(null)
const paymentFile = ref(null)
const profileFile = ref(null)
const uploading = ref(false)
const uploadStatus = ref('')
const router = useRouter()
const refId = `UPLOAD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
const toast = useToast()

onMounted(() => {
  document.title = 'Upload Verification | IRC'
})

function handleFileChange(event, type) {
  const file = event.target.files[0]
  if (type === 'id') idFile.value = file
  if (type === 'payment') paymentFile.value = file
  if (type === 'profile') {
    const img = new window.Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      if (Math.abs(ratio - (7/9)) > 0.03) {
        alert('Passport photo must have an aspect ratio of 7:9!');
        event.target.value = '';
        return;
      }
      profileFile.value = file;
    };
    img.src = URL.createObjectURL(file);
  }
}

async function uploadDocuments() {
  uploadStatus.value = '';
  uploading.value = true;

  const formData = new FormData();
  formData.append('identityProof', idFile.value);
  formData.append('paymentProof', paymentFile.value);
  formData.append('profilePicture', profileFile.value);

  console.log('[DEBUG] Selected Files:', {
    idFile: idFile.value,
    paymentFile: paymentFile.value,
    profileFile: profileFile.value
  });

  try {
    const { data } = await api.get('/api/auth/csrf-token');
    const csrfToken = data.csrfToken;
    console.log('[DEBUG] CSRF Token:', csrfToken);

    const res = await fetch('http://localhost:3001/api/user/upload-documents', {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        'X-CSRF-Token': csrfToken
      }
    });

    console.log('[DEBUG] Raw Response:', res);

    const result = await res.json();
    console.log('[DEBUG] Response JSON:', result);

    if (!res.ok) {
      console.error('[DEBUG] Upload failed. Status:', res.status, result);
      throw new Error(result.error || 'Upload failed');
    }

    uploadStatus.value = result.message || 'Documents uploaded!';
    toast.success(uploadStatus.value);

    await logSecurityClient({
      category: 'user',
      action: 'documents_uploaded',
      details: `Verification documents uploaded (refId: ${refId})`,
      severity: 'medium'
    });

    setTimeout(() => {
      router.push('/userprofile');
    }, 1200);
  } catch (err) {
    console.error('[DEBUG] Upload error:', err);
    uploadStatus.value = `Failed to upload. Please try again. (Ref: ${refId})`;
    toast.error(uploadStatus.value);

    await logSecurityClient({
      category: 'error',
      action: 'upload_documents_failed',
      details: `Document upload failed (refId: ${refId})`,
      severity: 'high'
    });
  } finally {
    uploading.value = false;
  }
}


</script>