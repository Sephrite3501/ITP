import db from '../db/index.js';
import { logSecurityEvent } from '../services/logService.js';

export const lockUser = async (req, res) => {
  const { userId } = req.body;
  const adminId = req.user.id;
  const refId = `ADMIN-${userId}-LOCK`;

  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    await db.query(
      `UPDATE users SET account_status = 'locked', updated_at = NOW() WHERE id = $1`,
      [userId]
    );

    await logSecurityEvent({
      userId: adminId,
      action: 'admin_lock_user',
      details: `User ${userId} locked`,
      refId,
      category: 'admin',
      type: 'account',
      severity: 'medium',
      req,
    });

    res.json({ message: `User ${userId} locked.` });
  } catch (err) {
    await logSecurityEvent({
      userId: adminId,
      action: 'admin_lock_user',
      details: `Error locking user ${userId}: ${err.message}`,
      refId,
      category: 'admin',
      type: 'account',
      severity: 'high',
      req,
    });
    res.status(500).json({ error: `Failed to lock user (Ref: ${refId})` });
  }
};

export const unlockUser = async (req, res) => {
  const { userId } = req.body;
  const adminId = req.user.id;
  const refId = `ADMIN-${userId}-UNLOCK`;

  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    await db.query(
      `UPDATE users SET account_status = 'active', updated_at = NOW() WHERE id = $1`,
      [userId]
    );

    await logSecurityEvent({
      userId: adminId,
      action: 'admin_unlock_user',
      details: `User ${userId} unlocked`,
      refId,
      category: 'admin',
      type: 'account',
      severity: 'medium',
      req,
    });

    res.json({ message: `User ${userId} unlocked.` });
  } catch (err) {
    await logSecurityEvent({
      userId: adminId,
      action: 'admin_unlock_user',
      details: `Error unlocking user ${userId}: ${err.message}`,
      refId,
      category: 'admin',
      type: 'account',
      severity: 'high',
      req,
    });
    res.status(500).json({ error: `Failed to unlock user (Ref: ${refId})` });
  }
};

export const softDeleteUser = async (req, res) => {
  const { userId } = req.body;
  const adminId = req.user.id;
  const refId = `ADMIN-${userId}-DELETE`;

  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    await db.query(
      `UPDATE users SET account_status = 'deleted', updated_at = NOW() WHERE id = $1`,
      [userId]
    );

    await logSecurityEvent({
      userId: adminId,
      action: 'admin_delete_user',
      details: `User ${userId} soft-deleted`,
      refId,
      category: 'admin',
      type: 'account',
      severity: 'medium',
      req,
    });

    res.json({ message: `User ${userId} deleted.` });
  } catch (err) {
    await logSecurityEvent({
      userId: adminId,
      action: 'admin_delete_user',
      details: `Error deleting user ${userId}: ${err.message}`,
      refId,
      category: 'admin',
      type: 'account',
      severity: 'high',
      req,
    });
    res.status(500).json({ error: `Failed to delete user (Ref: ${refId})` });
  }
};

export const getAllUsers = async (req, res) => {
  const traceId = `ADMIN-USERS-${Date.now()}`;
  try {
    const search = req.query.search?.toLowerCase() || '';
    const result = await db.query(
      `SELECT id, name, email, contact, address, member_type, user_role, account_status
       FROM users
       WHERE LOWER(name) LIKE $1 OR LOWER(email) LIKE $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [`%${search}%`]
    );
    res.json({ users: result.rows });
  } catch (err) {
    await logSecurityEvent({
      action: 'admin_get_users',
      status: 'fail',
      refId: traceId,
      message: `Failed to fetch users: ${err.message}`,
      category: 'admin',
      type: 'account',
      severity: 'high',
      req,
    });
    res.status(500).json({ error: `Failed to fetch users (Ref: ${traceId})` });
  }
};

export const getVerificationQueue = async (req, res) => {
  const refId = `VERIFYQ-${Date.now()}`;
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
    `);
    res.json(result.rows);
  } catch (err) {
    await logSecurityEvent({
      action: 'admin_get_verification_queue',
      status: 'fail',
      refId,
      message: `Failed to get verification queue: ${err.message}`,
      category: 'admin',
      type: 'submission',
      severity: 'medium',
      req,
    });
    res.status(500).json({ error: `Failed to fetch verification queue (Ref: ${refId})` });
  }
};

export const approveSubmission = async (req, res) => {
  const { submissionId, userId } = req.body;
  const reviewerId = req.user?.id;
  const refId = `APPROVE-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  if (!submissionId || !userId) {
    return res.status(400).json({ error: 'Missing submission or user ID' });
  }

  try {
    await db.query(
      `UPDATE users SET account_status = 'active' WHERE id = $1`,
      [userId]
    );

    await db.query(
      `UPDATE payment_submissions
       SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
       WHERE id = $2`,
      [reviewerId, submissionId]
    );

    await logSecurityEvent({
      traceId: refId,
      userId: reviewerId,
      userEmail: req.user.email,
      action: 'approve_user',
      message: `Approved user ID ${userId} via submission ${submissionId}`,
      status: 'success',
      category: 'admin',
      type: 'submission',
      severity: 'medium',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({ message: 'User approved.' });
  } catch (err) {
    await logSecurityEvent({
      traceId: refId,
      userId: reviewerId,
      action: 'approve_user',
      message: `Failed to approve user ${userId}: ${err.message}`,
      status: 'fail',
      category: 'admin',
      type: 'submission',
      severity: 'high',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(500).json({ error: `Failed to approve user (Ref: ${refId})` });
  }
};
