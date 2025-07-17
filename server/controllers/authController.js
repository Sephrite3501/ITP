import bcrypt from 'bcrypt';
import crypto from 'crypto';
import db from '../db/index.js';
import { sendActivationEmail, sendOtpEmail, sendResetPasswordEmail } from '../services/emailService.js';
import { logSecurityEvent } from '../services/logService.js';
import { generateAuthToken, saveSessionToken } from '../utils/tokenUtils.js';
import { validationResult } from 'express-validator';


import jwt from 'jsonwebtoken';

// SIGNUP
export const signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const traceId = `SIGNUP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const { name, email, password, contact, address, memberType, organization } = req.body;

  try {
    const existing = await db.query('SELECT id, account_status FROM users WHERE email=$1', [email]);

    if (existing.rows.length > 0) {
      const user = existing.rows[0];

      if (user.account_status === 'deleted') {
        const password_hash = await bcrypt.hash(password, 10);

        await db.query(`
          UPDATE users SET
            name=$1,
            password_hash=$2,
            contact=$3,
            address=$4,
            member_type=$5,
            organization=$6,
            account_status='pending',
            updated_at=NOW()
          WHERE id=$7
        `, [name, password_hash, contact, address, memberType, organization, user.id]);

        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 15 * 60 * 1000);

        await db.query(`
          INSERT INTO activation_tokens (user_id, token, expires_at)
          VALUES ($1, $2, $3)
        `, [user.id, token, expires]);

        try {
          await sendActivationEmail(email, token, name, 'reactivation');
        } catch (emailErr) {
          await logSecurityEvent({
            userId: user.id,
            action: 'signup_email_failed',
            details: `Reactivation email failed: ${emailErr.message}`,
            refId: traceId,
            req
          });

          return res.status(500).json({
            message: `Failed to send activation email. Please try again. (Ref: ${traceId})`
          });
        }

        await logSecurityEvent({
          userId: user.id,
          action: 'signup_reactivation',
          details: 'Reactivated deleted account and sent activation email',
          refId: traceId,
          req
        });

        return res.status(201).json({
          message: 'Signup successful. Please check your email to activate.'
        });
      }

      // Duplicate signup attempt on active/pending account
      await logSecurityEvent({
        userId: user.id,
        action: 'signup_attempt_existing',
        details: `Attempt to sign up with existing account (status: ${user.account_status})`,
        refId: traceId,
        req
      });

      return res.status(201).json({
        message: 'Signup successful. Please check your email to activate.'
      });
    }

    // New user signup
    const password_hash = await bcrypt.hash(password, 10);
    const insertRes = await db.query(`
      INSERT INTO users (name, email, password_hash, contact, address, member_type, organization)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [name, email, password_hash, contact, address, memberType, organization]);

    const userId = insertRes.rows[0].id;

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    await db.query(`
      INSERT INTO activation_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
    `, [userId, token, expires]);

    try {
      await sendActivationEmail(email, token, name);
    } catch (emailErr) {
      await logSecurityEvent({
        userId,
        action: 'signup_email_failed',
        details: `Activation email failed: ${emailErr.message}`,
        refId: traceId,
        req
      });
    }

    await logSecurityEvent({
      userId,
      action: 'signup_request',
      details: 'New signup initiated and activation email sent',
      refId: traceId,
      req
    });

    return res.status(201).json({
      message: 'Signup successful. Please check your email to activate.'
    });

  } catch (err) {
    console.error(`[SIGNUP] Error (Ref: ${traceId})`, err);

    await logSecurityEvent({
      action: 'signup_error',
      details: `Unhandled signup exception: ${err.message}`,
      refId: traceId,
      req
    });

    return res.status(500).json({
      message: `Something went wrong. Please contact support. (Ref: ${traceId})`
    });
  }
};

// ACTIVATE ACCOUNT
export const activateAccount = async (req, res) => {
  const traceId = `ACTIVATE-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const token = req.query.token;

  if (!token) {
    await logSecurityEvent({
      action: 'activate_account',
      details: 'Missing activation token',
      refId: traceId,
      req
    });
    return res.status(400).json({ message: `Invalid activation link. (Ref: ${traceId})` });
  }

  try {
    const result = await db.query(`
      SELECT user_id, expires_at, used
      FROM activation_tokens
      WHERE token = $1
    `, [token]);

    if (result.rows.length === 0) {
      await logSecurityEvent({
        action: 'activate_account',
        details: 'Invalid token provided',
        refId: traceId,
        req
      });
      return res.status(400).json({ message: `Invalid activation link. (Ref: ${traceId})` });
    }

    const { user_id, expires_at, used } = result.rows[0];

    if (used) {
      await logSecurityEvent({
        userId: user_id,
        action: 'activate_account',
        details: 'Token already used',
        refId: traceId,
        req
      });
      return res.status(400).json({ message: `This link has already been used. (Ref: ${traceId})` });
    }

    if (new Date(expires_at) < new Date()) {
      await logSecurityEvent({
        userId: user_id,
        action: 'activate_account',
        details: 'Token expired',
        refId: traceId,
        req
      });
      return res.status(400).json({ message: `Activation link expired. (Ref: ${traceId})` });
    }

    await db.query(`UPDATE users SET account_status = 'inactive' WHERE id = $1`, [user_id]);
    await db.query(`UPDATE activation_tokens SET used = true WHERE token = $1`, [token]);

    await logSecurityEvent({
      userId: user_id,
      action: 'activate_account',
      details: 'Account activated successfully',
      refId: traceId,
      req
    });

    return res.status(200).json({ message: 'Account activated.' });
  } catch (err) {
    console.error(`[ACTIVATE] Error (Ref: ${traceId})`, err);

    await logSecurityEvent({
      action: 'activate_account',
      details: `Unhandled error: ${err.message}`,
      refId: traceId,
      req
    });

    return res.status(500).json({
      message: `Activation failed. Please try again. (Ref: ${traceId})`
    });
  }
};

// LOGIN
export const loginRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const traceId = `LOGIN-REQ-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const { email, password } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    const result = await db.query(
      `SELECT * FROM users WHERE email=$1 AND account_status IN ('inactive', 'active', 'locked')`,
      [email]
    );
    const user = result.rows[0];
    
    const isValid = user && await bcrypt.compare(password, user.password_hash);
    const isFail = !isValid;

    if (user.account_status === 'locked') {
      await logSecurityEvent({ traceId, userEmail: email, action: 'login_request', status: 'locked', ip, userAgent, message: 'Account is locked' });
      return res.status(403).json({ error: 'Your account is locked. Please contact support.' });
    }

    await db.query(`
      INSERT INTO login_attempts (email, success, ip_address, user_agent)
      VALUES ($1, $2, $3, $4)
    `, [email, !isFail, ip, userAgent]);

    if (isFail) {
      const failWindow = new Date(Date.now() - 10 * 60 * 1000);
      const { rows } = await db.query(
        `SELECT COUNT(*) FROM login_attempts WHERE email = $1 AND success = false AND created_at > $2`,
        [email, failWindow]
      );
      const failCount = parseInt(rows[0].count, 10);

      if (failCount >= 5) {
        await db.query(`UPDATE users SET account_status = 'locked', updated_at = NOW() WHERE email = $1`, [email]);
        await logSecurityEvent({ traceId, userEmail: email, action: 'login_lockout', status: 'locked', ip, userAgent, message: 'Too many failed attempts - account locked' });
        return res.status(403).json({ error: 'Account locked due to repeated login failures. Please contact support.' });
      }

      await logSecurityEvent({ traceId, userEmail: email, action: 'login_request', status: 'invalid', ip, userAgent, message: 'Invalid login credentials' });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    await db.query(`
      INSERT INTO login_otp (email, code, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE SET code=$2, expires_at=$3, created_at=NOW()
    `, [email, otp, expires]);

    await sendOtpEmail(email, otp, user.name);
    await logSecurityEvent({ traceId, userEmail: email, action: 'login_request', status: 'otp_sent', ip, userAgent, message: 'OTP sent after valid credentials' });

    res.json({ message: 'OTP sent to email', success: true });
  } catch (err) {
    console.error(`[${traceId}] login-request error:`, err);
    return res.status(500).json({ error: 'Internal error' });
  }
};

export const loginVerify = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const traceId = `LOGIN-VER-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const { email, otp } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    const recentWindow = new Date(Date.now() - 10 * 60 * 1000);
    const { rows: attemptRows } = await db.query(`
      SELECT COUNT(*) FROM otp_attempts
      WHERE email = $1 AND ip_address = $2 AND attempt_time > $3
    `, [email, ip, recentWindow]);

    if (parseInt(attemptRows[0].count, 10) >= 5) {
      await logSecurityEvent({ traceId, userEmail: email, action: 'login_verify', status: 'rate_limited', ip, userAgent, message: 'Too many OTP attempts' });
      return res.status(429).json({ error: 'Too many OTP attempts. Please try again later.' });
    }

    const otpResult = await db.query(`SELECT * FROM login_otp WHERE email = $1`, [email]);
    const record = otpResult.rows[0];

    const expired = !record || record.code !== otp || new Date(record.expires_at) < new Date();
    if (expired) {
      await db.query(`INSERT INTO otp_attempts (email, ip_address) VALUES ($1, $2)`, [email, ip]);
      await logSecurityEvent({ traceId, userEmail: email, action: 'login_verify', status: 'fail', ip, userAgent, message: 'Invalid or expired OTP' });
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    const userRes = await db.query(
      `SELECT id, name, email, user_role FROM users WHERE email=$1 AND account_status IN ('inactive', 'active')`,
      [email]
    );

    if (!userRes.rows.length) {
      await logSecurityEvent({ traceId, userEmail: email, action: 'login_verify', status: 'fail', ip, userAgent, message: 'User account not found or inactive' });
      return res.status(403).json({ error: 'Your account is not permitted to log in.' });
    }

    const user = userRes.rows[0];
    const token = generateAuthToken();

    await Promise.all([
      db.query(`DELETE FROM session_tokens WHERE user_id = $1`, [user.id]),
      db.query(`DELETE FROM login_otp WHERE email = $1`, [email]),
      db.query(`DELETE FROM otp_attempts WHERE email = $1 AND ip_address = $2`, [email, ip]),
      saveSessionToken({ token, userId: user.id, role: user.user_role, ip, userAgent })
    ]);

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: false, // set true in production
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000
    });

    await logSecurityEvent({
      traceId,
      userEmail: email,
      action: 'login_verify',
      status: 'success',
      ip,
      userAgent,
      message: 'OTP verified, session issued'
    });

    res.json({ message: 'Login successful', user });
  } catch (err) {
    console.error(`[${traceId}] login-verify error:`, err);
    return res.status(500).json({ error: 'Internal error' });
  }
};

// PASSWORD RESET
export const requestReset = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const traceId = `PWD-REQ-${Math.random().toString(36).substr(2,5).toUpperCase()}`;
  const { email } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    const result = await db.query('SELECT email, name FROM users WHERE email = $1', [email]);

    if (!result.rows.length) {
      await logSecurityEvent({ traceId, userEmail: email, action: 'password_reset_request', status: 'not_found', ip, userAgent, message: 'Email not found' });
      return res.status(200).json({ message: 'If an account with this email exists, a reset link has been sent.' });
    }

    const token = jwt.sign({ email }, process.env.RESET_PASSWORD_SECRET, { expiresIn: '15m' });
    await sendResetPasswordEmail(email, token, result.rows[0].name);

    await logSecurityEvent({ traceId, userEmail: email, action: 'password_reset_request', status: 'success', ip, userAgent, message: 'Reset email sent' });

    res.status(200).json({ message: 'Password reset email sent.' });
  } catch (err) {
    console.error(`[${traceId}] Password reset request error:`, err);

    await logSecurityEvent({ traceId, userEmail: email, action: 'password_reset_request', status: 'error', ip, userAgent, message: err.message });

    res.status(500).json({ error: `Internal server error. (Ref: ${traceId})` });
  }
};

export const validateResetToken = async (req, res) => {
  const { token } = req.body;
  const traceId = `TOKEN-CHECK-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  try {
    jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
    res.json({ valid: true });
  } catch (err) {
    console.warn(`[${traceId}] Invalid or expired reset token:`, err.message);
    res.status(400).json({ valid: false, error: `Invalid or expired token. (Ref: ${traceId})` });
  }
};

export const resetPassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const traceId = `PWD-RESET-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const { token, password } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
    const email = decoded?.email;

    if (!email) {
      return res.status(400).json({ error: `Invalid token payload. (Ref: ${traceId})` });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await db.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING id`,
      [hashed, email]
    );

    if (!result.rows.length) {
      await logSecurityEvent({ action: 'password_reset', details: 'Email not found during reset', refId: traceId, req });
      return res.status(404).json({ error: `User not found. (Ref: ${traceId})` });
    }

    await logSecurityEvent({
      userId: result.rows[0].id,
      action: 'password_reset',
      details: 'Password successfully reset',
      refId: traceId,
      req
    });

    res.status(200).json({ success: true, message: 'Password reset successful.' });
  } catch (err) {
    console.error(`[${traceId}] Password reset error:`, err.message);

    await logSecurityEvent({
      action: 'password_reset',
      details: `Reset failed: ${err.message}`,
      refId: traceId,
      req
    });

    res.status(400).json({
      error: `Invalid or expired reset token. (Ref: ${traceId})`
    });
  }
};

// Refresh session token
export const refreshToken = async (req, res) => {
  const traceId = `REFRESH-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    const session = req.user;
    if (!session || !session.token) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const newExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(`
      UPDATE session_tokens
      SET expires_at = $1
      WHERE token = $2
    `, [newExpiry, session.token]);

    res.cookie('auth_token', session.token, {
      httpOnly: true,
      secure: false, // 🚨 Set to true in production!
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000
    });

    await logSecurityEvent({
      userId: session.user_id,
      action: 'session_refresh',
      details: 'Session expiry extended via /auth/refresh',
      refId: traceId,
      req
    });

    res.json({ success: true, message: 'Session expiry extended' });
  } catch (err) {
    await logSecurityEvent({
      action: 'session_refresh',
      details: `Refresh error: ${err.message}`,
      refId: traceId,
      req
    });

    res.status(500).json({ error: `Failed to refresh session (Ref: ${traceId})` });
  }
};

