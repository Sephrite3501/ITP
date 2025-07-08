<template>
  <section class="success-container">
    <div class="success-box">
      <h1 class="success-title">Password Reset Successful</h1>
      <p class="success-message">You can now log in using your new password.</p>
      <router-link to="/login" class="login-link">Go to Login</router-link>
    </div>
  </section>
</template>


<script setup>
// No script needed unless you want to auto-redirect after a timeout
</script>

<style scoped>
.success-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 1rem;
  min-height: 70vh;
  background: #f0fdf4;
}

.success-box {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.success-title {
  font-size: 2rem;
  font-weight: bold;
  color: #16a34a;
  margin-bottom: 1rem;
}

.success-message {
  font-size: 1.1rem;
  color: #374151;
  margin-bottom: 2rem;
}

.login-link {
  display: inline-block;
  background-color: #16a34a;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 600;
  text-decoration: none;
}

.login-link:hover {
  background-color: #15803d;
}
</style>
