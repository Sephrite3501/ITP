// server/routes/user.js
import express from 'express'
import { getUserProfile, updateProfile, deleteAccount, submitVerificationDocs, getAllUsers,  getVerificationQueue, approveSubmission, getUserRegisteredEvents, unregisterUserFromEvent } from '../controllers/userController.js'
import { upload, validateAndSaveFiles } from '../utils/uploadMiddleware.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router()

router.use(requireAuth);

router.get('/user-profile', getUserProfile)
router.post('/update-profile', updateProfile)
router.post('/delete-account', deleteAccount)
router.get('/registered-events', getUserRegisteredEvents)
router.delete('/unregister/:eventId', unregisterUserFromEvent)

router.post(
  '/upload-documents',
  requireAuth,
  upload.fields([
    { name: 'paymentProof', maxCount: 1 },
    { name: 'identityProof', maxCount: 1 }
  ]),
  submitVerificationDocs
);

router.get('/admin-only', requireAuth, requireAdmin, (req, res) => {
  res.json({ message: `Hello Admin ${req.user.email}` });
});


router.get('/admin/users', requireAdmin, getAllUsers)
router.get('/admin/verification-queue', requireAdmin, getVerificationQueue)
router.post('/admin/approve-user', requireAdmin, approveSubmission)


export default router
