import express from 'express'
import mime from 'mime-types'
import path from 'path'
import fs from 'fs/promises'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = express.Router()

router.get('/download/:filename', requireAuth, requireAdmin, async (req, res) => {
  const filename = req.params.filename

  // 🛡️ Prevent path traversal
  if (!/^[a-zA-Z0-9_\-.]+$/.test(filename)) {
    return res.status(400).json({ error: 'Invalid filename' })
  }

  const filePath = path.resolve('uploads', filename)
  try {
    await fs.access(filePath)

    // Detect file type
    const ext = path.extname(filename).toLowerCase()
    const mimeType = mime.lookup(ext) || 'application/octet-stream'

    // Set Content-Disposition
    if (['.jpg', '.jpeg', '.png', '.pdf'].includes(ext)) {
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`)
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    }
    res.setHeader('Content-Type', mimeType)
    res.setHeader('X-Content-Type-Options', 'nosniff')

    res.sendFile(filePath)
  } catch (err) {
    console.error('[File Download] Error:', err)
    res.status(404).json({ error: 'File not found or access denied.' })
  }
})

export default router
