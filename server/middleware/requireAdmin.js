import { logSecurityEvent } from '../services/logService.js'

export const requireAdmin = (req, res, next) => {
  const traceId = `ADMIN-GATE-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!req.user || req.user.user_role !== 'admin') {
    logSecurityEvent({
      traceId,
      userId: req.user?.id || null,
      action: 'require_admin_check',
      status: 'denied',
      ip,
      userAgent,
      message: 'Unauthorized admin access attempt'
    });

    return res.status(403).json({ error: `Forbidden. Admin access required. (Ref: ${traceId})` });
  }

  next();
};
