import pool from '../db/index.js';
import { body, validationResult } from 'express-validator';
import sanitizeHtml from 'sanitize-html';

// 1) VALIDATION & SANITIZATION MIDDLEWARE
export const validateAndSanitizeContent = [
  // carousel: array of 1–10 valid URL strings
  body('carousel')
    .isArray({ min: 1, max: 4 })
    .withMessage('Carousel must be an array of 1–4 items.'),
  body('carousel.*')
    .isString()
    .matches(/^\/assets\/[A-Za-z0-9_\-/.]+\.(jpg|jpeg|png|gif)$/)
    .withMessage('Each carousel URL must point into /assets and end in jpg/jpeg/png/gif.'),

  // intro.title & intro.body
  body('intro.title')
    .isString().isLength({ min: 1, max: 100 })
    .withMessage('Intro title must be 1–100 characters.'),
  body('intro.body')
    .isString().isLength({ min: 1, max: 2000 })
    .withMessage('Intro body must be 1–2000 characters.'),

  // vision & mission
  body('vision')
    .isString().isLength({ min: 1, max: 255 })
    .withMessage('Vision must be 1–255 characters.'),
  body('mission')
    .isString().isLength({ min: 1, max: 255 })
    .withMessage('Mission must be 1–255 characters.'),

  // community: array of 1–10 cards
  body('community')
    .isArray({ min: 1, max: 10 })
    .withMessage('Community must be 1–10 cards.'),
  body('community.*.title')
    .isString().isLength({ min: 1, max: 100 })
    .withMessage('Card titles must be 1–100 characters.'),
  body('community.*.body')
    .isString().isLength({ min: 1, max: 500 })
    .withMessage('Card bodies must be 1–500 characters.'),

  // 2) check for validation errors & then sanitize
  (req, res, next) => {
    const errs = validationResult(req)
    if (!errs.isEmpty()) {
      return res.status(422).json({ errors: errs.array() })
    }

    // sanitize every textual field

    // titles, vision, mission: strip all HTML
    req.body.intro.title = sanitizeHtml(req.body.intro.title, {
      allowedTags: [],
      allowedAttributes: {}
    })
    req.body.vision = sanitizeHtml(req.body.vision, {
      allowedTags: [],
      allowedAttributes: {}
    })
    req.body.mission = sanitizeHtml(req.body.mission, {
      allowedTags: [],
      allowedAttributes: {}
    })

    // intro body: allow only a small subset of tags/attributes
    req.body.intro.body = sanitizeHtml(req.body.intro.body, {
      allowedTags: ['p','b','i','em','strong','ul','ol','li','a'],
      allowedAttributes: {
        a: ['href','target','rel']
      },
      // for safety, force all links to rel="noopener"
      transformTags: {
        'a': sanitizeHtml.simpleTransform('a', { rel: 'noopener', target: '_blank' })
      }
    })

    // community cards: sanitize title & body similarly
    req.body.community = req.body.community.map(card => ({
      title: sanitizeHtml(card.title, {
        allowedTags: [],
        allowedAttributes: {}
      }),
      body: sanitizeHtml(card.body, {
        allowedTags: ['p','b','i','em','strong','a'],
        allowedAttributes: { a: ['href','target','rel'] },
        transformTags: {
          'a': sanitizeHtml.simpleTransform('a', { rel: 'noopener', target: '_blank' })
        }
      })
    }))

    next()
  }
]

export async function updateContent(req, res, next) {
  try {
    // fetch existing
    const { rows } = await pool.query(
      'SELECT * FROM site_content ORDER BY id LIMIT 1'
    );
    if (!rows.length) return res.status(404).json({ error: 'Content not found' });
    const old = rows[0];

    const inC = req.body;
    const merged = {
      carousel: inC.carousel,
      intro: { title: inC.intro.title, body: inC.intro.body },
      vision: inC.vision,
      mission: inC.mission,
      community: inC.community
    };

    // write back via parametrized query (no SQL injection)
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
    );

    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
}



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