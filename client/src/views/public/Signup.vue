<template>
  <section class="flex items-center justify-center px-2">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10">
      <h1 class="text-2xl font-extrabold text-center text-gray-800 mb-8">
        Create Your IRC Account
      </h1>
      <form @submit.prevent="onSubmit" class="space-y-6">
        <!-- Name Field -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            id="name"
            v-model.trim="form.name"
            type="text"
            autocomplete="name"
            :class="[
              'w-full border rounded-lg py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition',
              errors.name ? 'border-red-500' : form.name ? 'border-green-500' : 'border-gray-300'
            ]"
            placeholder="Your full name"
            @blur="markTouched('name')"
          />
          <p v-if="errors.name" class="text-xs text-red-600 mt-1">{{ errors.name }}</p>
        </div>
        <!-- Email Field -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            v-model.trim="form.email"
            type="email"
            autocomplete="email"
            :class="[
              'w-full border rounded-lg py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition',
              errors.email ? 'border-red-500' : form.email ? 'border-green-500' : 'border-gray-300'
            ]"
            placeholder="e.g. you@example.com"
            @blur="markTouched('email')"
          />
          <p v-if="errors.email" class="text-xs text-red-600 mt-1">{{ errors.email }}</p>
        </div>
        <!-- Password Field -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div class="relative flex items-center">
            <input
              :type="showPassword.password ? 'text' : 'password'"
              id="password"
              v-model.trim="form.password"
              autocomplete="new-password"
              :class="[
                'w-full border rounded-lg py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition pr-10',
                errors.password ? 'border-red-500' : form.password ? 'border-green-500' : 'border-gray-300'
              ]"
              placeholder="Minimum 8 characters"
              @blur="markTouched('password')"
            />
            <span
              class="absolute right-3 inset-y-0 flex items-center h-full text-blue-500 cursor-pointer text-base select-none"
              @click="togglePassword('password')"
            >
              {{ showPassword.password ? 'Hide' : 'Show' }}
            </span>
          </div>
          <p v-if="errors.password" class="text-xs text-red-600 mt-1">{{ errors.password }}</p>
          <p
            v-if="form.password"
            class="text-xs mt-1"
            :class="{
              'text-red-600': passwordStrength === 'Weak',
              'text-yellow-500': passwordStrength === 'Medium',
              'text-green-600': passwordStrength === 'Strong'
            }"
          >
            Strength: <strong>{{ passwordStrength }}</strong>
          </p>
        </div>
        <!-- Confirm Password Field -->
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <div class="relative flex items-center">
            <input
              :type="showPassword.confirmPassword ? 'text' : 'password'"
              id="confirmPassword"
              v-model.trim="form.confirmPassword"
              autocomplete="new-password"
              :class="[
                'w-full border rounded-lg py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition pr-10',
                errors.confirmPassword ? 'border-red-500' : form.confirmPassword ? 'border-green-500' : 'border-gray-300'
              ]"
              placeholder="Re-enter password"
              @blur="markTouched('confirmPassword')"
            />
            <span
              class="absolute right-3 inset-y-0 flex items-center h-full text-blue-500 cursor-pointer text-base select-none"
              @click="togglePassword('confirmPassword')"
            >
              {{ showPassword.confirmPassword ? 'Hide' : 'Show' }}
            </span>
          </div>
          <p v-if="errors.confirmPassword" class="text-xs text-red-600 mt-1">{{ errors.confirmPassword }}</p>
        </div>
        <!-- Contact Number -->
        <div>
          <label for="contactNumber" class="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
          <input
            id="contactNumber"
            v-model.trim="form.contactNumber"
            type="text"
            autocomplete="tel"
            :class="[
              'w-full border rounded-lg py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition',
              errors.contactNumber ? 'border-red-500' : form.contactNumber ? 'border-green-500' : 'border-gray-300'
            ]"
            placeholder="Contact number"
            @blur="markTouched('contactNumber')"
          />
          <p v-if="errors.contactNumber" class="text-xs text-red-600 mt-1">{{ errors.contactNumber }}</p>
        </div>
        <!-- Address -->
        <div>
          <label for="address" class="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            id="address"
            v-model.trim="form.address"
            type="text"
            autocomplete="street-address"
            :class="[
              'w-full border rounded-lg py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition',
              errors.address ? 'border-red-500' : form.address ? 'border-green-500' : 'border-gray-300'
            ]"
            placeholder="Address"
            @blur="markTouched('address')"
          />
          <p v-if="errors.address" class="text-xs text-red-600 mt-1">{{ errors.address }}</p>
        </div>
        <!-- Member Type -->
        <div>
          <label for="memberType" class="block text-sm font-medium text-gray-700 mb-1">Member Type</label>
          <select
            id="memberType"
            v-model="form.memberType"
            :class="[
              'w-full border rounded-lg py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition',
              errors.memberType ? 'border-red-500' : form.memberType ? 'border-green-500' : 'border-gray-300'
            ]"
            @blur="markTouched('memberType')"
          >
            <option disabled value="">Select...</option>
            <option value="Junior">Junior</option>
            <option value="Ordinary">Ordinary</option>
            <option value="Corporate">Corporate</option>
          </select>
          <p v-if="errors.memberType" class="text-xs text-red-600 mt-1">{{ errors.memberType }}</p>
        </div>
        <!-- reCAPTCHA -->
        <div>
          <div id="recaptcha" class="mt-4"></div>
          <p v-if="errors.recaptcha" class="text-xs text-red-600 mt-2">Please complete the CAPTCHA</p>
        </div>
        <!-- Submit Button -->
        <div>
          <button
            type="submit"
            class="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition focus:outline-none focus:ring-2 focus:ring-green-400"
            :disabled="loading"
          >
            {{ loading ? 'Registering...' : 'Sign Up' }}
          </button>
        </div>
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
  agreed: true,  // Checkbox for terms agreement (change to false if user must agree)
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

