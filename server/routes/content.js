import { Router } from 'express'
import { getContent, updateContent, validateAndSanitizeContent } from '../controllers/contentController.js'

const router = Router()

// GET  /api/content
router.get('/', getContent)

// PUT  /api/content
router.put('/', validateAndSanitizeContent, updateContent)

export default router
