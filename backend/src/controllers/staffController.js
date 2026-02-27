const db = require('../config/db')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

// ─── Listar staff del negocio (auth) ────────────────────────────
exports.list = async (req, res) => {
  const { businessId } = req.user
  try {
    const result = await db.query(
      `SELECT id, name, email, phone, role, avatar_url, is_active, created_at
       FROM users WHERE business_id = $1 AND is_active = true
       ORDER BY role DESC, name ASC`,
      [businessId]
    )
    res.json({ staff: result.rows })
  } catch (err) {
    console.error('list staff error:', err)
    res.status(500).json({ error: 'Error al obtener equipo' })
  }
}

// ─── Staff público por slug (sin auth) ──────────────────────────
exports.listPublic = async (req, res) => {
  const { slug } = req.params
  try {
    const biz = await db.query('SELECT id FROM businesses WHERE slug = $1', [slug])
    if (!biz.rows.length) return res.status(404).json({ error: 'Negocio no encontrado' })
    const result = await db.query(
      `SELECT id, name, avatar_url FROM users
       WHERE business_id = $1 AND is_active = true AND role IN ('owner','staff')
       ORDER BY role DESC, name ASC`,
      [biz.rows[0].id]
    )
    res.json({ staff: result.rows })
  } catch (err) {
    console.error('listPublic staff error:', err)
    res.status(500).json({ error: 'Error' })
  }
}

// ─── Crear staff (owner only) ───────────────────────────────────
exports.create = async (req, res) => {
  const { businessId } = req.user
  const { name, email, phone } = req.body
  if (!name) return res.status(400).json({ error: 'Nombre requerido' })

  try {
    // Generate random password (staff doesn't need to login for MVP)
    const password = crypto.randomBytes(8).toString('hex')
    const hash = await bcrypt.hash(password, 10)

    // Use a generated email if not provided
    const staffEmail = email || `staff-${crypto.randomBytes(4).toString('hex')}@agendamx.net`

    const result = await db.query(
      `INSERT INTO users (business_id, name, email, phone, password_hash, role)
       VALUES ($1,$2,$3,$4,$5,'staff') RETURNING id, name, email, phone, role, created_at`,
      [businessId, name, staffEmail, phone || null, hash]
    )
    res.status(201).json({ staff: result.rows[0] })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un usuario con ese email' })
    }
    console.error('create staff error:', err)
    res.status(500).json({ error: 'Error al crear miembro del equipo' })
  }
}

// ─── Actualizar staff (owner only) ──────────────────────────────
exports.update = async (req, res) => {
  const { id } = req.params
  const { businessId } = req.user
  const { name, phone } = req.body
  try {
    const result = await db.query(
      `UPDATE users SET
         name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         updated_at = NOW()
       WHERE id = $3 AND business_id = $4 AND role = 'staff' RETURNING id, name, email, phone, role`,
      [name, phone, id, businessId]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Staff no encontrado' })
    res.json({ staff: result.rows[0] })
  } catch (err) {
    console.error('update staff error:', err)
    res.status(500).json({ error: 'Error al actualizar' })
  }
}

// ─── Desactivar staff (owner only) ─────────────────────────────
exports.remove = async (req, res) => {
  const { id } = req.params
  const { businessId } = req.user
  try {
    const result = await db.query(
      `UPDATE users SET is_active = false, updated_at = NOW()
       WHERE id = $1 AND business_id = $2 AND role = 'staff' RETURNING id`,
      [id, businessId]
    )
    if (!result.rows.length) return res.status(404).json({ error: 'Staff no encontrado' })
    res.json({ message: 'Miembro desactivado' })
  } catch (err) {
    console.error('remove staff error:', err)
    res.status(500).json({ error: 'Error al desactivar' })
  }
}
