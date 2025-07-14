import bcrypt from 'bcrypt';
import crypto from 'crypto';
import db from '../db/index.js';
import { sendActivationEmail, sendOtpEmail, sendResetPasswordEmail } from '../services/emailService.js';
import { logSecurityEvent } from '../services/logService.js';
import { generateAuthToken, saveSessionToken } from '../utils/tokenUtils.js';

import jwt from 'jsonwebtoken';

// SIGNUP
export const signup = async (req, res) => {
  const traceId = `SIGNUP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const { name, email, password, contact, address, memberType } = req.body;

  try {
    // Check if user exists
    const existing = await db.query('SELECT id, account_status FROM users WHERE email=$1', [email]);

    if (existing.rows.length > 0) {
      const user = existing.rows[0];

      if (user.account_status === 'deleted') {
          const password_hash = await bcrypt.hash(password, 10)
  await db.query(
    `UPDATE users
        SET name=$1,
            password_hash=$2,
            contact=$3,
            address=$4,
            member_type=$5,
            account_status='pending',
            updated_at=NOW()
      WHERE id=$6`,
    [name, password_hash, contact, address, memberType, user.id]
  )
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  await db.query(
    `INSERT INTO activation_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [user.id, token, expires]
  );

  try {
    await sendActivationEmail(email, token, name, 'reactivation');

    await logSecurityEvent({
      userId: user.id,
      action: 'signup_request',
      details: 'Account reactivation triggered',
      refId: traceId,
      req
    });

    return res.status(201).json({
      message: 'Signup successful. Please check your email to activate.'
    });

  } catch (emailErr) {
    console.error(`[SIGNUP] Email failed (Ref: ${traceId})`, emailErr);

    await logSecurityEvent({
      userId: user.id,
      action: 'signup_reactivation',
      details: `Email send failed: ${emailErr.message}`,
      refId: traceId,
      req
    });

    return res.status(500).json({
      message: `Failed to send activation email. Please try again. (Ref: ${traceId})`
    });
  }
}


      await logSecurityEvent({
        userId: user.id,
        action: 'signup_request',
        details: 'Duplicate signup attempt - account exists',
        refId: traceId,
        req
      });

      return res.status(201).json({
      message: 'Signup successful. Please check your email to activate.'
    });
    }

    // Insert new user
    const password_hash = await bcrypt.hash(password, 10);
    const insertRes = await db.query(
      `INSERT INTO users (name, email, password_hash, contact, address, member_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [name, email, password_hash, contact, address, memberType]
    );

    const userId = insertRes.rows[0].id;

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    await db.query(
      `INSERT INTO activation_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
      [userId, token, expires]
    );

    try {
      await sendActivationEmail(email, token, name);
    } catch (emailErr) {
      console.error(`[SIGNUP] Email failed (Ref: ${traceId})`, emailErr);
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
      details: 'New signup and activation link issued',
      refId: traceId,
      req
    });

    return res.status(201).json({
      message: 'Signup successful. Please check your email to activate.'
    });
  } catch (err) {
    console.error(`[SIGNUP] Error (Ref: ${traceId})`, err);

    await logSecurityEvent({
      action: 'signup_request',
      details: `Fatal signup error: ${err.message}`,
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
    await logSecurityEvent({ action: 'activate_account', details: 'Missing activation token', refId: traceId, req });
    return res.status(400).json({ message: `Invalid activation link. (Ref: ${traceId})` });
  }

  try {
    const result = await db.query(`
      SELECT user_id, expires_at, used
      FROM activation_tokens
      WHERE token = $1
    `, [token]);

    if (result.rows.length === 0) {
      await logSecurityEvent({ action: 'activate_account', details: 'Invalid token', refId: traceId, req });
      return res.status(400).json({ message: `Invalid activation link. (Ref: ${traceId})` });
    }

    const { user_id, expires_at, used } = result.rows[0];

    if (used || new Date(expires_at) < new Date()) {
      await logSecurityEvent({ userId: user_id, action: 'activate_account', details: 'Expired or already used token', refId: traceId, req });
      return res.status(400).json({ message: `Activation link expired. (Ref: ${traceId})` });
    }

    await db.query('UPDATE users SET account_status = $1 WHERE id = $2', ['inactive', user_id]);
    await db.query('UPDATE activation_tokens SET used = true WHERE token = $1', [token]);

    await logSecurityEvent({ userId: user_id, action: 'activate_account', details: 'Account activated successfully', refId: traceId, req });

    return res.status(200).json({ message: 'Account activated.' });
  } catch (err) {
    console.error(`[ACTIVATE] Error (Ref: ${traceId})`, err);
    await logSecurityEvent({ action: 'activate_account', details: `Error: ${err.message}`, refId: traceId, req });
    return res.status(500).json({ message: `Activation failed. Please try again. (Ref: ${traceId})` });
  }
};


// LOGIN
export const loginRequest = async (req, res) => {
  const traceId = `LOGIN-REQ-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const { email, password } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    const result = await db.query(`SELECT * FROM users WHERE email=$1 AND account_status IN ('inactive', 'active')`, [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      logSecurityEvent({ traceId, userEmail: email, action: 'login_request', status: 'invalid', ip, userAgent, message: 'Invalid credentials' });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await db.query(`
      INSERT INTO login_otp (email, code, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE SET code=$2, expires_at=$3, created_at=NOW()
    `, [email, code, expires]);

    await sendOtpEmail(email, code, user.name);

    logSecurityEvent({ traceId, userEmail: email, action: 'login_request', status: 'otp_sent', ip, userAgent, message: 'OTP sent' });

    return res.json({ message: 'OTP sent to email', success: true });
  } catch (err) {
    console.error(`${traceId} login-request error:`, err);
    return res.status(500).json({ error: 'Internal error' });
  }
};

export const loginVerify = async (req, res) => {
  const traceId = `LOGIN-VER-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const { email, otp } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    // 🔒 Step 1: Rate Limit Check
    const windowStart = new Date(Date.now() - 10 * 60 * 1000); // last 10 minutes
    const attemptRes = await db.query(`
      SELECT COUNT(*) FROM otp_attempts
      WHERE email = $1 AND ip_address = $2 AND attempt_time > $3
    `, [email, ip, windowStart]);

    const attemptCount = parseInt(attemptRes.rows[0].count, 10);
    if (attemptCount >= 5) {
      await logSecurityEvent({
        traceId,
        userEmail: email,
        action: 'login_verify',
        status: 'rate_limited',
        ip,
        userAgent,
        message: 'Too many OTP attempts'
      });
      return res.status(429).json({ error: 'Too many OTP attempts. Please wait and try again.' });
    }

    // Step 2: OTP validation
    const result = await db.query(`SELECT * FROM login_otp WHERE email=$1`, [email]);
    const record = result.rows[0];

    if (!record || record.code !== otp || new Date(record.expires_at) < new Date()) {
      // 🔐 Step 2.1: Record failed attempt
      await db.query(`INSERT INTO otp_attempts (email, ip_address) VALUES ($1, $2)`, [email, ip]);

      logSecurityEvent({
        traceId,
        userEmail: email,
        action: 'login_verify',
        status: 'fail',
        ip,
        userAgent,
        message: 'Invalid/expired OTP'
      });

      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // Step 3: User lookup + session logic
    const userRes = await db.query(`
      SELECT id, name, email, user_role FROM users 
      WHERE email=$1 AND account_status IN ('inactive', 'active')`,
      [email]
    );

    if (!userRes.rows.length) {
      logSecurityEvent({
        traceId,
        userEmail: email,
        action: 'login_verify',
        status: 'fail',
        ip,
        userAgent,
        message: 'Account status invalid'
      });
      return res.status(403).json({ error: 'Your account is not permitted to log in.' });
    }

    const user = userRes.rows[0];

    await db.query(`DELETE FROM session_tokens WHERE user_id = $1`, [user.id]); // Clean up old sessions
    await db.query(`DELETE FROM login_otp WHERE email=$1`, [email]);            // Clean up used OTP
    await db.query(`DELETE FROM otp_attempts WHERE email=$1 AND ip_address=$2`, [email, ip]); // 🧹 Clear failed attempt log

    // Step 4: Generate new session
    const token = generateAuthToken();
    await saveSessionToken({
      token,
      userId: user.id,
      role: user.user_role,
      ip,
      userAgent
    });

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: false, // set to true in production
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    logSecurityEvent({
      traceId,
      userEmail: email,
      action: 'login_verify',
      status: 'success',
      ip,
      userAgent,
      message: 'OTP verified, session token issued'
    });

    return res.json({ message: 'Login successful', user });
  } catch (err) {
    console.error(`${traceId} login-verify error:`, err);
    return res.status(500).json({ error: 'Internal error' });
  }
};


export const requestReset = async (req, res) => {
  const traceId = `PWD-REQ-${Math.random().toString(36).substr(2,5).toUpperCase()}`;
  const { email } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];
  try {
    const result = await db.query('SELECT email,name FROM users WHERE email=$1',[email]);
    if (!result.rows.length) {
      logSecurityEvent({ traceId, userEmail: email, action:'password_reset_request', status:'not_found', ip, userAgent, message:'Email not found' });
      return res.status(200).json({ message:'If an account with this email exists, a reset link has been sent.' });
    }
    const resetToken = jwt.sign({ email }, process.env.RESET_PASSWORD_SECRET,{ expiresIn:'15m' });
    await sendResetPasswordEmail(email, resetToken, result.rows[0].name);
    logSecurityEvent({ traceId, userEmail: email, action:'password_reset_request', status:'success', ip, userAgent, message:'Reset email sent' });
    res.status(200).json({ message:'Password reset email sent' });
  } catch(err) {
    console.error(`${traceId} password-reset-request error:`,err);
    logSecurityEvent({ traceId, userEmail: email, action:'password_reset_request', status:'error', ip, userAgent, message:err.message });
    res.status(500).json({ error:`Internal server error. (Ref: ${traceId})` });
  }
};

export const validateResetToken = async (req, res) => {
  const { token } = req.body;
  const traceId = `TOKEN-CHECK-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  try {
    jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
    return res.json({ valid: true });
  } catch (err) {
    console.warn(`[TOKEN CHECK FAIL] Ref: ${traceId}`, err.message);
    return res.status(400).json({ valid: false, error: `Invalid or expired token. (Ref: ${traceId})` });
  }
};

export const resetPassword = async (req, res) => {
  const traceId = `PWD-RESET-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const { token, password } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    console.log(`[RESET PASSWORD] ${traceId} - Incoming token:`, token);
    console.log(`[RESET PASSWORD] ${traceId} - Incoming password length:`, password?.length);

    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);
    console.log(`[RESET PASSWORD] ${traceId} - Decoded token:`, decoded);

    if (!decoded?.email) {
      console.warn(`[RESET PASSWORD] ${traceId} - No email in decoded token`);
      return res.status(400).json({ error: `Invalid token payload. (Ref: ${traceId})` });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING id',
      [hashed, decoded.email]
    );

    if (!result.rows.length) {
      await logSecurityEvent({
        action: 'password_reset',
        details: 'Email not found during reset',
        refId: traceId,
        req
      });
      return res.status(404).json({ error: `User not found. (Ref: ${traceId})` });
    }

    await logSecurityEvent({
      userId: result.rows[0].id,
      action: 'password_reset',
      details: 'Password updated via reset',
      refId: traceId,
      req
    });

    res.status(200).json({ success: true, message: 'Password reset successful.' });

  } catch (err) {
    console.error(`[RESET PASSWORD ERROR] ${traceId}:`, err.message);

    await logSecurityEvent({
      action: 'password_reset',
      details: `Error: ${err.message}`,
      refId: traceId,
      req
    });

    res.status(400).json({
      error: `Invalid or expired reset token. (Ref: ${traceId})`
    });
  }
};

