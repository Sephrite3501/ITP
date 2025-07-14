import crypto from 'crypto';
import db from '../db/index.js';

/**
 * Generate a secure random token
 */
export const generateAuthToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Save a new session token into the DB
 */
export const saveSessionToken = async ({ token, userId, role, ip, userAgent, expiresIn = 3600 }) => {
  const expiresAt = new Date(Date.now() + expiresIn * 1000); // default 1 hour

  // ✅ First, delete all existing sessions for this user
  await db.query(`DELETE FROM session_tokens WHERE user_id = $1`, [userId]);

  // ✅ Then insert the new session
  await db.query(`
    INSERT INTO session_tokens (token, user_id, role, ip, user_agent, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [token, userId, role, ip, userAgent, expiresAt]);
};


/**
 * Lookup token in DB and return user info
 */
export const findUserByToken = async (token) => {
  console.log('[DEBUG] Checking token:', token)

  const result = await db.query(`
    SELECT users.id, users.email, users.name, users.user_role, users.account_status AS role
    FROM session_tokens
    JOIN users ON session_tokens.user_id = users.id
    WHERE session_tokens.token = $1 AND session_tokens.expires_at > NOW()
  `, [token]);

    console.log('[DEBUG] Token query result:', result.rows)

  const user = result.rows[0];
  if (user) {
    user.token = token; // ✅ Include the token so refresh logic works
  }
  return user || null;
};


/**
 * Remove a session token (logout)
 */
export const revokeToken = async (token) => {
  await db.query(`DELETE FROM session_tokens WHERE token = $1`, [token]);
};
