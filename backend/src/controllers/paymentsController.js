const paymentService = require('../services/paymentService')
const Stripe = require('stripe')
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null

// ═══════════════════════════════════════════════════════════════════
// STRIPE CONNECT — Cada negocio conecta su propia cuenta
// ═══════════════════════════════════════════════════════════════════

// GET /api/payments/connect/status — Check if business has Stripe connected
exports.connectStatus = async (req, res) => {
  try {
    const status = await paymentService.getStripeConnectStatus(req.user.businessId)
    const providers = await paymentService.hasPaymentProvider(req.user.businessId)
    res.json({ stripe: status, providers })
  } catch (err) {
    console.error('connectStatus error:', err)
    res.status(500).json({ error: 'Error al verificar conexión Stripe' })
  }
}

// POST /api/payments/connect/stripe — Start Stripe Connect onboarding
exports.connectStripe = async (req, res) => {
  try {
    const result = await paymentService.getStripeConnectUrl(req.user.businessId)
    res.json(result)
  } catch (err) {
    console.error('connectStripe error:', err)
    res.status(500).json({ error: 'Error al conectar Stripe: ' + err.message })
  }
}

// POST /api/payments/connect/stripe/disconnect — Disconnect Stripe
exports.disconnectStripe = async (req, res) => {
  try {
    await paymentService.disconnectStripe(req.user.businessId)
    res.json({ ok: true })
  } catch (err) {
    console.error('disconnectStripe error:', err)
    res.status(500).json({ error: 'Error al desconectar Stripe' })
  }
}

// POST /api/payments/connect/mercadopago — Save MP access token
exports.connectMercadoPago = async (req, res) => {
  const { accessToken } = req.body
  if (!accessToken) {
    return res.status(400).json({ error: 'accessToken requerido' })
  }
  try {
    const db = require('../config/db')
    await db.query(
      'UPDATE businesses SET mercadopago_access_token = $1 WHERE id = $2',
      [accessToken, req.user.businessId]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error('connectMercadoPago error:', err)
    res.status(500).json({ error: 'Error al guardar token de Mercado Pago' })
  }
}

// POST /api/payments/connect/mercadopago/disconnect — Remove MP token
exports.disconnectMercadoPago = async (req, res) => {
  try {
    const db = require('../config/db')
    await db.query(
      'UPDATE businesses SET mercadopago_access_token = NULL WHERE id = $1',
      [req.user.businessId]
    )
    res.json({ ok: true })
  } catch (err) {
    console.error('disconnectMercadoPago error:', err)
    res.status(500).json({ error: 'Error al desconectar Mercado Pago' })
  }
}

// ═══════════════════════════════════════════════════════════════════
// PAYMENT SESSIONS — Para clientes que pagan
// ═══════════════════════════════════════════════════════════════════

// POST /api/payments/session — Create payment session for an appointment
exports.createSession = async (req, res) => {
  const { appointmentId, returnUrl } = req.body
  if (!appointmentId) {
    return res.status(400).json({ error: 'appointmentId requerido' })
  }

  try {
    const result = await paymentService.generatePaymentLink({ appointmentId, businessId: null })
    if (!result) {
      return res.status(400).json({ error: 'No se pudo generar link de pago. Verifica que el negocio tenga pagos configurados.' })
    }
    res.json({ paymentUrl: result.url, amount: result.amount, method: result.method })
  } catch (err) {
    console.error('createSession error:', err)
    res.status(500).json({ error: 'Error al crear sesión de pago' })
  }
}

// POST /api/payments/webhook — Handle Stripe payment webhooks
exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_PAYMENT_WEBHOOK_SECRET

  if (!stripe || !webhookSecret) {
    return res.status(400).json({ error: 'Webhook not configured' })
  }

  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
    await paymentService.handleStripeWebhook(event)
    res.json({ received: true })
  } catch (err) {
    console.error('Payment webhook error:', err.message)
    res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }
}

// POST /api/payments/webhook/mercadopago — Handle MP webhooks
exports.webhookMercadoPago = async (req, res) => {
  try {
    await paymentService.handleMercadoPagoWebhook(req.body)
    res.json({ received: true })
  } catch (err) {
    console.error('MP webhook error:', err)
    res.status(400).json({ error: 'Error processing webhook' })
  }
}

// GET /api/payments/status/:appointmentId — Check payment status
exports.getStatus = async (req, res) => {
  const { appointmentId } = req.params
  try {
    const status = await paymentService.getPaymentStatus(appointmentId)
    if (!status) {
      return res.status(404).json({ error: 'Cita no encontrada' })
    }
    res.json({ payment: status })
  } catch (err) {
    console.error('getPaymentStatus error:', err)
    res.status(500).json({ error: 'Error al obtener estado de pago' })
  }
}
