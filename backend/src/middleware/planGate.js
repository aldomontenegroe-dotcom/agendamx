const db = require('../config/db')

/**
 * Middleware para verificar que el negocio tenga un plan suficiente.
 * Uso: router.post('/', auth, planGate('pro'), controller.action)
 */
function planGate(minPlan) {
  const hierarchy = { free: 0, starter: 1, pro: 2, business: 3 }

  return async (req, res, next) => {
    try {
      const biz = await db.query(
        'SELECT plan FROM businesses WHERE id = $1',
        [req.user.businessId]
      )
      const currentPlan = biz.rows[0]?.plan || 'free'
      if (hierarchy[currentPlan] >= hierarchy[minPlan]) return next()

      const planNames = { free: 'Gratis', starter: 'Starter', pro: 'Pro', business: 'Business' }
      res.status(403).json({
        error: `Esta función requiere el plan ${planNames[minPlan] || minPlan} o superior`,
        code: 'PLAN_REQUIRED',
        requiredPlan: minPlan,
        currentPlan,
      })
    } catch (err) {
      console.error('planGate error:', err)
      res.status(500).json({ error: 'Error al verificar plan' })
    }
  }
}

module.exports = planGate
