import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

// Protected file access (admin-only)
router.get('/download/:filename', requireAuth, requireAdmin, async (req, res) => {
  const filename = req.params.filename;

  // Prevent path traversal
  if (!/^[a-z0-9_\-.]+$/i.test(filename)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const filePath = path.resolve('uploads', filename); // adjust if needed

  try {
    await fs.access(filePath); // Check if file exists
    res.sendFile(filePath);
  } catch (err) {
    console.error('File access error:', err);
    res.status(404).json({ error: 'File not found or access denied.' });
  }
});

export default router;
