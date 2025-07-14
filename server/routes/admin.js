import express from 'express';
import { lockUser, unlockUser, softDeleteUser, getAllUsers, getVerificationQueue, approveSubmission, listEventsWithCounts, deleteEvent, getRegisteredUsers, createEvent, updateEvent } from '../controllers/adminController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router()

// 🔐 All admin routes require authenticated admin
router.use(requireAuth, requireAdmin)

router.post('/lock-user', lockUser)
router.post('/unlock-user', unlockUser)
router.post('/delete-user', softDeleteUser)
router.get('/users', getAllUsers)
router.get('/verification-queue', getVerificationQueue)
router.post('/approve-user', approveSubmission)
router.get('/with-registration-count', listEventsWithCounts);
router.delete('/:id', deleteEvent);
router.get('/:id/registrations', getRegisteredUsers);
router.post('/create-event', createEvent);
router.put('/edit-event/:id', updateEvent);

export default router
