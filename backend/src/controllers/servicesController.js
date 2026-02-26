const db = require('../config/db')

exports.list = async (req, res) => {
  const { businessId } = req.user
  try {
    const result = await db.query(
      'SELECT * FROM services WHERE business_id = $1 ORDER BY sort_order, name',
      [businessId]
    )
    res.json({ services: result.rows })
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener servicios' })
  }
}

exports.listPublic = async (req, res) => {
  const { slug } = req.params
  try {
    const biz = await db.query('SELECT id FROM businesses WHERE slug = $1', [slug])
    if (!biz.rows.length) return res.status(404).json({ error: 'Negocio no encontrado' })
    const result = await db.query(
      'SELECT id, name, description, duration_min, price, color, icon, is_popular FROM services WHERE business_id = $1 AND is_active = true ORDER BY sort_order, name',
      [biz.rows[0].id]
    )
    res.json({ services: result.rows })
  } catch (err) {
    res.status(500).json({ error: 'Error' })
  }
}

exports.create = async (req, res) => {
  const { businessId } = req.user
  const { name, description, durationMin, price, color } = req.body
  if (!name || !durationMin) return res.status(400).json({ error: 'Nombre y duración requeridos' })
  try {
    const result = await db.query(
      `INSERT INTO services (business_id, name, description, duration_min, price, color)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [businessId, name, description || null, durationMin, price || null, color || '#3B82F6']
    )
    res.status(201).json({ service: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: 'Error al crear servicio' })
  }
}

exports.update = async (req, res) => {
  const { id } = req.params
  const { businessId } = req.user
  const { name, description, durationMin, price, color, isActive } = req.body
  try {
    const result = await db.query(
      `UPDATE services SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         duration_min = COALESCE($3, duration_min),
         price = COALESCE($4, price),
         color = COALESCE($5, color),
         is_active = COALESCE($6, is_active)
       WHERE id = $7 AND business_id = $8 RETURNING *`,
      [name, description, durationMin, price, color, isActive, id, businessId]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Servicio no encontrado' })
    res.json({ service: result.rows[0] })
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar servicio' })
  }
}

exports.remove = async (req, res) => {
  const { id } = req.params
  const { businessId } = req.user
  try {
    await db.query('UPDATE services SET is_active = false WHERE id = $1 AND business_id = $2', [id, businessId])
    res.json({ message: 'Servicio desactivado' })
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar servicio' })
  }
}
