const db = require('../config/db')

// GET /api/businesses/public/:slug (no auth)
exports.getPublic = async (req, res) => {
  const { slug } = req.params
  try {
    const result = await db.query(
      `SELECT slug, name, description, phone, address, city,
              timezone, logo_url, cover_url, accent_color,
              welcome_message
       FROM businesses WHERE slug = $1 AND is_active = true`,
      [slug]
    )
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Negocio no encontrado' })
    }
    res.json({ business: result.rows[0] })
  } catch (err) {
    console.error('getPublic business error:', err)
    res.status(500).json({ error: 'Error al obtener negocio' })
  }
}

// GET /api/businesses/me (auth required)
exports.getMe = async (req, res) => {
  const { businessId } = req.user
  try {
    const result = await db.query(
      `SELECT id, slug, name, description, phone, whatsapp, email,
              address, city, state, timezone, logo_url, cover_url,
              accent_color, welcome_message, template_id,
              plan, plan_expires_at, settings
       FROM businesses WHERE id = $1`,
      [businessId]
    )
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Negocio no encontrado' })
    }
    res.json({ business: result.rows[0] })
  } catch (err) {
    console.error('getMe business error:', err)
    res.status(500).json({ error: 'Error al obtener datos del negocio' })
  }
}

// PUT /api/businesses/me (auth required, owner only)
exports.updateMe = async (req, res) => {
  const { businessId } = req.user
  const { name, description, phone, whatsapp, email, address,
          city, state, timezone, accentColor } = req.body
  try {
    const result = await db.query(
      `UPDATE businesses SET
         name = COALESCE($1, name),
         description = COALESCE($2, description),
         phone = COALESCE($3, phone),
         whatsapp = COALESCE($4, whatsapp),
         email = COALESCE($5, email),
         address = COALESCE($6, address),
         city = COALESCE($7, city),
         state = COALESCE($8, state),
         timezone = COALESCE($9, timezone),
         accent_color = COALESCE($10, accent_color),
         updated_at = NOW()
       WHERE id = $11 RETURNING *`,
      [name, description, phone, whatsapp, email, address,
       city, state, timezone, accentColor, businessId]
    )
    res.json({ business: result.rows[0] })
  } catch (err) {
    console.error('updateMe business error:', err)
    res.status(500).json({ error: 'Error al actualizar negocio' })
  }
}
