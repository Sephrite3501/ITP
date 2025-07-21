// server/controllers/logsController.js
import { query, validationResult } from 'express-validator'
import pool from '../db/index.js'

// 1) Validation middleware
export const validateLogs = [
  query('from')
    .optional()
    .isISO8601().withMessage('`from` must be a valid ISO8601 date'),
  query('to')
    .optional()
    .isISO8601().withMessage('`to` must be a valid ISO8601 date'),
  query('search')
    .optional()
    .isString().trim().isLength({ max: 200 })
    .withMessage('`search` must be a string up to 200 characters'),
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() })
    }
    next()
  }
]

// 2) Handler
export async function getLogs(req, res, next) {
  try {
    const { type } = req.params
    const { from, to, search = '' } = req.query

    // 3) Whitelist tables
    const tableMap = {
      admin:   'admin_logs',
      audit:   'audit_logs',
      auth:    'auth_logs',
      csrf:    'csrf_logs',
      error:   'error_logs',
      session: 'session_logs',
    }
    const table = tableMap[type]
    if (!table) {
      return res.status(400).json({ error: 'Invalid log type' })
    }

    // 4) Build parameterized SQL
    let sql    = `SELECT * FROM ${table} WHERE TRUE`
    const vals = []

    if (from) {
      vals.push(from)
      sql += ` AND created_at >= $${vals.length}`
    }
    if (to) {
      // make `to` exclusive: logs before end of that day
      vals.push(new Date(to).toISOString())
      sql += ` AND created_at < $${vals.length}`
    }
    if (search) {
      vals.push(search)
      sql += ` AND (
        action   ILIKE '%' || $${vals.length} || '%' OR
        details  ILIKE '%' || $${vals.length} || '%'
      )`
    }

    sql += ' ORDER BY created_at DESC LIMIT 1000'

    // 5) Execute
    const { rows } = await pool.query(sql, vals)
    res.json(rows)

  } catch (err) {
    next(err)
  }
}
