<template>
  <nav class="sticky top-0 z-50 w-full bg-white border-b border-gray-200 px-6 py-3">
    <div class="max-w-7xl mx-auto flex justify-between items-center">
      <!-- Logo -->
      <img src="@/assets/irc-logo.png" alt="IRC Logo" class="w-10 h-auto" />
        <button @click="toggleMobileMenu" class="md:hidden text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      <ul
        :class="[
          'md:flex items-center gap-4 text-gray-700 font-medium transition-all duration-300',
          isMobile ? (showMenu ? 'flex flex-col absolute top-16 left-0 w-full bg-white px-6 py-4 z-50 shadow border-t' : 'hidden') : 'flex'
        ]"
      >
        <!-- COMMON NAV GROUP -->

        <template v-if="auth.user && !auth.isAdmin">
          <li>
            <router-link to="/userprofile" class="hover:text-blue-600" :class="{ 'text-blue-600 font-bold': $route.path.startsWith('/userprofile') }">Profile</router-link>
          </li>
          <li v-if="auth.user.account_status === 'inactive'">
            <router-link to="/upload-verification" class="hover:text-blue-600" :class="{ 'text-blue-600 font-bold': $route.path.startsWith('/upload-verification') }">Upload Verification</router-link>
          </li>
          <li>
            <router-link to="/events" class="hover:text-blue-600" :class="{ 'text-blue-600 font-bold': $route.path.startsWith('/events') }">Events</router-link>
          </li>

          <!-- COMMITTEES Dropdown -->
          <li class="relative"
              @mouseenter="showDropdown('committees')"
              @mouseleave="hideDropdownDelayed('committees')">
            <span class="cursor-pointer">Committees</span>
            <transition name="fade">
              <ul v-if="dropdownStates.committees"
                  class="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow z-50 divide-y transition-all">
                <li><router-link to="/committees" class="block px-4 py-2 hover:bg-gray-100" :class="isActive('/committees')">Current Committees</router-link></li>
                <li><router-link to="/committees/snapshots" class="block px-4 py-2 hover:bg-gray-100" :class="isActive('/committees/snapshots')">Committees History</router-link></li>
              </ul>
            </transition>
          </li>

          <!-- IRCSET Dropdown -->
          <li class="relative"
              @mouseenter="showDropdown('ircset')"
              @mouseleave="hideDropdownDelayed('ircset')">
            <span class="cursor-pointer">IRC-SET Conference</span>
            <transition name="fade">
              <ul v-if="dropdownStates.ircset"
                  class="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow z-50 max-h-96 overflow-y-auto divide-y transition-all">
                <li v-for="year in conferenceYears" :key="year">
                  <a :href="`https://ircset.org/main/conference-${year}/`" target="_blank" class="block px-4 py-2 hover:bg-gray-100">
                    IRC-SET {{ year }}
                  </a>
                </li>
              </ul>
            </transition>
          </li>

          <li class="text-sm text-gray-500 ml-2">Hi, {{ auth.user.name }}</li>
          <li><button @click="logout" class="text-red-600 font-semibold hover:underline">Logout</button></li>
        </template>

        <template v-else-if="auth.isAdmin">
          <!-- MANAGEMENT Dropdown -->
          <li class="relative"
              @mouseenter="showDropdown('management')"
              @mouseleave="hideDropdownDelayed('management')">
            <span class="cursor-pointer">Management</span>
            <transition name="fade">
              <ul v-if="dropdownStates.management"
                  class="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow z-50 divide-y transition-all">
                <li><router-link to="/admin/users" class="block px-4 py-2 hover:bg-gray-100" :class="isActive('/admin/users')">User Management</router-link></li>
                <li><router-link to="/admin/verify-user" class="block px-4 py-2 hover:bg-gray-100" :class="isActive('/admin/verify-user')">User Verification</router-link></li>
                <li><router-link to="/admin/content-management" class="block px-4 py-2 hover:bg-gray-100" :class="isActive('/admin/content-management')">Content Management</router-link></li>
                <li><router-link to="/admin/event-management" class="block px-4 py-2 hover:bg-gray-100" :class="isActive('/admin/event-management')">Event Management</router-link></li>
                <li><router-link to="/admin/CommitteePanel" class="block px-4 py-2 hover:bg-gray-100" :class="isActive('/admin/CommitteePanel')">Committee Management</router-link></li>
              </ul>
            </transition>
          </li>

          <!-- COMMITTEES Dropdown (reuse names) -->
          <li class="relative"
              @mouseenter="showDropdown('committees')"
              @mouseleave="hideDropdownDelayed('committees')">
            <span class="cursor-pointer">Committees</span>
            <transition name="fade">
              <ul v-if="dropdownStates.committees"
                  class="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow z-50 divide-y transition-all">
                <li><router-link to="/committees" class="block px-4 py-2 hover:bg-gray-100" :class="isActive('/committees')">Current Committees</router-link></li>
                <li><router-link to="/committees/snapshots" class="block px-4 py-2 hover:bg-gray-100" :class="isActive('/committees/snapshots')">Committees History</router-link></li>
              </ul>
            </transition>
          </li>

          <li><button @click="logout" class="text-red-600 font-semibold hover:underline">Logout</button></li>
        </template>

        <!-- Public -->
        <template v-else>
            <li>
              <router-link to="/home" class="hover:text-blue-600 flex items-center gap-1" :class="isActive('/home')">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M3 12l9-9 9 9" stroke="currentColor" stroke-width="2" fill="none"/>
                  <path d="M9 21V12h6v9" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
                Home
              </router-link>
            </li>

            <!-- COMMITTEES Dropdown -->
            <li class="relative"
              @mouseenter="showDropdown('committees')"
              @mouseleave="hideDropdownDelayed('committees')">
            <span class="cursor-pointer flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Committees
            </span>
            <transition name="fade">
              <ul v-if="dropdownStates.committees"
                class="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow z-50 divide-y transition-all">
              <li><router-link to="/committees" class="block px-4 py-2 hover:bg-gray-100" :class="isActive('/committees')">Current Committees</router-link></li>
              <li><router-link to="/committees/snapshots" class="block px-4 py-2 hover:bg-gray-100" :class="isActive('/committees/snapshots')">Committees History</router-link></li>
              </ul>
            </transition>
            </li>

            <li>
                <router-link to="/membership" class="hover:text-blue-600 flex items-center gap-1" :class="isActive('/membership')">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M12 3v18M8 7h8a4 4 0 010 8H8a4 4 0 000 8h8" stroke="currentColor" stroke-width="2" fill="none"/>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
                Membership
                </router-link>
            </li>
            <li>
              <router-link to="/events" class="hover:text-blue-600 flex items-center gap-1" :class="isActive('/events')">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/>
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
              </svg>
              Events
              </router-link>
            </li>

            <!-- IRCSET Conference -->
            <li class="relative"
              @mouseenter="showDropdown('ircset')"
              @mouseleave="hideDropdownDelayed('ircset')">
            <span class="cursor-pointer">IRC-SET Conference</span>
            <transition name="fade">
              <ul v-if="dropdownStates.ircset"
                class="absolute left-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow z-50 max-h-96 overflow-y-auto divide-y transition-all">
              <li v-for="year in conferenceYears" :key="year">
                <a :href="`https://ircset.org/main/conference-${year}/`" target="_blank" class="block px-4 py-2 hover:bg-gray-100">IRC-SET {{ year }}</a>
              </li>
              </ul>
            </transition>
            </li>

            <!-- Padding separator -->
            <li class="ml-8"></li>
            <li>
            <router-link to="/login" class="hover:text-blue-600 flex items-center gap-1" :class="isActive('/login')">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2" fill="none"/>
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
              Login
            </router-link>
            </li>
          <li>
            <router-link to="/signup" class="hover:text-blue-600 flex items-center gap-1" :class="isActive('/signup')">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2" fill="none"/>
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" stroke-width="2" fill="none"/>
                <path d="M20 6h-4m0 0V2m0 4v4" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
              Sign Up
            </router-link>
          </li>
        </template>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import { onMounted, ref, onUnmounted  } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { logSecurityClient } from '@/utils/logUtils.js'

const router = useRouter()
const $route = useRoute()
const auth = useAuthStore()

const showMenu = ref(false)
const isMobile = ref(false)


function toggleMobileMenu() {
  showMenu.value = !showMenu.value
}

function handleResize() {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) showMenu.value = false
}

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const conferenceYears = Array.from({ length: 9 }, (_, i) => 2023 - i)

const dropdownStates = ref({
  committees: false,
  ircset: false,
  management: false
})

const dropdownTimers = {}

function showDropdown(name) {
  clearTimeout(dropdownTimers[name])
  dropdownStates.value[name] = true
}

function hideDropdownDelayed(name) {
  dropdownTimers[name] = setTimeout(() => {
    dropdownStates.value[name] = false
  }, 500)
}

// Highlight active tab
function isActive(path) {
  return $route.path === path || $route.path.startsWith(path)
    ? 'text-blue-600 font-bold'
    : ''
}

onMounted(async () => {
  try {
    const res = await fetch('http://localhost:3001/api/auth/me', { credentials: 'include' })
    const data = await res.json()
    if (res.ok && data?.user) auth.setUser(data.user)
  } catch {
    // silent
  }

  handleResize()
  window.addEventListener('resize', handleResize)
})

const logout = async () => {
  const traceId = `LOGOUT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
  try {
    await fetch('http://localhost:3001/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
    auth.clearUser()
    router.push('/login')
  } catch {
    logSecurityClient({
      traceId,
      category: 'auth',
      action: 'logout_client_fail',
      status: 'fail',
      severity: 'low',
      message: 'Logout failed on client side'
    })
  }
}
</script>

<style scoped>
/* Simple fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
