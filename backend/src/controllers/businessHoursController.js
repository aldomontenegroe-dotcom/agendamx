const db = require('../config/db')

// GET /api/business-hours (auth required)
exports.list = async (req, res) => {
  const { businessId } = req.user
  try {
    const result = await db.query(
      'SELECT id, day_of_week, opens_at, closes_at, is_open FROM business_hours WHERE business_id = $1 ORDER BY day_of_week',
      [businessId]
    )
    res.json({ hours: result.rows })
  } catch (err) {
    console.error('list business hours error:', err)
    res.status(500).json({ error: 'Error al obtener horarios' })
  }
}

// PUT /api/business-hours (auth required, owner only)
exports.update = async (req, res) => {
  const { businessId } = req.user
  const { hours } = req.body
  if (!Array.isArray(hours) || hours.length !== 7) {
    return res.status(400).json({ error: 'Se requieren exactamente 7 días' })
  }
  const client = await db.pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM business_hours WHERE business_id = $1', [businessId])
    for (const h of hours) {
      await client.query(
        `INSERT INTO business_hours (business_id, day_of_week, opens_at, closes_at, is_open)
         VALUES ($1, $2, $3, $4, $5)`,
        [businessId, h.dayOfWeek, h.opensAt || null, h.closesAt || null, h.isOpen]
      )
    }
    await client.query('COMMIT')
    const result = await db.query(
      'SELECT id, day_of_week, opens_at, closes_at, is_open FROM business_hours WHERE business_id = $1 ORDER BY day_of_week',
      [businessId]
    )
    res.json({ hours: result.rows })
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('update business hours error:', err)
    res.status(500).json({ error: 'Error al actualizar horarios' })
  } finally {
    client.release()
  }
}
