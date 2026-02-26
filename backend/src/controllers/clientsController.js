const db = require('../config/db')

// GET /api/clients (auth required)
exports.list = async (req, res) => {
  const { businessId } = req.user
  const { search } = req.query
  let query = 'SELECT * FROM clients WHERE business_id = $1'
  const params = [businessId]
  if (search) {
    query += ` AND (name ILIKE $2 OR phone ILIKE $2 OR email ILIKE $2)`
    params.push(`%${search}%`)
  }
  query += ' ORDER BY created_at DESC'
  try {
    const result = await db.query(query, params)
    res.json({ clients: result.rows })
  } catch (err) {
    console.error('list clients error:', err)
    res.status(500).json({ error: 'Error al obtener clientes' })
  }
}

// GET /api/clients/:id (auth required)
exports.getOne = async (req, res) => {
  const { businessId } = req.user
  const { id } = req.params
  try {
    const client = await db.query(
      'SELECT * FROM clients WHERE id = $1 AND business_id = $2',
      [id, businessId]
    )
    if (!client.rows.length) return res.status(404).json({ error: 'Cliente no encontrado' })
    const appointments = await db.query(
      `SELECT a.id, a.starts_at, a.ends_at, a.status, a.price,
              a.client_name, s.name as service_name
       FROM appointments a
       LEFT JOIN services s ON s.id = a.service_id
       WHERE a.client_id = $1 AND a.business_id = $2
       ORDER BY a.starts_at DESC`,
      [id, businessId]
    )
    res.json({ client: client.rows[0], appointments: appointments.rows })
  } catch (err) {
    console.error('getOne client error:', err)
    res.status(500).json({ error: 'Error al obtener cliente' })
  }
}

// PUT /api/clients/:id (auth required)
exports.update = async (req, res) => {
  const { businessId } = req.user
  const { id } = req.params
  const { name, phone, email, notes } = req.body
  try {
    const result = await db.query(
      `UPDATE clients SET
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         email = COALESCE($3, email),
         notes = COALESCE($4, notes)
       WHERE id = $5 AND business_id = $6 RETURNING *`,
      [name, phone, email, notes, id, businessId]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Cliente no encontrado' })
    res.json({ client: result.rows[0] })
  } catch (err) {
    console.error('update client error:', err)
    res.status(500).json({ error: 'Error al actualizar cliente' })
  }
}
