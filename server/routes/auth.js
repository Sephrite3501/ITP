// server/routes/auth.js
import express from 'express'
import {
  signup,
  activateAccount,
  loginRequest,
  loginVerify,
  requestReset,
  validateResetToken,
  resetPassword,
  refreshToken
} from '../controllers/authController.js'

import {
  validateSignup,
  validateLogin,
  validateResetRequest,
  validateNewPassword,
  validateOtp
} from '../validators/authValidator.js'

import { verifyCaptcha } from '../middleware/verifyCaptcha.js'
import { authLimiter, loginLimiter } from '../middleware/rateLimiter.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { revokeToken } from '../utils/tokenUtils.js'
import { generateCsrfToken } from '../middleware/csrfMiddleware.js';

const router = express.Router()

// 🔐 SIGNUP & ACTIVATION
router.post('/signup', authLimiter, verifyCaptcha, validateSignup, signup)
router.get('/activate', activateAccount)

// 🔐 LOGIN & OTP
router.post('/login', loginLimiter, verifyCaptcha, validateLogin, loginRequest)
router.post('/verify-otp', validateOtp, loginVerify)

// 🔐 PASSWORD RESET
router.post('/reset-request', authLimiter, verifyCaptcha, validateResetRequest, requestReset)
router.post('/validate-reset-token', validateResetToken)
router.post('/reset-password', validateNewPassword, resetPassword)

// 🔐 SESSION
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user })
})
router.post('/refresh', requireAuth, refreshToken)

router.get('/csrf-token', requireAuth, (req, res) => {
  const csrfToken = generateCsrfToken(req, res);
  res.json({ csrfToken });
});

// 🔐 LOGOUT
router.post('/logout', async (req, res) => {
  const token = req.cookies?.auth_token

  if (token) {
    try {
      await revokeToken(token)
    } catch (err) {
      console.error('[LOGOUT] Token revoke failed:', err)
    }
  }

  res.clearCookie('auth_token')
  res.status(200).json({ message: 'Logged out successfully.' })
})

export default router
