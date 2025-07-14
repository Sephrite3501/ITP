import pool from '../db/index.js'
import { logSecurityEvent } from '../services/logService.js'
import { getUserFromToken } from './userController.js'

// GET /api/events
export const listEvents = async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, name, slug, date, location, description, event_type, poc 
      FROM events
      ORDER BY date DESC
    `)

    const safe = rows.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,  // ✅ Make sure this is included
      date: new Date(r.date).toISOString(),
      location: r.location,
      description: r.description,
      event_type: r.event_type,
      poc: r.poc
    }))

    res.json(safe)
  } catch (err) {
    console.error('events list error:', err)
    res.sendStatus(500)
  }
}

export const getEventBySlug = async (req, res) => {
  const slug = req.params.slug
  console.log("Backend received slug:", slug) // <== add this for debug

  try {
    const { rows } = await pool.query(
      `SELECT * FROM events WHERE slug = $1 LIMIT 1`,
      [slug]
    )

    if (rows.length === 0) {
      console.log("No event found with slug:", slug)
      return res.status(404).json({ error: 'Event not found' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error("Error in getEventBySlug:", err)
    res.sendStatus(500)
  }
}

export const registerForEventBySlug = async (req, res) => {
  const { slug } = req.params;
  const token = req.cookies?.auth_token;

  const user = await getUserFromToken(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { rows } = await pool.query(
      `SELECT id FROM events WHERE slug = $1`,
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventId = rows[0].id;

    const result = await pool.query(
      `INSERT INTO event_registrations (event_id, user_id, registered_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (event_id, user_id) DO NOTHING
       RETURNING id`,
      [eventId, user.id]
    );

    if (result.rowCount === 0) {
      return res.status(200).json({ message: 'User already registered' });
    }

    res.status(201).json({ message: 'Registered successfully' });

  } catch (err) {
    console.error('Register error:', err);
    res.sendStatus(500);
  }
};


