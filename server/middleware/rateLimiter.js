import rateLimit from 'express-rate-limit'

// 🔒 General-purpose rate limiter (e.g., signup, password reset)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per window
  message: {
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// 🔐 Aggressive limiter for login attempts
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // limit each IP to 5 login attempts
  message: {
    message: 'Too many login attempts. Please wait before retrying.'
  },
  standardHeaders: true,
  legacyHeaders: false,
})
