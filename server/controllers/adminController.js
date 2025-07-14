import db from '../db/index.js';
import { logSecurityEvent } from '../services/logService.js';

export const lockUser = async (req, res) => {
  const { userId } = req.body;
  const adminId = req.user.id; // populated by requireAuth + requireAdmin

  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    await db.query(`UPDATE users SET account_status = 'locked', updated_at = NOW() WHERE id = $1`, [userId]);

    await logSecurityEvent({
      userId: adminId,
      action: 'admin_lock_user',
      details: `User ${userId} locked`,
      refId: `ADMIN-${userId}-LOCK`,
      req
    });

    res.json({ message: `User ${userId} locked.` });
  } catch (err) {
    console.error('[Admin Lock User] Error:', err);
    res.status(500).json({ error: 'Failed to lock user' });
  }
};

export const unlockUser = async (req, res) => {
  const { userId } = req.body;
  const adminId = req.user.id;

  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    await db.query(`UPDATE users SET account_status = 'active', updated_at = NOW() WHERE id = $1`, [userId]);

    await logSecurityEvent({
      userId: adminId,
      action: 'admin_unlock_user',
      details: `User ${userId} unlocked`,
      refId: `ADMIN-${userId}-UNLOCK`,
      req
    });

    res.json({ message: `User ${userId} unlocked.` });
  } catch (err) {
    console.error('[Admin Unlock User] Error:', err);
    res.status(500).json({ error: 'Failed to unlock user' });
  }
};

export const softDeleteUser = async (req, res) => {
  const { userId } = req.body;
  const adminId = req.user.id;

  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    await db.query(`
      UPDATE users SET account_status = 'deleted', updated_at = NOW()
      WHERE id = $1
    `, [userId]);

    await logSecurityEvent({
      userId: adminId,
      action: 'admin_delete_user',
      details: `User ${userId} soft-deleted`,
      refId: `ADMIN-${userId}-DELETE`,
      req
    });

    res.json({ message: `User ${userId} deleted.` });
  } catch (err) {
    console.error('[Admin Delete User] Error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const search = req.query.search?.toLowerCase() || ''
    const result = await db.query(
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

export const getVerificationQueue = async (req, res) => {
  try {
    const result = await db.query(`
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
    await db.query(
      `UPDATE users SET account_status = 'active' WHERE id = $1`,
      [userId]
    )

    await db.query(
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