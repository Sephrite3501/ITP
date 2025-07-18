import express from 'express'
import { query, body } from 'express-validator'

import {
  getCommittees,
  listSnapshots,
  getSnapshotById,
  snapshotLimiter,
  committeesLimiter,
} from '../controllers/committeeController.js'

const router = express.Router()

// Public read-only
router.get('/', committeesLimiter, getCommittees)

// Snapshot history
router.get('/snapshots', snapshotLimiter, listSnapshots)
router.get(
  '/snapshots/:id',
  snapshotLimiter,
  // validate :id
  query('id').isInt({ min: 1 }).withMessage('Snapshot ID must be a positive integer'),
  getSnapshotById
)



export default router
