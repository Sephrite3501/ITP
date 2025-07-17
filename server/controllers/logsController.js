import pool from '../db/index.js'

export async function getLogs(req, res, next) {
  try {
    const { type } = req.params
    const { from, to } = req.query

    // whitelist allowed tables
    const tableMap = {
      admin:    'admin_logs',
      audit:    'audit_logs',
      auth:     'auth_logs',
      csrf:     'csrf_logs',
      error:    'error_logs',
      session:  'session_logs',
    }
    const table = tableMap[type]
    if (!table) return res.status(400).json({ error: 'Invalid log type' })

    let sql = `SELECT * FROM ${table}`
    const vals = []
    if (from) {
      vals.push(from)
      sql += ` WHERE created_at >= $${vals.length}`
    }
    if (to) {
      vals.push(to)
      sql += vals.length === 1
        ? ` WHERE created_at <= $${vals.length}`
        : ` AND   created_at <= $${vals.length}`
    }
    sql += ' ORDER BY created_at DESC LIMIT 1000'

    const { rows } = await pool.query(sql, vals)
    res.json(rows)
  } catch (err) {
    next(err)
  }
}
