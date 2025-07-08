import db from '../db/index.js';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

export const logSecurityEvent = async ({
  userId = null,
  action,
  details = '',
  refId = null,
  req = null
}) => {
  try {
    const ip = req?.ip || req?.headers['x-forwarded-for'] || '';
    const userAgent = req?.headers?.['user-agent'] || '';
    const traceId = uuidv4();
    console.log('[LOG EVENT]', { userId, action, details });

    await db.query(
      `INSERT INTO audit_logs (user_id, action, details, ref_id, ip_address, user_agent, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [userId, action, details, refId || traceId, ip, userAgent]
    );
  } catch (err) {
    console.error('[AUDIT LOG ERROR]', err);
  }
};
