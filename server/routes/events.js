// routes/events.js
import express from 'express'
import { listEvents, getEventBySlug, registerForEventBySlug } from '../controllers/eventsController.js'

const router = express.Router()

// Public route to fetch all events
router.get('/', listEvents)
router.get('/:slug', getEventBySlug)
router.post('/:slug/register', registerForEventBySlug)

export default router