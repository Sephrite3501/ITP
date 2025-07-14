// server/routes/admin.js
import express from 'express'
import {
  lockUser,
  unlockUser,
  softDeleteUser,
  getAllUsers,
  getVerificationQueue,
  approveSubmission
} from '../controllers/adminController.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = express.Router()

// 🔐 All admin routes require authenticated admin
router.use(requireAuth, requireAdmin)

router.post('/lock-user', lockUser)
router.post('/unlock-user', unlockUser)
router.post('/delete-user', softDeleteUser)
router.get('/users', getAllUsers)
router.get('/verification-queue', getVerificationQueue)
router.post('/approve-user', approveSubmission)

export default router
