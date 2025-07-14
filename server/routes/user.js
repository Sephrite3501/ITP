// server/routes/user.js
import express from 'express'
import {
  getUserProfile,
  updateProfile,
  deleteAccount,
  submitVerificationDocs
} from '../controllers/userController.js'

import { upload } from '../utils/uploadMiddleware.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = express.Router()

// 🔐 All routes require authentication
router.use(requireAuth)

// 🧑 User endpoints
router.get('/user-profile', getUserProfile)
router.post('/update-profile', updateProfile)
router.post('/delete-account', deleteAccount)

// 🧾 Document submission (uploads)
router.post(
  '/upload-documents',
  upload.fields([
    { name: 'paymentProof', maxCount: 1 },
    { name: 'identityProof', maxCount: 1 }
  ]),
  submitVerificationDocs
)


export default router
