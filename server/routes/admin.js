import express from 'express';
import { lockUser, unlockUser, softDeleteUser, getAllUsers, getVerificationQueue, approveSubmission, listEventsWithCounts, deleteEvent, getRegisteredUsers, createEvent, updateEvent } from '../controllers/adminController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.post('/lock-user', requireAdmin, lockUser);
router.post('/unlock-user', requireAdmin, unlockUser);
router.post('/delete-user', requireAdmin, softDeleteUser);
router.get('/users', requireAdmin, getAllUsers);
router.get('/verification-queue', requireAdmin, getVerificationQueue);
router.post('/approve-user', requireAdmin, approveSubmission);
router.get('/with-registration-count', requireAdmin, listEventsWithCounts);
router.delete('/:id', requireAdmin, deleteEvent);
router.get('/:id/registrations', requireAdmin, getRegisteredUsers);
router.post('/create-event', requireAdmin, createEvent);
router.put('/edit-event/:id', requireAdmin, updateEvent);

export default router;
