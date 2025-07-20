import pool from '../db/index.js'
import { logSecurityEvent } from '../services/logService.js'
import { getUserFromToken } from './userController.js'
import { sendEventRegistrationEmail } from '../services/emailService.js';


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
      slug: r.slug, 
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
  const { name, email, phone, pax } = req.body;

  const user = await getUserFromToken(token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // Check all fields exist
  if (!name || !email || !phone || !pax) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  // Validate phone format (SG format, 8 digits starting with 6/8/9, optional +65)
  const phoneRegex = /^(?:\+65)?[689]\d{7}$/;
  if (!phoneRegex.test(phone)) {
    return res.status(400).json({ error: 'Invalid Singapore phone number.' });
  }

  // Validate pax is a positive integer
  const paxInt = parseInt(pax, 10);
  if (isNaN(paxInt) || paxInt < 1) {
    return res.status(400).json({ error: 'Pax must be a positive number.' });
  }

  const details = `Name: ${name}, Email: ${email}, Phone: ${phone}, Pax: ${paxInt}`;

  try {
    // Fetch event data
    const { rows } = await pool.query(
      `SELECT id, name, date, location, event_type FROM events WHERE slug = $1`,
      [slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = rows[0];
    const eventId = event.id;

    // Insert into registrations
    const result = await pool.query(
      `INSERT INTO event_registrations (
        event_id, user_id, registered_at, details
      )
      VALUES ($1, $2, NOW(), $3)
      ON CONFLICT (event_id, user_id) DO NOTHING
      RETURNING id`,
      [eventId, user.id, details]
    );

    if (result.rowCount === 0) {
      return res.status(200).json({ message: 'User already registered' });
    }

    // Send confirmation email
    const eventDate = new Date(event.date);

    await sendEventRegistrationEmail(user.email, name, {
      name: event.name,
      date: eventDate.toLocaleDateString('en-SG', {
        dateStyle: 'medium'
      }),
      time: eventDate.toLocaleTimeString('en-SG', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      location: event.location,
      type: event.event_type,
      pax: paxInt
    });

    res.status(201).json({ message: 'Registered successfully' });

  } catch (err) {
    console.error('Register error:', err);
    res.sendStatus(500);
  }
};



