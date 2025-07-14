<template>
  <section class="signup-container">
    <div class="signup-box">
      <h1 class="signup-title">Create Your IRC Account</h1>

      <form @submit.prevent="onSubmit" class="signup-form">
        <div
          v-for="field in fields"
          :key="field.id"
          class="form-group"
        >
          <label :for="field.id">{{ field.label }}</label>
          <div v-if="field.type !== 'select'" class="input-wrapper">
            <div class="input-eye-wrapper" v-if="field.type === 'password'">
              <input
                :type="showPassword[field.model] ? 'text' : 'password'"
                :id="field.id"
                v-model.trim="form[field.model]"
                :placeholder="field.placeholder"
                :autocomplete="field.autocomplete"
                :class="[errors[field.model] ? 'error-input' : '', isValid(field.model) ? 'valid-input' : '']"
                @blur="markTouched(field.model)"
              />
              <span class="toggle-password" @click="togglePassword(field.model)">
                {{ showPassword[field.model] ? '🙈' : '👁️' }}
              </span>
            </div>
            <input
              v-else
              :id="field.id"
              :type="field.type"
              v-model.trim="form[field.model]"
              :placeholder="field.placeholder"
              :autocomplete="field.autocomplete"
              :class="[errors[field.model] ? 'error-input' : '', isValid(field.model) ? 'valid-input' : '']"
              @blur="markTouched(field.model)"
            />
            <p
              v-if="field.model === 'password' && form.password"
              class="password-strength"
              :class="passwordStrength.toLowerCase()"
            >
              Strength: <strong>{{ passwordStrength }}</strong>
            </p>
          </div>

          <select
            v-else
            :id="field.id"
            v-model="form.memberType"
            :class="[errors.memberType ? 'error-input' : '', isValid('memberType') ? 'valid-input' : '']"
            @blur="markTouched('memberType')"
          >
            <option disabled value="">Select...</option>
            <option value="Junior">Junior</option>
            <option value="Ordinary">Ordinary</option>
            <option value="Corporate">Corporate</option>
          </select>

          <p class="field-error" :id="field.id + '-error'" v-if="errors[field.model]">
            {{ errors[field.model] }}
          </p>
        </div>

        <div class="form-footer full-width">
          <label class="inline-label">
            <input type="checkbox" v-model="form.agreed" @blur="markTouched('agreed')" />
            <span>I agree to the <a href="#" target="_blank">Terms & Conditions</a></span>
          </label>
          <p class="field-error" v-if="errors.agreed">{{ errors.agreed }}</p>
        </div>

        <p class="field-error full-width" v-if="errors.recaptcha">Please complete the CAPTCHA</p>

        <div id="recaptcha" class="recaptcha-box full-width"></div>

        <button type="submit" class="submit-button full-width" :disabled="loading">
          {{ loading ? 'Registering...' : 'Sign Up' }}
        </button>
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import DOMPurify from 'dompurify'
import { useRouter } from 'vue-router'
import { getFriendlyError } from '@/utils/handleError'
import { logSecurityClient } from '@/utils/logUtils'

const router = useRouter()
const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  contactNumber: '',
  address: '',
  memberType: '',
  agreed: false,
  recaptchaToken: ''
})

const errors = reactive({})
const loading = ref(false)
const showPassword = reactive({ password: false, confirmPassword: false })
const touchedFields = reactive({})
const refId = `SIGNUP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

const tempEmailDomains = ['mailinator.com', '10minutemail.com', 'guerrillamail.com', 'yopmail.com', 'throwawaymail.com']

const fields = [
  { id: 'name', label: 'Name:', model: 'name', type: 'text', autocomplete: 'name' },
  { id: 'email', label: 'Email:', model: 'email', type: 'email', autocomplete: 'email', placeholder: 'e.g. you@example.com' },
  { id: 'password', label: 'Password:', model: 'password', type: 'password', autocomplete: 'new-password' },
  { id: 'confirmPassword', label: 'Confirm Password:', model: 'confirmPassword', type: 'password', autocomplete: 'new-password' },
  { id: 'contactNumber', label: 'Contact Number:', model: 'contactNumber', type: 'text', autocomplete: 'tel' },
  { id: 'address', label: 'Address:', model: 'address', type: 'text', autocomplete: 'street-address' },
  { id: 'memberType', label: 'Member Type:', model: 'memberType', type: 'select' }
]

onMounted(() => {
  document.title = 'Sign Up | IRC'
})

const passwordStrength = computed(() => {
  if (form.password.length < 8) return 'Weak'
  if (/[A-Z]/.test(form.password) && /[0-9]/.test(form.password) && /[!@#$%^&*]/.test(form.password)) return 'Strong'
  return 'Medium'
})

const sanitize = (value) => DOMPurify.sanitize(value)
const isTempEmail = (email) => tempEmailDomains.some(domain => email.toLowerCase().endsWith('@' + domain))

const togglePassword = (field) => { showPassword[field] = !showPassword[field] }
const getInputType = (field) => showPassword[field.model] ? 'text' : field.type
const markTouched = (field) => { touchedFields[field] = true; validateField(field) }
const isValid = (field) => touchedFields[field] && !errors[field] && form[field]

const validateField = (field) => {
  const value = form[field]
  delete errors[field]

  switch (field) {
    case 'name': if (!value) errors.name = 'Name is required'; break
    case 'email':
      if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.email = 'Valid email is required'
      } else if (isTempEmail(value)) {
        errors.email = 'Temporary emails are not allowed'
      }
      break
    case 'password':
      if (!value || value.length < 8 || !/[A-Z]/.test(value)) {
        errors.password = 'Password must be at least 8 characters with one uppercase letter'
      }
      break
    case 'confirmPassword':
      if (value !== form.password) errors.confirmPassword = 'Passwords do not match'
      break
    case 'contactNumber':
      if (!value || !/^[0-9\-\+\s]{7,15}$/.test(value)) {
        errors.contactNumber = 'Enter a valid contact number'
      }
      break
    case 'address':
      if (!value) errors.address = 'Address is required'
      break
    case 'memberType':
      if (!value) errors.memberType = 'Please select a member type'
      break
    case 'agreed':
      if (!form.agreed) errors.agreed = 'You must agree before registering'
      break
  }
}

fields.forEach(({ model }) => {
  watch(() => form[model], () => {
    if (touchedFields[model]) validateField(model)
  })
})

const executeRecaptcha = () => {
  return new Promise((resolve, reject) => {
    if (!window.grecaptcha || typeof window.grecaptcha.ready !== 'function') {
      return reject('reCAPTCHA is not loaded properly')
    }
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, { action: 'signup' })
        .then(resolve)
        .catch(reject)
    })
  })
}

const onSubmit = async () => {
  Object.keys(errors).forEach(k => delete errors[k])
  Object.keys(form).forEach(field => validateField(field))

  try {
    form.recaptchaToken = await executeRecaptcha()
  } catch (err) {
    errors.recaptcha = `CAPTCHA verification failed (Ref: ${refId})`
    await logSecurityClient({
      category: 'auth',
      action: 'signup_recaptcha_fail',
      details: `CAPTCHA failed (refId: ${refId})`,
      severity: 'high'
    })
    return
  }

  Object.keys(form).forEach(key => {
    if (typeof form[key] === 'string') {
      form[key] = sanitize(form[key])
    }
  })

  if (Object.keys(errors).length === 0) {
    loading.value = true
    try {
      const response = await fetch('http://localhost:3001/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          contact: form.contactNumber,
          address: form.address,
          member_type: form.memberType,
          recaptchaToken: form.recaptchaToken
        })
      })
      const result = await response.json()

      if (response.ok && result.message?.includes('Signup successful')) {
        await logSecurityClient({
          category: 'auth',
          action: 'signup_success',
          details: `New signup: ${form.email} (refId: ${refId})`,
          severity: 'low'
        })
        router.push('/signupsuccess')
      } else {
        errors.email = result.error
          ? `${result.error} (Ref: ${refId})`
          : `Signup failed. (Ref: ${refId})`

        await logSecurityClient({
          category: 'auth',
          action: 'signup_failed',
          details: `Signup error for ${form.email} (refId: ${refId})`,
          severity: 'medium'
        })
      }
    } catch (err) {
      errors.email = getFriendlyError(err, 'Signup error.', refId)
      await logSecurityClient({
        category: 'error',
        action: 'signup_exception',
        details: `Unhandled error for ${form.email} (refId: ${refId})`,
        severity: 'high'
      })
    } finally {
      loading.value = false
    }
  }
}
</script>


<style scoped>
.signup-container {
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
  background: #f9fafb;
  min-height: 80vh;
}

.signup-box {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.signup-title {
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2rem;
  color: #111827;
}

.signup-form {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 768px) {
  .signup-form {
    grid-template-columns: 1fr 1fr;
  }
  .form-group.full-width,
  .form-footer.full-width,
  .recaptcha-box.full-width,
  .submit-button.full-width {
    grid-column: 1 / -1;
  }
}

.form-group {
  margin-bottom: 1.2rem;
}

.signup-form label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.3rem;
  color: #374151;
}

.signup-form input,
.signup-form select {
  color: #111827; /* dark visible text */
  background-color: white;
    width: 100%;
  padding: 0.6rem;
  font-size: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.signup-form input::placeholder,
.signup-form select option[disabled] {
  color: #424344; /* subtle gray placeholder */
}

.input-wrapper {
  position: relative;
}

.input-eye-wrapper {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #2563eb;
  cursor: pointer;
  font-size: 0.9rem;
  user-select: none;
}

.password-strength {
  font-size: 0.9rem;
  margin-top: 0.25rem;
}
.password-strength.weak { color: red; }
.password-strength.medium { color: orange; }
.password-strength.strong { color: green; }

.valid-input { border-color: #16a34a; }
.error-input { border-color: #dc2626; }
.field-error {
  font-size: 0.85rem;
  color: #dc2626;
  margin-top: 0.25rem;
}

.inline-label {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.form-footer {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  text-align: center;
  margin-top: 1rem;
}

.submit-button {
  padding: 0.75rem;
  background: #16a34a;
  color: white;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  max-width: 250px;
  margin: 0 auto;
}

button:disabled {
  background: #ccc;
}

.recaptcha-box {
  margin: 1rem 0;
}
</style>
