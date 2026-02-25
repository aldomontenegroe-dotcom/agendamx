const router = require('express').Router()
const ctrl   = require('../controllers/appointmentsController')
const { auth, ownerOnly } = require('../middleware/auth')

// Rutas protegidas (panel admin)
router.get('/',           auth, ctrl.list)
router.post('/',          auth, ownerOnly, ctrl.create)
router.patch('/:id/status', auth, ownerOnly, ctrl.updateStatus)

// Rutas públicas (página de reservas del cliente)
router.get('/public/:slug/availability', ctrl.availability)
router.post('/public/:slug/book',        ctrl.book)

module.exports = router
