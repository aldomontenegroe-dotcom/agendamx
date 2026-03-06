const router = require('express').Router()
const { auth } = require('../middleware/auth')
const ctrl = require('../controllers/paymentsController')

// ─── Stripe Connect (auth required — business owner) ─────────
router.get('/connect/status', auth, ctrl.connectStatus)
router.post('/connect/stripe', auth, ctrl.connectStripe)
router.post('/connect/stripe/disconnect', auth, ctrl.disconnectStripe)
router.post('/connect/mercadopago', auth, ctrl.connectMercadoPago)
router.post('/connect/mercadopago/disconnect', auth, ctrl.disconnectMercadoPago)

// ─── Public endpoints (no auth — client-facing) ─────────────
router.post('/session', ctrl.createSession)
router.post('/webhook', ctrl.webhook)
router.post('/webhook/mercadopago', ctrl.webhookMercadoPago)
router.get('/status/:appointmentId', ctrl.getStatus)

module.exports = router
