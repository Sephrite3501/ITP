import express from 'express'
import { logSecurityEvent } from '../services/logService.js'

const router = express.Router()

router.post('/client', async (req, res) => {
  const { category, action, details, severity } = req.body
  const reqUser = req.user || null

  if (!category || !action || !details) {
    return res.status(400).json({ error: 'Missing required log fields' })
  }

  try {
    await logSecurityEvent({
      category,
      action,
      details,
      severity: severity || 'info',
      userId: reqUser?.id || null,
      req
    })
    res.status(204).end()
  } catch (err) {
    console.error('[CLIENT LOGGING] Failed:', err)
    res.status(500).json({ error: 'Log failed' })
  }
})

export default router
