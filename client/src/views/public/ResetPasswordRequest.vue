<template>
  <section class="flex items-center justify-center px-2">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10">
      <h1 class="text-2xl font-extrabold text-center text-gray-800 mb-4">Forgot Password?</h1>
      <p class="text-base text-center text-gray-700 mb-6">
        Enter your registered email and we’ll send you a reset link.
      </p>
      <form @submit.prevent="onSubmit" class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            v-model.trim="form.email"
            type="email"
            autocomplete="email"
            required
            placeholder="you@example.com"
            @input="validateEmail"
            @blur="markTouched"
            :class="[
              'w-full border rounded-lg py-2 px-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition',
              emailError ? 'border-red-500'
                : touched && form.email && !emailError ? 'border-green-500'
                : 'border-gray-300'
            ]"
          />
          <p v-if="emailError" class="text-xs text-red-600 mt-1">{{ emailError }}</p>
        </div>
        <div>
          <div id="recaptcha" class="flex justify-center mb-3"></div>
        </div>
        <div v-if="error" class="bg-red-100 text-red-700 p-2 rounded text-sm mb-2">
          {{ error }}
        </div>
        <div v-if="success" class="bg-green-50 text-green-700 p-2 rounded text-sm mb-2">
          {{ success }}
        </div>
        <button
          type="submit"
          class="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
          :disabled="loading"
        >
          {{ loading ? 'Sending...' : 'Send Reset Link' }}
        </button>
      </form>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { getFriendlyError } from '@/utils/handleError'
import { logSecurityClient } from '@/utils/logUtils'

const form = reactive({ email: '' });
const touched = ref(false);
const loading = ref(false);
const error = ref('');
const success = ref('');
const emailError = ref('');
const refId = `RESETREQ-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

onMounted(() => {
  document.title = 'Reset Password Request | IRC'
});

const tempEmailDomains = [
  "mailinator.com",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "throwawaymail.com"
];
const isTempEmail = (email) =>
  tempEmailDomains.some(domain => email.toLowerCase().endsWith('@' + domain));

const validateEmail = () => {
  emailError.value = '';
  if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    emailError.value = 'Please enter a valid email address';
  } else if (isTempEmail(form.email)) {
    emailError.value = 'Temporary emails are not allowed';
  }
};

const markTouched = () => {
  touched.value = true;
  validateEmail();
};

const executeRecaptcha = () => {
  return new Promise((resolve, reject) => {
    if (!window.grecaptcha || typeof window.grecaptcha.ready !== 'function') {
      return reject('reCAPTCHA not loaded');
    }
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, { action: 'reset_password' })
        .then(resolve)
        .catch(reject)
    });
  });
};

const onSubmit = async () => {
  touched.value = true;
  validateEmail();
  error.value = '';
  success.value = '';
  if (emailError.value) return; // Block submit if invalid email
  loading.value = true;

  try {
    const token = await executeRecaptcha();
    const response = await fetch('http://localhost:3001/api/auth/reset-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        recaptchaToken: token
      })
    });

    const result = await response.json();

    if (!response.ok || result?.error) {
      error.value = getFriendlyError({ response: { data: result } }, 'Reset failed.', refId);

      await logSecurityClient({
        category: 'auth',
        action: 'reset_request_failed',
        details: `Reset request rejected by server (refId: ${refId})`,
        severity: 'medium'
      });
    } else {
      success.value = result.message || 'If your email is registered, a reset link has been sent.';
      await logSecurityClient({
        category: 'auth',
        action: 'reset_request_success',
        details: `Reset link sent (refId: ${refId})`,
        severity: 'low'
      });
    }
  } catch (err) {
    error.value = getFriendlyError(err, 'Reset request error.', refId);

    await logSecurityClient({
      category: 'error',
      action: 'reset_request_network_error',
      details: `Network error during reset request (refId: ${refId})`,
      severity: 'high'
    });
  } finally {
    loading.value = false;
  }
};
</script>


<!-- 
<script setup>
import { reactive, ref, onMounted } from 'vue'
import { getFriendlyError } from '@/utils/handleError'
import { logSecurityClient } from '@/utils/logUtils'

const form = reactive({
  email: ''
})
const loading = ref(false)
const error = ref('')
const success = ref('')
const refId = `RESETREQ-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

onMounted(() => {
  document.title = 'Reset Password Request | IRC'
})

const executeRecaptcha = () => {
  return new Promise((resolve, reject) => {
    if (!window.grecaptcha || typeof window.grecaptcha.ready !== 'function') {
      return reject('reCAPTCHA not loaded')
    }
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, { action: 'reset_password' })
        .then(resolve)
        .catch(reject)
    })
  })
}

const onSubmit = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const token = await executeRecaptcha()

    if (!form.email || !form.email.includes('@')) {
      error.value = `Please enter a valid email address (Ref: ${refId})`
      await logSecurityClient({
        category: 'auth',
        action: 'reset_request_invalid_input',
        details: `User submitted invalid email input (refId: ${refId})`,
        severity: 'medium'
      })
      return
    }

    const response = await fetch('http://localhost:3001/api/auth/reset-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        recaptchaToken: token
      })
    })

    const result = await response.json()

    if (!response.ok || result?.error) {
      error.value = getFriendlyError({ response: { data: result } }, 'Reset failed.', refId)

      await logSecurityClient({
        category: 'auth',
        action: 'reset_request_failed',
        details: `Reset request rejected by server (refId: ${refId})`,
        severity: 'medium'
      })
    } else {
      success.value = result.message || 'If your email is registered, a reset link has been sent.'
      await logSecurityClient({
        category: 'auth',
        action: 'reset_request_success',
        details: `Reset link sent (refId: ${refId})`,
        severity: 'low'
      })
    }
  } catch (err) {
    error.value = getFriendlyError(err, 'Reset request error.', refId)

    await logSecurityClient({
      category: 'error',
      action: 'reset_request_network_error',
      details: `Network error during reset request (refId: ${refId})`,
      severity: 'high'
    })
  } finally {
    loading.value = false
  }
}
</script> -->