<template>
  <nav class="navbar">
    <div class="navbar-inner">
      <h1 class="logo">IRC</h1>

      <ul class="nav-links">
        <template v-if="auth.user && !auth.isAdmin">
          <li><router-link to="/userprofile">Profile</router-link></li>
          <li v-if="auth.user.role === 'inactive'">
            <router-link to="/upload-verification">Upload Verification</router-link>
          </li>
          <li class="welcome-msg">Hi, {{ auth.user.name }}</li>
          <li><button @click="logout" class="logout-btn">Logout</button></li>
        </template>

        <template v-else-if="auth.isAdmin">
          <li><router-link to="/userprofile">Profile</router-link></li>
          <li><router-link to="/admin/users">User Management</router-link></li>
          <li><router-link to="/admin/verify-user">User Verification</router-link></li>
          <li><button @click="logout" class="logout-btn">Logout</button></li>
        </template>

        <template v-else>
          <li><router-link to="/">Home</router-link></li>
          <li><router-link to="/membership">Membership</router-link></li>
          <li><router-link to="/login">Login</router-link></li>
          <li><router-link to="/signup">Sign Up</router-link></li>
        </template>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const auth = useAuthStore()

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/auth/me', {
      credentials: 'include'
    })
    const data = await res.json()
    if (res.ok && data?.user) {
      auth.setUser(data.user)
    }
  } catch (err) {
    console.warn('[Navbar] User not logged in')
  }
})

const logout = async () => {
  try {
    await fetch('http://localhost:3001/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
    auth.clearUser()
    router.push('/login')
  } catch (err) {
    console.error('[Navbar] Logout failed:', err)
  }
}
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 2rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.navbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #16a34a;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-links a {
  text-decoration: none;
  color: #374151;
  font-weight: 500;
}

.nav-links a.router-link-active {
  color: #16a34a;
}

.logout-btn {
  background: transparent;
  border: none;
  font-weight: 500;
  color: #dc2626;
  cursor: pointer;
}

.welcome-msg {
  color: #4b5563;
  font-size: 0.95rem;
}
</style>
