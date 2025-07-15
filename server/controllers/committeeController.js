import { validationResult } from 'express-validator'
import sanitizeHtml from 'sanitize-html'
import rateLimit from 'express-rate-limit'
import pool from '../db/index.js'
import { logSecurityEvent } from '../services/logService.js'

// a rate limiter just for snapshots
export const snapshotLimiter = rateLimit({
  windowMs: 60*1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
})

export const ALLOWED_ROLES = [
  'President',
  'Vice President',
  'Secretary',
  'Assistant Secretary',
  'Treasurer',
  'Assistant Treasurer',
  'Club Manager',
  'Committee Member'
]

function cleanImagePath(rawPath) {
  if (!rawPath) return null

  // Strip any HTML / tags
  const stripped = sanitizeHtml(rawPath, {
    allowedTags: [],
    allowedAttributes: {}
  })

  
  try {
    new URL(stripped, 'http://example.com')

    return stripped
  } catch {
 
    return null
  }
}

function sanitizeMember(member = {}) {
  return {
    id:   member.id,
    name: sanitizeHtml(member.name  || '', { allowedTags: [], allowedAttributes: {} }),
    role: sanitizeHtml(member.role  || '', { allowedTags: [], allowedAttributes: {} }),
    email: sanitizeHtml(member.email || '', { allowedTags: [], allowedAttributes: {} }),
    imagePath: cleanImagePath(member.profile_image_path)
  }
}

// GET /api/committees
export const getCommittees = async (req, res) => {
  const traceId = `COMMITTEES-${Math.random().toString(36).slice(2,7).toUpperCase()}`
  const ip      = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const ua      = req.headers['user-agent']

  try {
    const { rows } = await pool.query(
      `SELECT id, name, role, profile_image_path FROM users WHERE role IS NOT NULL`
    )

    const all = rows.map(u => ({
      id:   u.id,
      name: sanitizeHtml(u.name, { allowedTags: [], allowedAttributes: {} }),
      role: sanitizeHtml(u.role, { allowedTags: [], allowedAttributes: {} }),
      profile_image_path: cleanImagePath(u.profile_image_path)
    }))

    const leadershipOrder = ['President',
  'Vice President',
  'Secretary',
  'Assistant Secretary',
  'Treasurer',
  'Assistant Treasurer',
  'Club Manager'
  ]
    const leadership = all
      .filter(u => leadershipOrder.includes(u.role))
      .sort((a,b) => leadershipOrder.indexOf(a.role) - leadershipOrder.indexOf(b.role))
      .map(u => ({ role: u.role, member: { id: u.id, name: u.name, profile_image_path: u.profile_image_path } }))

    const member = all
      .filter(u => u.role === 'Committee Member')
      .map(u => ({ id: u.id, name: u.name, profile_image_path: u.profile_image_path }))

    res.json({ leadership, member })
    logSecurityEvent({ traceId, action:'get_committees', status:'success', ip, userAgent:ua, message:'Listed committees' })

  } catch (err) {
    logSecurityEvent({ traceId, action:'get_committees', status:'error', ip, userAgent:ua, message: err.message })
    console.error(`${traceId} committees error:`, err)
    res.status(500).json({ error:`Internal error (Ref: ${traceId})` })
  }
}

// GET /api/committees/snapshots
export const listSnapshots = async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, taken_at FROM committee_snapshots ORDER BY taken_at DESC`
    )
    const safe = rows.map(r => ({
      id:        r.id,
      taken_at:  new Date(r.taken_at).toISOString()
    }))
    res.json(safe)
  } catch (err) {
    console.error('snapshots list error:', err)
    res.sendStatus(500)
  }
}

// GET /api/committees/snapshots/:id
export const getSnapshotById = async (req, res) => {
  const traceId = `SNAPSHOT-${Math.random().toString(36).slice(2,7).toUpperCase()}`
  const ip      = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const ua      = req.headers['user-agent']

  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id < 1) {
    logSecurityEvent({ traceId, action:'get_snapshot', status:'failed', ip, userAgent:ua, message:'Invalid ID' })
    return res.status(400).json({ error:`Invalid snapshot ID (Ref: ${traceId})` })
  }

  try {
    const { rows } = await pool.query(
      `SELECT data FROM committee_snapshots WHERE id=$1`,
      [id]
    )
    if (!rows[0]) {
      logSecurityEvent({ traceId, action:'get_snapshot', status:'not_found', ip, userAgent:ua, message:`ID ${id} not found` })
      return res.sendStatus(404)
    }

    const { leadership = [], member = [] } = rows[0].data
    res.json({
      leadership: leadership.map(slot => ({
        role: slot.role,
        member: sanitizeMember({
          id: slot.member.id,
          name: slot.member.name,
          role: slot.member.role,
          email: slot.member.email,
          profile_image_path: cleanImagePath(slot.member.profile_image_path)
        })
      })),
      member: member.map(m =>
        sanitizeMember({
          id: m.id,
          name: m.name,
          role: m.role,
          email: m.email,
          profile_image_path: cleanImagePath(m.profile_image_path)
        })
      )
    })
    logSecurityEvent({ traceId, action:'get_snapshot', status:'success', ip, userAgent:ua, message:`Fetched snapshot ${id}` })

  } catch (err) {
    logSecurityEvent({ traceId, action:'get_snapshot', status:'error', ip, userAgent:ua, message: err.message })
    console.error(`${traceId} snapshot fetch error:`, err)
    res.status(500).json({ error:`Internal error (Ref: ${traceId})` })
  }
}

// POST /api/committees/snapshots (manual trigger)
export const createSnapshot = async (req, res) => {
  try {
    await snapshotCommittees()
    res.sendStatus(204)
  } catch (err) {
    console.error('manual snapshot error:', err)
    res.sendStatus(500)
  }
}

// internal helper; scheduled by cron in your main server file
export async function snapshotCommittees() {
  const { rows } = await pool.query(
    `SELECT id,name,role, profile_image_path FROM users WHERE role IS NOT NULL`
  )
  const all = rows.map(u => ({
    id:   u.id,
    name: sanitizeHtml(u.name  || '', { allowedTags: [], allowedAttributes: {} }),
    role: sanitizeHtml(u.role  || '', { allowedTags: [], allowedAttributes: {} }),
    email: sanitizeHtml(u.email || '', { allowedTags: [], allowedAttributes: {} }),
    profile_image_path: cleanImagePath(u.profile_image_path)
  }))
  const order = ['President',
  'Vice President',
  'Secretary',
  'Assistant Secretary',
  'Treasurer',
  'Assistant Treasurer',
  'Club Manager']

  const leadership = all
    .filter(u => order.includes(u.role))
    .sort((a,b) => order.indexOf(a.role) - order.indexOf(b.role))
    .map(u => ({
      role: u.role,
      member: {
        id:   u.id,
        name: u.name,
        email: u.email,
        profile_image_path: u.profile_image_path
      }
    }))

  const member = all
    .filter(u => u.role === 'Committee Member')
    .map(u => ({
      id:   u.id,
      name: u.name,
      email: u.email,
      profile_image_path: u.profile_image_path
    }))

  await pool.query(
    `INSERT INTO committee_snapshots (data) VALUES ($1)`,
    [{ leadership, member }]
  )
}

export const searchMembers = async (req, res) => {
  const traceId = `MEMBERS-${Math.random().toString(36).slice(2,7).toUpperCase()}`
  const ip      = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const ua      = req.headers['user-agent']

  // validationResult from express-validator
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    logSecurityEvent({
      traceId, action:'search_members', status:'failed',
      ip, userAgent:ua, message: errors.array()[0].msg
    })
    return res.status(400).json({ errors: errors.array() })
  }

  const term = `%${req.query.search.toLowerCase()}%`
  try {
    const { rows } = await pool.query(
      `SELECT id,name,email,role
         FROM users
        WHERE LOWER(name)  LIKE $1
           OR LOWER(email) LIKE $1
        ORDER BY name
        LIMIT 10`,
      [term]
    )

    // sanitize each field
    const safe = rows.map(u => sanitizeMember(u))
    res.json(safe)

    logSecurityEvent({
      traceId, action:'search_members', status:'success',
      ip, userAgent:ua, message:`q=${req.query.search}`
    })
  } catch (err) {
    console.error(`${traceId} members error:`, err)
    logSecurityEvent({
      traceId, action:'search_members', status:'error',
      ip, userAgent:ua, message: err.message
    })
    res.status(500).json({ error: `Internal error (Ref ${traceId})` })
  }
}

/** POST /api/committees/leadership */
export const updateLeadership = async (req, res) => {
  const traceId = `UPD-LEAD-${Math.random().toString(36).slice(2,7).toUpperCase()}`
  const ip      = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const ua      = req.headers['user-agent']

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    logSecurityEvent({
      traceId, action:'update_leadership', status:'failed',
      ip, userAgent:ua, message: errors.array()[0].msg
    })
    return res.status(400).json({ errors: errors.array() })
  }

  const { role, memberId } = req.body
  try {
    await pool.query(
      'UPDATE users SET role=$1 WHERE id=$2',
      [role, memberId]
    )
    res.sendStatus(204)

    logSecurityEvent({
      traceId, action:'update_leadership', status:'success',
      ip, userAgent:ua, message:`set ${memberId}→${role}`
    })
  } catch (err) {
    console.error(`${traceId} update error:`, err)
    logSecurityEvent({
      traceId, action:'update_leadership', status:'error',
      ip, userAgent:ua, message: err.message
    })
    res.status(500).json({ error: `Internal error (Ref ${traceId})` })
  }
}

/** DELETE /api/committees/leadership */
export const deleteLeadership = async (req, res) => {
  const traceId = `DEL-LEAD-${Math.random().toString(36).slice(2,7).toUpperCase()}`
  const ip      = req.headers['x-forwarded-for'] || req.socket.remoteAddress
  const ua      = req.headers['user-agent']

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    logSecurityEvent({
      traceId, action:'delete_leadership', status:'failed',
      ip, userAgent:ua, message: errors.array()[0].msg
    })
    return res.status(400).json({ errors: errors.array() })
  }

  const { memberId } = req.body
  try {
    await pool.query(
      'UPDATE users SET role=NULL WHERE id=$1',
      [memberId]
    )
    res.sendStatus(204)

    logSecurityEvent({
      traceId, action:'delete_leadership', status:'success',
      ip, userAgent:ua, message:`removed ${memberId}`
    })
  } catch (err) {
    console.error(`${traceId} delete error:`, err)
    logSecurityEvent({
      traceId, action:'delete_leadership', status:'error',
      ip, userAgent:ua, message: err.message
    })
    res.status(500).json({ error: `Internal error (Ref ${traceId})` })
  }
}

