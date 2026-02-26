const router = require('express').Router()
const ctrl   = require('../controllers/appointmentsController')
const { auth, ownerOnly } = require('../middleware/auth')

// Rutas públicas PRIMERO (evitar colisión con /:id)
router.get('/public/:slug/availability', ctrl.availability)
router.post('/public/:slug/book',        ctrl.book)

// Rutas protegidas (panel admin)
router.get('/',           auth, ctrl.list)
router.post('/',          auth, ownerOnly, ctrl.create)
router.patch('/:id/status', auth, ownerOnly, ctrl.updateStatus)

module.exports = router
