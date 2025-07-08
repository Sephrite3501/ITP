import rateLimit from 'express-rate-limit';

// General purpose limiter (e.g., signup, reset request, etc.)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

// More aggressive limiter for login (optional)
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // limit to 5 attempts per 10 min
  message: {
    message: 'Too many login attempts. Please wait before retrying.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
