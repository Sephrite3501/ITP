import { Router } from 'express'
import { getLogs } from '../controllers/logsController.js'

const router = Router()
router.get('/:type', getLogs)
export default router