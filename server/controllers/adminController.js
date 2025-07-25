import db from '../db/index.js';
import { logSecurityEvent } from '../services/logService.js';
import { MAX_FILE_SIZE, ALLOWED_TYPES } from '../utils/uploadMiddleware.js';
import { fileTypeFromBuffer } from 'file-type';
import path from 'path';
import fs from 'fs/promises';

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
      u.profile_image_path,
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
}

export const listEventsWithCounts = async (_req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT 
        e.id,
        e.name,
        e.slug,
        e.location,
        e.poc,
        e.date,
        e.description,
        e.event_type,
        COUNT(r.id) AS registration_count
      FROM events e
      LEFT JOIN event_registrations r ON e.id = r.event_id
      GROUP BY e.id
      ORDER BY e.date DESC
    `)

    res.json(rows)
  } catch (err) {
    console.error("Error fetching event list with counts:", err)
    res.sendStatus(500)
  }
};

export const deleteEvent = async (req, res) => {
  const eventId = req.params.id;
  const adminId = req.user?.id; // Ensure this is available from your auth middleware
  const reqRef = req;
  const refId = `DELETE-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  try {
    // Step 1: Fetch image_paths
    const result = await db.query(
      'SELECT name, image_paths FROM events WHERE id = $1',
      [eventId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const { name, image_paths: imagePaths } = result.rows[0];

    // Step 2: Delete images
    if (imagePaths?.banner) {
      const bannerPath = path.resolve('uploads', path.basename(imagePaths.banner));
      try {
        await fs.unlink(bannerPath);
        console.log('Deleted banner:', bannerPath);
      } catch {
        console.warn('Banner not found or failed to delete:', bannerPath);
      }
    }

    if (Array.isArray(imagePaths?.guests)) {
      for (const guestImg of imagePaths.guests) {
        const guestPath = path.resolve('uploads', path.basename(guestImg));
        try {
          await fs.unlink(guestPath);
          console.log('Deleted guest image:', guestPath);
        } catch {
          console.warn('Guest image not found or failed to delete:', guestPath);
        }
      }
    }

    // Step 3: Delete the event from DB
    await db.query('DELETE FROM events WHERE id = $1', [eventId]);

    await logSecurityEvent({
      category: 'admin',
      userId: adminId,
      action: 'delete_event',
      refId: refId,
      details: `Deleted event '${name}' (ID: ${eventId})`,
      severity: 'high',
      req: reqRef
    });

    res.json({ message: 'Event and associated images deleted' });

  } catch (err) {
    console.error('Failed to delete event:', err);

    await logSecurityEvent({
      category: 'error',
      userId: adminId,
      action: 'delete_event',
      errorType: 'EventDeleteError',
      message: `Failed to delete event ID: ${eventId}`,
      stack: err.stack,
      severity: 'critical',
      refId: refId,
      req: reqRef
    });

    res.status(500).json({ error: 'Internal server error' });
  }
};


export const getRegisteredUsers = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await db.query(
      `
      SELECT 
        u.id,
        u.name,
        u.email,
        er.details,         
        er.registered_at
      FROM event_registrations er
      JOIN users u ON er.user_id = u.id
      WHERE er.event_id = $1
      ORDER BY er.registered_at DESC
      `,
      [id]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching registered users:', err);
    res.sendStatus(500);
  }
};

export const createEvent = async (req, res) => {
  const { name, date, time, location, description, event_type } = req.body;
  const files = req.files;
  const imagePaths = { banner: '', guests: [] };
  const adminId = req.user?.id;
  const reqRef = req;
  const refId = `CREATE-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  // 🛡️ Input validation
  if (!name?.trim() || !date?.trim() || !time?.trim() || !location?.trim() || !event_type?.trim() || !description?.trim()) {
    return res.status(400).json({ error: 'All fields (name, date, time, location, event_type, description) are required.' });
  }

  if (typeof name !== 'string' || name.length > 100) {
    return res.status(400).json({ error: 'Event name must be a string with max 100 characters.' });
  }

  if (isNaN(Date.parse(`${date}T${time}`))) {
    return res.status(400).json({ error: 'Invalid date or time format.' });
  }

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');

  const combinedDateTime = new Date(`${date}T${time}`);
  const safeName = slug.slice(0, 30);

  const saveImage = async (file, prefix) => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Image exceeds 5MB size limit');
    }

    const type = await fileTypeFromBuffer(file.buffer);
    if (!type || !ALLOWED_TYPES.has(type.mime)) {
      throw new Error('Image must be JPG or PNG');
    }

    const ext = ALLOWED_TYPES.get(type.mime);
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const absPath = path.resolve('uploads', filename);
    await fs.writeFile(absPath, file.buffer);
    return `/uploads/${filename}`;
  };

  try {
    // Save banner image
    if (files?.bannerImage?.[0]) {
      imagePaths.banner = await saveImage(files.bannerImage[0], safeName);
    }

    // Save guest images (up to 2 max)
    if (files?.guestImages?.length) {
      for (const file of files.guestImages.slice(0, 2)) {
        const imgPath = await saveImage(file, safeName);
        imagePaths.guests.push(imgPath);
      }
    }

    await db.query(
      `INSERT INTO events (name, slug, date, location, description, event_type, poc, image_paths)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7)`,
      [name, slug, combinedDateTime, location, description, event_type, JSON.stringify(imagePaths)]
    );

    await logSecurityEvent({
      category: 'admin',
      userId: adminId,
      action: 'create_event',
      details: `Admin (${adminId}) created event '${name}'`,
      refId: refId,
      severity: 'medium',
      req: reqRef
    });

    res.status(201).json({ message: 'Event created', slug });

  } catch (err) {
    console.error('Failed to create event:', err);

    await logSecurityEvent({
      category: 'error',
      userId: adminId,
      action: 'create_event',
      errorType: 'EventCreationError',
      message: `Failed to create event '${name}'`,
      stack: err.stack,
      severity: 'high',
      req: reqRef
    });

    res.status(500).json({ error: 'Internal server error' });
  }
};


export const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { name, date, location, event_type, description, poc } = req.body;
  const files = req.files;
  const adminId = req.user?.id; // assuming you have auth middleware
  const reqRef = req;
  const refId = `UPDATE-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

  // 🛡️ Input validation
  if (!name?.trim() || !date?.trim() || !location?.trim() || !event_type?.trim() || !description?.trim()) {
    return res.status(400).json({ error: 'All required fields (name, date, location, event_type, description) must be provided.' });
  }

  if (typeof name !== 'string' || name.length > 100) {
    return res.status(400).json({ error: 'Event name must be a string and less than 100 characters.' });
  }

  if (isNaN(Date.parse(date))) {
    return res.status(400).json({ error: 'Invalid date format.' });
  }

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');

  const safeName = slug.slice(0, 30);
  const combinedDateTime = new Date(date);
  const imagePaths = { banner: '', guests: [] };

  const saveImage = async (file, prefix) => {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Image exceeds 5MB size limit');
    }

    const type = await fileTypeFromBuffer(file.buffer);
    if (!type || !ALLOWED_TYPES.has(type.mime)) {
      throw new Error('Image must be JPG or PNG');
    }

    const ext = ALLOWED_TYPES.get(type.mime);
    const filename = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const absPath = path.resolve('uploads', filename);
    await fs.writeFile(absPath, file.buffer);
    return `/uploads/${filename}`;
  };

  try {
    const existing = await db.query('SELECT image_paths FROM events WHERE id = $1', [id]);
    if (!existing.rows.length) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const oldImagePaths = existing.rows[0].image_paths || { banner: '', guests: [] };

    // Handle new banner upload
    if (files?.bannerImage?.[0]) {
      const newBanner = await saveImage(files.bannerImage[0], safeName);
      const oldBannerPath = path.resolve('uploads', path.basename(oldImagePaths.banner));
      if (oldImagePaths.banner) {
        try { await fs.unlink(oldBannerPath); } catch {}
      }
      imagePaths.banner = newBanner;
    } else {
      imagePaths.banner = oldImagePaths.banner;
    }

    // Handle guest image uploads
    if (files?.guestImages?.length) {
      for (const oldGuest of oldImagePaths.guests || []) {
        try { await fs.unlink(path.resolve('uploads', path.basename(oldGuest))); } catch {}
      }

      for (const file of files.guestImages.slice(0, 2)) {
        const imgPath = await saveImage(file, safeName);
        imagePaths.guests.push(imgPath);
      }
    } else {
      imagePaths.guests = oldImagePaths.guests;
    }

    const result = await db.query(
      `UPDATE events
       SET name = $1,
           date = $2,
           location = $3,
           event_type = $4,
           description = $5,
           poc = $6,
           slug = $7,
           image_paths = $8,
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [name, combinedDateTime, location, event_type, description, poc, slug, JSON.stringify(imagePaths), id]
    );

    await logSecurityEvent({
      category: 'admin',
      userId: adminId,
      action: 'update_event',
      refId: refId,
      details: `Admin (${adminId}) updated event '${name}' (ID: ${id})`,
      severity: 'medium',
      req: reqRef
    });

    res.json({ message: "Event updated", event: result.rows[0] });

  } catch (err) {
    console.error("Failed to update event:", err);

    await logSecurityEvent({
      category: 'error',
      userId: adminId,
      action: 'update_event',
      errorType: 'EventUpdateError',
      message: `Failed to update event ID: ${id}`,
      stack: err.stack,
      refId: refId,
      severity: 'high',
      req: reqRef
    });

    res.status(500).json({ message: "Internal server error" });
  }
};






