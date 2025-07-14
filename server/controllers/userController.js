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





export const getUserFromToken = async (token) => {
  if (!token) return null;

  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.user_role
      FROM session_tokens st
      JOIN users u ON st.user_id = u.id
      WHERE st.token = $1 AND st.expires_at > NOW()
    `, [token]);

    return result.rows[0] || null;
  } catch (err) {
    console.error('Error in getUserFromToken:', err);
    return null;
  }
};


export const getUserRegisteredEvents = async (req, res) => {
  const token = req.cookies?.auth_token

  const user = await getUserFromToken(token)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const result = await pool.query(
      `SELECT 
        e.id,
        e.name AS title,
        e.date,
        e.location,
        er.registered_at
      FROM event_registrations er
      JOIN events e ON er.event_id = e.id
      WHERE er.user_id = $1
      ORDER BY e.date DESC`,
      [user.id]
    )

    return res.status(200).json(result.rows)
  } catch (err) {
    console.error('Error fetching registered events:', err)
    return res.status(500).json({ error: 'Failed to fetch registered events' })
  }
}

export const unregisterUserFromEvent = async (req, res) => {
  const token = req.cookies?.auth_token
  const eventId = req.params.eventId

  const user = await getUserFromToken(token)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const result = await pool.query(
      `DELETE FROM event_registrations WHERE event_id = $1 AND user_id = $2`,
      [eventId, user.id]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Registration not found' })
    }

    return res.status(200).json({ message: 'Unregistered successfully' })
  } catch (err) {
    console.error('Error unregistering from event:', err)
    return res.status(500).json({ error: 'Failed to unregister' })
  }
}

