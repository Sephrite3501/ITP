import { Router } from 'express'
import { validateLogs, getLogs } from '../controllers/logsController.js'

const router = Router()
router.get('/:type', validateLogs, getLogs)
export default router