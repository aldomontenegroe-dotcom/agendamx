const db = require('../config/db')

const PLAN_LIMITS = {
  free: 10,
  starter: 100,
  pro: null,
  business: null,
}

async function planLimit(req, res, next) {
  try {
    // For public booking routes, get businessId from slug
    let businessId
    if (req.params.slug) {
      const biz = await db.query('SELECT id FROM businesses WHERE slug = $1', [req.params.slug])
      if (!biz.rows.length) return res.status(404).json({ error: 'Negocio no encontrado' })
      businessId = biz.rows[0].id
    } else if (req.user) {
      businessId = req.user.businessId
    } else {
      return next()
    }

    const biz = await db.query('SELECT plan FROM businesses WHERE id = $1', [businessId])
    const plan = biz.rows[0]?.plan || 'free'
    const limit = PLAN_LIMITS[plan]

    if (limit === null) return next() // unlimited

    // Count this month's appointments
    const count = await db.query(
      `SELECT COUNT(*)::int as total FROM appointments
       WHERE business_id = $1
         AND created_at >= date_trunc('month', NOW())
         AND status != 'cancelled'`,
      [businessId]
    )

    if (count.rows[0].total >= limit) {
      return res.status(403).json({
        error: `Has alcanzado el límite de ${limit} citas de tu plan ${plan}. Mejora tu plan para continuar.`,
        code: 'PLAN_LIMIT_REACHED',
      })
    }

    next()
  } catch (err) {
    console.error('planLimit error:', err)
    next() // Don't block on errors
  }
}

module.exports = { planLimit, PLAN_LIMITS }
