const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')
const { v4: uuid } = require('uuid')
const db       = require('../config/db')

// ─── Helpers ──────────────────────────────────────────────────────
const genToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

const slugify = (text) =>
  text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim().replace(/\s+/g, '-')

// ─── Registro de nuevo negocio ────────────────────────────────────
exports.register = async (req, res) => {
  const { name, businessName, email, password, phone } = req.body

  // Validaciones básicas
  if (!name || !businessName || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
  }

  try {
    // Verificar email único
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Este correo ya está registrado' })
    }

    // Generar slug único para el negocio
    let slug = slugify(businessName)
    const slugExists = await db.query('SELECT id FROM businesses WHERE slug = $1', [slug])
    if (slugExists.rows.length > 0) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    // Hash del password
    const passwordHash = await bcrypt.hash(password, 12)

    // Crear negocio y usuario en una transacción
    const client = await db.pool.connect()
    try {
      await client.query('BEGIN')

      const bizResult = await client.query(
        `INSERT INTO businesses (slug, name, plan, settings)
         VALUES ($1, $2, 'free', '{}')
         RETURNING id, slug, name, plan`,
        [slug, businessName]
      )
      const business = bizResult.rows[0]

      // Horarios por defecto: Lunes-Sábado 9am-7pm
      const defaultHours = [
        { day: 1, opens: '09:00', closes: '19:00', open: true },  // Lunes
        { day: 2, opens: '09:00', closes: '19:00', open: true },  // Martes
        { day: 3, opens: '09:00', closes: '19:00', open: true },  // Miércoles
        { day: 4, opens: '09:00', closes: '19:00', open: true },  // Jueves
        { day: 5, opens: '09:00', closes: '19:00', open: true },  // Viernes
        { day: 6, opens: '09:00', closes: '15:00', open: true },  // Sábado
        { day: 0, opens: null,   closes: null,     open: false }, // Domingo
      ]
      for (const h of defaultHours) {
        await client.query(
          `INSERT INTO business_hours (business_id, day_of_week, opens_at, closes_at, is_open)
           VALUES ($1, $2, $3, $4, $5)`,
          [business.id, h.day, h.opens, h.closes, h.open]
        )
      }

      const userResult = await client.query(
        `INSERT INTO users (business_id, name, email, phone, password_hash, role)
         VALUES ($1, $2, $3, $4, $5, 'owner')
         RETURNING id, name, email, role`,
        [business.id, name, email.toLowerCase(), phone || null, passwordHash]
      )
      const user = userResult.rows[0]

      await client.query('COMMIT')

      const token = genToken({
        userId: user.id,
        businessId: business.id,
        role: user.role,
      })

      res.status(201).json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        business: { id: business.id, slug: business.slug, name: business.name, plan: business.plan },
      })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('register error:', err)
    res.status(500).json({ error: 'Error al crear cuenta' })
  }
}

// ─── Login ────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña requeridos' })
  }

  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.is_active,
              b.id as business_id, b.slug, b.name as business_name, b.plan
       FROM users u
       JOIN businesses b ON b.id = u.business_id
       WHERE u.email = $1`,
      [email.toLowerCase()]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    const row = result.rows[0]

    if (!row.is_active) {
      return res.status(403).json({ error: 'Cuenta desactivada' })
    }

    const valid = await bcrypt.compare(password, row.password_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    // Actualizar last_login
    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [row.id])

    const token = genToken({
      userId: row.id,
      businessId: row.business_id,
      role: row.role,
    })

    res.json({
      token,
      user: { id: row.id, name: row.name, email: row.email, role: row.role },
      business: { id: row.business_id, slug: row.slug, name: row.business_name, plan: row.plan },
    })
  } catch (err) {
    console.error('login error:', err)
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
}

// ─── Me (perfil actual) ───────────────────────────────────────────
exports.me = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.avatar_url,
              b.id as business_id, b.slug, b.name as business_name,
              b.plan, b.plan_expires_at, b.settings
       FROM users u
       JOIN businesses b ON b.id = u.business_id
       WHERE u.id = $1`,
      [req.user.userId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    const row = result.rows[0]
    res.json({
      user: { id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role, avatarUrl: row.avatar_url },
      business: { id: row.business_id, slug: row.slug, name: row.business_name, plan: row.plan, planExpiresAt: row.plan_expires_at, settings: row.settings },
    })
  } catch (err) {
    console.error('me error:', err)
    res.status(500).json({ error: 'Error al obtener perfil' })
  }
}
