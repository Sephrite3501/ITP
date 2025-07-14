<template>
  <nav class="navbar">
    <div class="navbar-inner">
      <img src="@/assets/irc-logo.png" alt="IRC Logo" class="logo" />

      <ul class="nav-links">
        <template v-if="auth.user && !auth.isAdmin">
          <li><router-link to="/userprofile">Profile</router-link></li>
          <li v-if="auth.user.role === 'inactive'">
            <router-link to="/upload-verification">Upload Verification</router-link>
          </li>
          <li><router-link to="/events">Events</router-link></li>
          <li class="welcome-msg">Hi, {{ auth.user.name }}</li>
          <li><button @click="logout" class="logout-btn">Logout</button></li>
        </template>

        <template v-else-if="auth.isAdmin">
          <!--<li><router-link to="/userprofile">Profile</router-link></li>-->
            <li class="dropdown">
            <span class="dropdown-toggle">Management</span>
            <ul class="dropdown-menu">
              <li><router-link to="/admin/users">User Management</router-link></li>
              <li><router-link to="/admin/verify-user">User Verification</router-link></li>
              <li><router-link to="/admin/content-management">Content Management</router-link></li>
              <li><router-link to="/admin/event-management">Event Management</router-link></li>
            </ul>
            </li>
          <li><button @click="logout" class="logout-btn">Logout</button></li>
        </template>

        <template v-else>
          <li><router-link to="/home">Home</router-link></li>
          <li><router-link to="/committees">Committees</router-link></li>
          <li><router-link to="/committees/snapshots">Committees History</router-link></li>
          <li><router-link to="/membership">Membership</router-link></li>
          <li><router-link to="/events">Events</router-link></li>
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
  color: #91afc6;
  width: 5%;
  height: auto;
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
  color: #91afc6;
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



ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

li.dropdown {
  position: relative;
}

.dropdown-toggle {
  cursor: pointer;
  font-weight: 500;
  color: #374151;
  padding: 0.5rem 0;
  display: inline-block;
}

.dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background-color: #ffffff;
  min-width: 220px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  z-index: 999;
  pointer-events: auto; /* allow hovering */
}

/* Show dropdown on hover */
.dropdown:hover .dropdown-menu {
  display: block;
}

/* Style dropdown items like other nav links */
.dropdown-menu li {
  padding-bottom: 0;
}

.dropdown-menu li a {
  display: block;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #374151;
  font-weight: 500;
  transition: background-color 0.2s ease, color 0.2s ease;
}

/* Hover and active states */
.dropdown-menu li a:hover {
  background-color: #f3f4f6;
  color: #91afc6;
}

.dropdown-menu li a.router-link-active {
  color: #91afc6;
}

</style>
