// server/controllers/userController.js
import bcrypt from 'bcrypt';
import pool from '../db/index.js';
import { logSecurityEvent } from '../services/logService.js';
import sanitizeHtml from 'sanitize-html';
import { validateAndSaveFiles } from '../utils/uploadMiddleware.js';


export const getUserProfile = async (req, res) => {
  const traceId = `USR-PROF-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const email = req.query.email;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!email) {
    logSecurityEvent({ traceId, action: 'get_user_profile', status: 'failed', ip, userAgent, message: 'Missing email' });
    return res.status(400).json({ error: `Email is required. (Ref: ${traceId})` });
  }

  try {
    const { rows } = await pool.query(
      'SELECT name, email, contact, address, member_type, account_status FROM users WHERE email=$1',
      [email]
    );

    if (!rows.length) {
      logSecurityEvent({ traceId, userEmail: email, action: 'get_user_profile', status: 'not_found', ip, userAgent, message: 'User not found' });
      return res.status(404).json({ error: 'User not found' });
    }

    const user = rows[0];
    res.json({
      name: user.name,
      email: user.email,
      contact: user.contact,
      address: user.address,
      memberType: user.member_type,
      accountStatus: user.account_status,
      submittedDocs: [] // Future expansion
    });

    logSecurityEvent({ traceId, userEmail: email, action: 'get_user_profile', status: 'success', ip, userAgent, message: 'Profile returned' });
  } catch (err) {
    console.error(`${traceId} user-profile error:`, err);
    logSecurityEvent({ traceId, userEmail: email, action: 'get_user_profile', status: 'error', ip, userAgent, message: err.message });
    res.status(500).json({ error: `Internal server error. (Ref: ${traceId})` });
  }
};

export const updateProfile = async (req, res) => {
  const traceId = `USR-UPD-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const { email, contact, address, currentPassword, newPassword } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!email || !currentPassword) {
    logSecurityEvent({ traceId, action: 'update_profile', status: 'failed', ip, userAgent, message: 'Missing email or current password' });
    return res.status(400).json({ error: `Email and current password are required. (Ref: ${traceId})` });
  }

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = userRes.rows[0];
    if (!user) {
      logSecurityEvent({ traceId, userEmail: email, action: 'update_profile', status: 'not_found', ip, userAgent, message: 'User not found' });
      return res.status(404).json({ error: `User not found. (Ref: ${traceId})` });
    }

    const passwordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordValid) {
      logSecurityEvent({ traceId, userEmail: email, action: 'update_profile', status: 'denied', ip, userAgent, message: 'Incorrect current password' });
      return res.status(403).json({ error: `Current password is incorrect. (Ref: ${traceId})` });
    }

    const updates = [];
    const values = [];
    let i = 1;

    if (contact) {
      updates.push(`contact=$${i++}`);
      values.push(contact);
    }
    if (address) {
      updates.push(`address=$${i++}`);
      values.push(address);
    }
    if (newPassword) {
      const hashed = await bcrypt.hash(newPassword, 10);
      updates.push(`password_hash=$${i++}`);
      values.push(hashed);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: `No fields to update. (Ref: ${traceId})` });
    }

    values.push(email); // WHERE clause
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE email=$${i}`, values);

    logSecurityEvent({
      traceId,
      userEmail: email,
      action: 'update_profile',
      status: 'success',
      ip,
      userAgent,
      message: `Updated fields: ${updates.map(f => f.split('=')[0]).join(', ')}`
    });

    res.status(200).json({ message: 'Profile updated successfully' });

  } catch (err) {
    console.error(`${traceId} update-profile error:`, err);
    logSecurityEvent({ traceId, userEmail: email, action: 'update_profile', status: 'error', ip, userAgent, message: err.message });
    res.status(500).json({ error: `Internal server error. (Ref: ${traceId})` });
  }
};

export const deleteAccount = async (req, res) => {
  const traceId = `DEL-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const { email, currentPassword } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!email || !currentPassword) {
    logSecurityEvent({ traceId, userEmail: email, action: 'delete_account', status: 'failed', ip, userAgent, message: 'Missing credentials' });
    return res.status(400).json({ error: `Email and password are required. (Ref: ${traceId})` });
  }

  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE email=$1 AND account_status=$2', [email, 'inactive']);
    if (!result.rows.length) {
      logSecurityEvent({ traceId, userEmail: email, action: 'delete_account', status: 'not_found', ip, userAgent, message: 'User not found or already deleted' });
      return res.status(404).json({ error: `User not found. (Ref: ${traceId})` });
    }

    const validPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!validPassword) {
      logSecurityEvent({ traceId, userEmail: email, action: 'delete_account', status: 'unauthorized', ip, userAgent, message: 'Invalid password' });
      return res.status(401).json({ error: `Invalid password. (Ref: ${traceId})` });
    }

    await pool.query('UPDATE users SET account_status=$1 WHERE email=$2', ['deleted', email]);
    logSecurityEvent({ traceId, userEmail: email, action: 'delete_account', status: 'success', ip, userAgent, message: 'Soft-deleted account' });
    return res.status(200).json({ message: 'Account deleted successfully.' });
  } catch (err) {
    console.error(`${traceId} delete-account error:`, err);
    logSecurityEvent({ traceId, userEmail: email, action: 'delete_account', status: 'error', ip, userAgent, message: err.message });
    return res.status(500).json({ error: `Internal server error. (Ref: ${traceId})` });
  }
};

export const submitProfilePicture = async (req, res) => {
  const traceId = `PROFILE-PIC-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  const email = req.session.user?.email;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  try {
    const { profilePicture } = await validateAndSaveFiles(req.files, email);

    await pool.query(
      'UPDATE users SET profile_picture_path=$1 WHERE email=$2',
      [profilePicture, email]
    );

    logSecurityEvent({
      traceId,
      userEmail: email,
      action: 'upload_profile_pic',
      status: 'success',
      ip,
      userAgent,
      message: 'Profile picture uploaded'
    });

    res.status(200).json({ message: 'Profile picture uploaded successfully.' });
  } catch (err) {
    console.error(`${traceId} upload-profile-pic error:`, err);
    logSecurityEvent({
      traceId,
      userEmail: email,
      action: 'upload_profile_pic',
      status: 'error',
      ip,
      userAgent,
      message: err.message
    });
    res.status(400).json({ error: `Upload failed: ${err.message}` });
  }
};

// [GET] Admin: Fetch all users (basic list with optional search/query param)
export const getAllUsers = async (req, res) => {
  try {
    const search = req.query.search?.toLowerCase() || ''
    const result = await pool.query(
      `SELECT id, name, email, contact, address, member_type, user_role, account_status
       FROM users
       WHERE LOWER(name) LIKE $1 OR LOWER(email) LIKE $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [`%${search}%`]
    )
    res.json({ users: result.rows })
  } catch (err) {
    console.error('[ADMIN] Fetch users failed:', err)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
}

export const submitVerificationDocs = async (req, res) => {
  const traceId = `VERIFY-UP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
  const email = req.user?.email
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const userAgent = req.headers['user-agent']

  if (!req.files || !req.files.paymentProof || !req.files.identityProof) {
    logSecurityEvent({ traceId, userEmail: email, action: 'submit_verification_docs', status: 'failed', ip, userAgent, message: 'Missing required files' })
    return res.status(400).json({ error: 'Both payment and identity documents are required.' })
  }

  try {
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    const userId = userResult.rows[0]?.id

    if (!userId) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { paymentProof, identityProof } = await validateAndSaveFiles(req.files, email)

    await pool.query(
      `INSERT INTO payment_submissions (user_id, payment_path, identity_path)
       VALUES ($1, $2, $3)`,
      [userId, paymentProof, identityProof]
    )

    logSecurityEvent({
      traceId,
      userEmail: email,
      action: 'submit_verification_docs',
      status: 'success',
      ip,
      userAgent,
      message: 'Verification submitted via payment_submissions'
    })

    res.status(200).json({ message: 'Verification documents submitted successfully.' })
  } catch (err) {
    console.error(`${traceId} file upload error:`, err)
    logSecurityEvent({
      traceId,
      userEmail: email,
      action: 'submit_verification_docs',
      status: 'error',
      ip,
      userAgent,
      message: err.message
    })
    res.status(400).json({ error: `Upload failed: ${err.message}` })
  }
}

export const getVerificationQueue = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id AS submission_id,
        u.id AS user_id,
        u.name,
        u.email,
        p.payment_path,
        p.identity_path,
        p.submitted_at
      FROM payment_submissions p
      JOIN users u ON p.user_id = u.id
      WHERE p.status = 'pending'
      ORDER BY p.submitted_at DESC
    `)

    res.json(result.rows)
  } catch (err) {
    console.error('[ADMIN] getVerificationQueue failed:', err)
    res.status(500).json({ error: 'Failed to fetch verification queue' })
  }
}

export const approveSubmission = async (req, res) => {
  const { submissionId, userId } = req.body
  const reviewerId = req.user?.id

  if (!submissionId || !userId) {
    return res.status(400).json({ error: 'Missing submission or user ID' })
  }

  const traceId = `APPROVE-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

  try {
    await pool.query(
      `UPDATE users SET account_status = 'active' WHERE id = $1`,
      [userId]
    )

    await pool.query(
      `UPDATE payment_submissions
       SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
       WHERE id = $2`,
      [reviewerId, submissionId]
    )

    logSecurityEvent({
      traceId,
      userEmail: req.user.email,
      action: 'approve_user',
      status: 'success',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      message: `Approved user ID ${userId} via submission ${submissionId}`
    })

    res.json({ message: 'User approved.' })
  } catch (err) {
    console.error(`${traceId} approve user error:`, err)
    res.status(500).json({ error: `Failed to approve user (Ref: ${traceId})` })
  }
}

