import { findUserByToken } from '../utils/tokenUtils.js';
import { logSecurityEvent } from '../services/logService.js';

/**
 * Middleware: Validate auth_token from cookie and attach user to req
 */
export const requireAuth = async (req, res, next) => {
  const traceId = `AUTH-GATE-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const token = req.cookies?.auth_token;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!token) {
    await logSecurityEvent({
      traceId,
      action: 'require_auth_check',
      status: 'missing_token',
      ip,
      userAgent,
      message: 'No authentication token found'
    });
    return res.status(401).json({ error: `Not authenticated (Ref: ${traceId})` });
  }

  try {
    const user = await findUserByToken(token);

    if (!user) {
      await logSecurityEvent({
        traceId,
        action: 'require_auth_check',
        status: 'invalid_token',
        ip,
        userAgent,
        message: 'Invalid or expired auth token'
      });
      return res.status(401).json({ error: `Invalid session (Ref: ${traceId})` });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(`[requireAuth] ${traceId} Token validation failed:`, err);
    await logSecurityEvent({
      traceId,
      action: 'require_auth_check',
      status: 'error',
      ip,
      userAgent,
      message: err.message
    });
    res.status(500).json({ error: `Authentication error (Ref: ${traceId})` });
  }
};
