<template>
  <section class="otp-container">
    <div class="otp-box">
      <h1 class="otp-title">Enter Your OTP</h1>

      <p class="otp-subtext">
        We’ve sent a 6-digit code to your email: <strong>{{ email }}</strong>
      </p>

      <form @submit.prevent="onSubmit" class="otp-form">
        <div class="form-group">
          <label for="otp">OTP Code</label>
          <input
            id="otp"
            v-model="otp"
            type="text"
            maxlength="6"
            placeholder="Enter code"
            required
          />
        </div>

        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Verifying...' : 'Verify Code' }}
        </button>
      </form>
    </div>
  </section>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore() 

const email = ref('')
const otp = ref('')
const errorMessage = ref('')
const loading = ref(false)

onMounted(() => {
  email.value = route.query.email || ''
  if (!email.value) {
    errorMessage.value = 'Missing email. Please go back and try again.'
  }
})

const onSubmit = async () => {
  errorMessage.value = ''
  loading.value = true

  try {
    const res = await fetch('http://localhost:3001/api/auth/verify-otp', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, otp: otp.value })
    })

    const data = await res.json()

    if (!res.ok) {
      errorMessage.value = data.error || 'OTP verification failed'
    } else {
      const res = await fetch('http://localhost:3001/api/auth/me', { credentials: 'include' })
      const data = await res.json()
      if (res.ok && data?.user) {
        auth.setUser(data.user)
      }
      // router.push('/userprofile')
      await router.replace({ path: '/userprofile' })
      await router.go()
    }
  } catch (err) {
    console.error('OTP verification error:', err)
    errorMessage.value = 'Unexpected error. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>


<style scoped>
.otp-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem 1rem;
  min-height: 70vh;
  background: #f9fafb;
}

.otp-box {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.otp-title {
  font-size: 1.75rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 0.5rem;
  color: #111827;
}

.otp-subtext {
  font-size: 0.95rem;
  text-align: center;
  margin-bottom: 1.5rem;
  color: #374151;
}

.otp-form .form-group {
  margin-bottom: 1.2rem;
}

.otp-form label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.3rem;
}

.otp-form input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
}

button {
  width: 100%;
  padding: 0.75rem;
  background: #16a34a;
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
}

.error-message {
  background: #fee2e2;
  color: #b91c1c;
  padding: 0.5rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

label {
  color: #374151; /* Tailwind's gray-700 */
  font-weight: 500;
  margin-bottom: 0.25rem;
  display: block;
}

input::placeholder {
  color: #9ca3af; /* Tailwind's gray-400 for better visibility */
  opacity: 1; /* Make sure it's not faded */
}

input {
  color: #111827; /* Ensure typed text is visible */
}

</style>
