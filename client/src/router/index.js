import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  // 🔓 Public / Guest-only Routes
  {
    path: '/',
    component: () => import('../views/public/Membership.vue')
  },
  {
    path: '/membership',
    component: () => import('../views/public/Membership.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/signup',
    component: () => import('../views/public/Signup.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/signupsuccess',
    component: () => import('../views/public/SignupSuccess.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/activate',
    component: () => import('../views/public/Activate.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/login',
    component: () => import('../views/public/Login.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/verify-otp',
    component: () => import('../views/public/VerifyOtp.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/resetpassword',
    component: () => import('../views/public/PasswordReset.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/resetpasswordrequest',
    component: () => import('../views/public/ResetPasswordRequest.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/resetpasswordsuccess',
    component: () => import('../views/public/PasswordResetSuccess.vue'),
    meta: { guestOnly: true }
  },

  // 🔐 Authenticated User Routes
  {
    path: '/userprofile',
    component: () => import('../views/user/UserProfile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/upload-verification',
    component: () => import('@/views/user/UploadVerificationView.vue'),
    meta: { requiresAuth: true }
  },

  // 🛠️ Admin Routes
  {
    path: '/admin/users',
    component: () => import('@/views/admin/UserManagement.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/verify-user',
    component: () => import('@/views/admin/AdminVerifyUser.vue'),
    meta: { requiresAuth: true }
  },


]

export const router = createRouter({
  history: createWebHistory(),
  routes
})

// ✅ Global Navigation Guard
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.meta.requiresAuth
  const guestOnly = to.meta.guestOnly

  try {
    const res = await fetch('http://localhost:3001/api/auth/me', {
      credentials: 'include'
    })

    const data = await res.json()
    const isLoggedIn = res.ok && data?.user

    if (guestOnly && isLoggedIn) {
      return next('/userprofile') // logged-in users can't access guest pages
    }

    if (requiresAuth && !isLoggedIn) {
      return next('/login') // block auth-only pages if not logged in
    }

    if (to.path.startsWith('/admin') && (!isLoggedIn || data.user.user_role !== 'admin')) {
      return next('/login')
    }


    next()
  } catch (err) {
    console.warn('[Route Guard] Session check failed:', err)
    if (requiresAuth) return next('/login')
    next()
  }
})
