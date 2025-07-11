import express from 'express'
import { query, body } from 'express-validator'

import {
  getCommittees,
  listSnapshots,
  getSnapshotById,
  createSnapshot,
  snapshotLimiter,
  searchMembers,
  updateLeadership,
  deleteLeadership,
  ALLOWED_ROLES
} from '../controllers/committeeController.js'

const router = express.Router()

// Public read-only
router.get('/', getCommittees)

// Snapshot history
router.get('/snapshots', snapshotLimiter, listSnapshots)
router.get(
  '/snapshots/:id',
  snapshotLimiter,
  // validate :id
  query('id').isInt({ min: 1 }).withMessage('Snapshot ID must be a positive integer'),
  getSnapshotById
)

// Manual snapshot trigger
router.post('/snapshots', createSnapshot)

// Member search (for your “Add to role” UI)
router.get(
  '/members',
  query('search')
    .isString().withMessage('search must be text')
    .trim().escape(),
  searchMembers
)

// Assign a role
router.post(
  '/leadership',
  body('role')
    .isString().withMessage('role must be text')
    .isIn(ALLOWED_ROLES).withMessage('invalid role'),
  body('memberId')
    .isInt({ min:1 }).withMessage('memberId must be positive integer'),
  updateLeadership
)

// Remove a role
router.delete(
  '/leadership',
  body('memberId')
    .isInt({ min:1 }).withMessage('memberId must be positive integer'),
  deleteLeadership
)

export default router
