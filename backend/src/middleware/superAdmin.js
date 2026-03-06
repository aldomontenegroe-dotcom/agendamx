const db = require('../config/db')

const SUPER_ADMIN_EMAILS = ['aldomontenegro@hotmail.com']

const superAdminOnly = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT email FROM users WHERE id = $1', [req.user.userId])
    if (!rows.length || !SUPER_ADMIN_EMAILS.includes(rows[0].email)) {
      return res.status(403).json({ error: 'Acceso denegado' })
    }
    req.user.email = rows[0].email
    next()
  } catch (err) {
    console.error('superAdminOnly error:', err)
    res.status(500).json({ error: 'Error interno' })
  }
}

module.exports = { superAdminOnly, SUPER_ADMIN_EMAILS }
