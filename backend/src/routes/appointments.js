const router = require('express').Router()
const ctrl   = require('../controllers/appointmentsController')
const { auth, ownerOnly } = require('../middleware/auth')
const { planLimit } = require('../middleware/planLimit')

// Rutas públicas PRIMERO (evitar colisión con /:id)
router.get('/public/:slug/availability', ctrl.availability)
router.post('/public/:slug/book',        planLimit, ctrl.book)

// Rutas protegidas (panel admin)
router.get('/',           auth, ctrl.list)
router.post('/',          auth, ownerOnly, planLimit, ctrl.create)
router.patch('/:id/status', auth, ownerOnly, ctrl.updateStatus)

module.exports = router
