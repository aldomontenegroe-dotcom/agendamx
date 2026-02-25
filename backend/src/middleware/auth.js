const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' })
  }
  const token = header.split(' ')[1]
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload        // { userId, businessId, role }
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

// Solo permite owner o admin del negocio
const ownerOnly = (req, res, next) => {
  if (!['owner', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Acceso denegado' })
  }
  next()
}

module.exports = { auth, ownerOnly }
