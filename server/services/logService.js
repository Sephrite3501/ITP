import db from '../db/index.js'
import { v4 as uuidv4 } from 'uuid'

export const logSecurityEvent = async ({
  category = 'auth',           // auth, admin, csrf, error, session
  userId = null,
  action,
  details = '',
  refId = null,
  severity = 'low',            // low / medium / high / critical
  errorType = null,            // only for error_logs
  message = null,              // only for error_logs
  stack = null,                // only for error_logs
  targetUserId = null,         // only for admin_logs
  sessionId = null,            // only for session_logs
  reason = null,               // only for csrf_logs
  req = null
}) => {
  try {
    const ip = req?.ip || req?.headers['x-forwarded-for'] || ''
    const userAgent = req?.headers?.['user-agent'] || ''
    const traceId = refId || uuidv4()

    switch (category) {
      case 'auth':
        await db.query(
          `INSERT INTO auth_logs (user_id, action, details, ref_id, ip_address, user_agent, severity, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [userId, action, details, traceId, ip, userAgent, severity]
        )
        break

      case 'admin':
        await db.query(
          `INSERT INTO admin_logs (admin_id, action, target_user_id, details, ref_id, ip_address, user_agent, severity, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [userId, action, targetUserId, details, traceId, ip, userAgent, severity]
        )
        break

      case 'csrf':
        await db.query(
          `INSERT INTO csrf_logs (user_id, reason, ref_id, ip_address, user_agent, severity, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [userId, reason || details, traceId, ip, userAgent, severity]
        )
        break

      case 'error':
        await db.query(
          `INSERT INTO error_logs (user_id, error_type, message, stack, ref_id, severity, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [userId, errorType || action, message || details, stack, traceId, severity]
        )
        break

      case 'session':
        await db.query(
          `INSERT INTO session_logs (user_id, session_id, action, ip_address, user_agent, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [userId, sessionId, action, ip, userAgent]
        )
        break

      default:
        console.warn('[LOG] Unknown category:', category)
    }
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err)
  }
}
