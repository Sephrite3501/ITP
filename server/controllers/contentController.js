import pool from '../db/index.js'

// GET /api/content
export async function getContent(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM site_content ORDER BY id LIMIT 1'
    )
    if (!rows.length) {
      return res.status(404).json({ error: 'Content not found' })
    }
    const c = rows[0]
    res.json({
      carousel:  c.carousel,
      intro:     c.intro,
      vision:    c.vision,
      mission:   c.mission,
      community: c.community
    })
  } catch (err) {
    next(err)
  }
}

// PUT /api/content
export async function updateContent(req, res, next) {
  try {
    // load existing
    const { rows } = await pool.query(
      'SELECT * FROM site_content ORDER BY id LIMIT 1'
    )
    if (!rows.length) {
      return res.status(404).json({ error: 'Content not found' })
    }
    const old = rows[0]
    const inC = req.body

    // merge only non‐empty fields
    const merged = {
      carousel: Array.isArray(inC.carousel)
        ? old.carousel.map((u, i) => inC.carousel[i] ?? u)
        : old.carousel,

      intro: inC.intro
        ? {
            title: inC.intro.title || old.intro.title,
            body:  inC.intro.body  || old.intro.body
          }
        : old.intro,

      vision:  inC.vision  || old.vision,
      mission: inC.mission || old.mission,

      community: Array.isArray(inC.community)
        ? old.community.map((card, i) => ({
            title: inC.community[i]?.title || card.title,
            body:  inC.community[i]?.body  || card.body
          }))
        : old.community
    }

    // write back, casting JSONB explicitly
    await pool.query(
      `UPDATE site_content SET
         carousel   = $1::jsonb,
         intro      = $2::jsonb,
         vision     = $3,
         mission    = $4,
         community  = $5::jsonb,
         updated_at = NOW()
       WHERE id = $6`,
      [
        JSON.stringify(merged.carousel),
        JSON.stringify(merged.intro),
        merged.vision,
        merged.mission,
        JSON.stringify(merged.community),
        old.id
      ]
    )

    res.sendStatus(200)
  } catch (err) {
    next(err)
  }
}
