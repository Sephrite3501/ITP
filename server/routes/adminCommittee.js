// server/routes/adminCommittee.js
import express from 'express'
import { query, body } from 'express-validator'

import {
  searchMembers,
  updateLeadership,
  deleteLeadership,
  ALLOWED_ROLES
} from '../controllers/committeeController.js'

import { requireAuth }  from '../middleware/requireAuth.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = express.Router()

router.use(requireAuth, requireAdmin)


// Member search for “add to role” UI
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
