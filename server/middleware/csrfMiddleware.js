// middlewares/csrfMiddleware.js
import { doubleCsrf } from 'csrf-csrf';

const {
  generateCsrfToken, // Use this in your routes to provide a CSRF token.
  validateRequest, // Also a convenience if you plan on making your own middleware.
  doubleCsrfProtection, // This is the default CSRF protection middleware.
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'fallback-secret',
  getSessionIdentifier: (req) => req.cookies?.auth_token || '',
  cookieName: 'csrf-token',            //'__Host-csrf', for production use
  cookieOptions: {
    httpOnly: false,  // true in production
    sameSite: 'lax',
    secure: false, // true in production
    path: '/',
  },
});

export {
  doubleCsrfProtection,
  generateCsrfToken,
  validateRequest,
};
