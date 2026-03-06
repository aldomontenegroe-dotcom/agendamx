const db = require('../config/db')

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [bizCount, apptCount, planBreakdown] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS total FROM businesses'),
      db.query('SELECT COUNT(*)::int AS total FROM appointments'),
      db.query(`
        SELECT plan, COUNT(*)::int AS count
        FROM businesses
        GROUP BY plan
        ORDER BY count DESC
      `),
    ])
    res.json({
      totalBusinesses: bizCount.rows[0].total,
      totalAppointments: apptCount.rows[0].total,
      planBreakdown: planBreakdown.rows,
    })
  } catch (err) {
    console.error('superAdmin getStats error:', err)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
}

// GET /api/admin/businesses
exports.listBusinesses = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        b.id, b.name, b.slug, b.plan, b.plan_expires_at,
        b.is_active, b.created_at, b.phone, b.email, b.city,
        (SELECT COUNT(*)::int FROM appointments a WHERE a.business_id = b.id) AS total_appointments,
        (SELECT COUNT(*)::int FROM clients c WHERE c.business_id = b.id) AS total_clients,
        (SELECT name FROM users u WHERE u.business_id = b.id AND u.role = 'owner' LIMIT 1) AS owner_name
      FROM businesses b
      ORDER BY b.created_at DESC
    `)
    res.json({ businesses: rows })
  } catch (err) {
    console.error('superAdmin listBusinesses error:', err)
    res.status(500).json({ error: 'Error al listar negocios' })
  }
}

// PATCH /api/admin/businesses/:id/plan
exports.updateBusinessPlan = async (req, res) => {
  const { id } = req.params
  const { plan, plan_expires_at } = req.body

  const validPlans = ['free', 'starter', 'pro', 'business']
  if (!validPlans.includes(plan)) {
    return res.status(400).json({ error: 'Plan inválido' })
  }

  try {
    const { rows } = await db.query(
      `UPDATE businesses
       SET plan = $1, plan_expires_at = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, plan, plan_expires_at`,
      [plan, plan_expires_at || null, id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Negocio no encontrado' })
    res.json({ business: rows[0] })
  } catch (err) {
    console.error('superAdmin updatePlan error:', err)
    res.status(500).json({ error: 'Error al actualizar plan' })
  }
}

// PATCH /api/admin/businesses/:id/active
exports.toggleBusinessActive = async (req, res) => {
  const { id } = req.params
  const { is_active } = req.body

  try {
    const { rows } = await db.query(
      `UPDATE businesses SET is_active = $1, updated_at = NOW() WHERE id = $2
       RETURNING id, name, is_active`,
      [is_active, id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Negocio no encontrado' })
    res.json({ business: rows[0] })
  } catch (err) {
    console.error('superAdmin toggleActive error:', err)
    res.status(500).json({ error: 'Error al cambiar estado' })
  }
}
