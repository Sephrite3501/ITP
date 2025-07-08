import express from 'express';
import {
  signup,
  activateAccount,
  loginRequest,
  loginVerify,
  requestReset,
  validateResetToken,
  resetPassword
} from '../controllers/authController.js'

import {
  validateSignup,
  validateLogin,
  validateResetRequest,
  validateNewPassword
} from '../validators/authValidator.js';

import { verifyCaptcha } from '../middleware/verifyCaptcha.js';
import { authLimiter, loginLimiter } from '../middleware/rateLimiter.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { revokeToken } from '../utils/tokenUtils.js';



const router = express.Router();

// SIGNUP
router.post('/signup', authLimiter, verifyCaptcha, validateSignup, signup);

// ACTIVATE ACCOUNT
router.get('/activate', activateAccount);

// LOGIN
router.post('/login', loginLimiter, verifyCaptcha, validateLogin, loginRequest);

// VERIFY OTP
router.post('/verify-otp', loginVerify);

// PASSWORD RESET REQUEST
router.post('/reset-request', authLimiter, verifyCaptcha, validateResetRequest, requestReset);

// VALIDATE RESET TOKEN
router.post('/validate-reset-token', validateResetToken);

// RESET PASSWORD
router.post('/reset-password', validateNewPassword, resetPassword);

// Get current logged-in user using auth_token
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Logout: clear cookie + delete token from DB
router.post('/logout', async (req, res) => {
  const token = req.cookies?.auth_token;

  if (token) {
    try {
      await revokeToken(token);
    } catch (err) {
      console.error('[LOGOUT] Token revoke failed:', err);
      // Proceed anyway — logout should not error out
    }
  }

  res.clearCookie('auth_token');
  res.status(200).json({ message: 'Logged out successfully.' });
});

export default router;
