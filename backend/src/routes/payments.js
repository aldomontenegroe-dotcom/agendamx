const router = require('express').Router()
const ctrl = require('../controllers/paymentsController')

// Public endpoints (no auth — client-facing)
router.post('/session', ctrl.createSession)
router.post('/webhook', ctrl.webhook)
router.post('/webhook/mercadopago', ctrl.webhookMercadoPago)
router.get('/status/:appointmentId', ctrl.getStatus)

module.exports = router
