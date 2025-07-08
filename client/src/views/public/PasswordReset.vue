<template>
  <section class="reset-container">
    <div class="reset-box">
      <h1 class="reset-title">Reset Your Password</h1>

      <form @submit.prevent="onSubmit" class="reset-form">
        <div class="form-group">
          <label for="new-password">New Password</label>
          <div class="password-wrapper">
            <input
              id="new-password"
              :type="showPassword ? 'text' : 'password'"
              v-model="form.password"
              @blur="touched.password = true"
              placeholder="Enter new password"
              required
            />
            <button type="button" @click="showPassword = !showPassword">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
          <p class="password-strength" :class="passwordStrength.toLowerCase()" v-if="form.password">
            Strength: <strong>{{ passwordStrength }}</strong>
          </p>
        </div>

        <div class="form-group">
          <label for="confirm-password">Confirm Password</label>
          <div class="password-wrapper">
            <input
              id="confirm-password"
              :type="showConfirm ? 'text' : 'password'"
              v-model="form.confirmPassword"
              @blur="touched.confirmPassword = true"
              placeholder="Re-enter password"
              required
            />
            <button type="button" @click="showConfirm = !showConfirm">
              {{ showConfirm ? 'Hide' : 'Show' }}
            </button>
          </div>
          <p class="field-error" v-if="confirmMismatch">Passwords do not match</p>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">{{ success }}</div>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Resetting...' : 'Reset Password' }}
        </button>
      </form>
    </div>
  </section>
</template>


<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const form = reactive({
  password: '',
  confirmPassword: ''
})

const error = ref('')
const success = ref('')
const token = ref('')
const tokenValid = ref(false)
const checkingToken = ref(true)
const loading = ref(false)
const showPassword = ref(false)
const showConfirm = ref(false)
const touched = reactive({ password: false, confirmPassword: false })

onMounted(async () => {
  token.value = route.query.token || ''
  if (!token.value) {
    tokenValid.value = false
    checkingToken.value = false
    return
  }

  try {
    const res = await fetch('http://localhost:3001/api/auth/validate-reset-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token.value })
    })
    const result = await res.json()
    tokenValid.value = result.valid === true
  } catch {
    tokenValid.value = false
  } finally {
    checkingToken.value = false
  }
})

const passwordStrength = computed(() => {
  if (form.password.length < 8) return 'Weak'
  if (/[A-Z]/.test(form.password) && /[0-9]/.test(form.password) && /[!@#$%^&*]/.test(form.password)) return 'Strong'
  return 'Medium'
})

const confirmMismatch = computed(() =>
  touched.confirmPassword && form.confirmPassword && form.confirmPassword !== form.password
)

const onSubmit = async () => {
  error.value = ''
  success.value = ''

  touched.password = true
  touched.confirmPassword = true

  if (!form.password || confirmMismatch.value) {
    error.value = 'Please ensure passwords match and meet requirements.'
    return
  }

  loading.value = true
  try {
    const res = await fetch('http://localhost:3001/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: token.value,
        password: form.password
      })
    })

    const result = await res.json()

    if (!res.ok) {
      error.value = result.error || 'Failed to reset password.'
    } else {
      router.push('/resetpasswordsuccess')
    }
  } catch {
    error.value = 'Network error. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem 1rem;
  min-height: 70vh;
  background: #f3f4f6;
}

.reset-box {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.reset-title {
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 1.5rem;
  color: #111827;
}

.reset-form .form-group {
  margin-bottom: 1.2rem;
}

.reset-form label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.3rem;
  color: #374151;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  font-size: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #111827;
  background-color: white;
}

.password-wrapper button {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  font-weight: 500;
}

.reset-form input::placeholder {
  color: #6b7280;
}

button[type="submit"] {
  width: 100%;
  padding: 0.75rem;
  background: #16a34a;
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 0.5rem;
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

.success-message {
  background: #dcfce7;
  color: #15803d;
  padding: 0.5rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.password-strength {
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.password-strength.weak {
  color: red;
}

.password-strength.medium {
  color: orange;
}

.password-strength.strong {
  color: green;
}

.field-error {
  font-size: 0.85rem;
  color: #dc2626;
  margin-top: 0.25rem;
}
</style>
