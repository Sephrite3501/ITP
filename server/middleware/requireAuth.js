import { findUserByToken } from '../utils/tokenUtils.js';

/**
 * Middleware: Validate auth_token from cookie and attach user to req
 */
export const requireAuth = async (req, res, next) => {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({ error: 'Not authenticated (no token)' });
  }

  try {
    const user = await findUserByToken(token);

    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user; // attach user info to request
    next();
  } catch (err) {
    console.error('[requireAuth] Token validation failed:', err);
    res.status(500).json({ error: 'Authentication check failed' });
  }
};
