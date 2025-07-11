import { Router } from 'express'
import { getContent, updateContent } from '../controllers/contentController.js'

const router = Router()

// GET  /api/content
router.get('/', getContent)

// PUT  /api/content
router.put('/', updateContent)

export default router
