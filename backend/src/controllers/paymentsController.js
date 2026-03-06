const paymentService = require('../services/paymentService')
const Stripe = require('stripe')
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null

// POST /api/payments/session — Create payment session for an appointment
exports.createSession = async (req, res) => {
  const { appointmentId, returnUrl } = req.body
  if (!appointmentId) {
    return res.status(400).json({ error: 'appointmentId requerido' })
  }

  try {
    const db = require('../config/db')
    const appt = await db.query(
      `SELECT a.id, a.business_id, a.price, a.client_name, a.payment_status,
              s.name as service_name,
              b.accept_payments, b.payment_mode, b.deposit_percentage
       FROM appointments a
       JOIN services s ON s.id = a.service_id
       JOIN businesses b ON b.id = a.business_id
       WHERE a.id = $1`,
      [appointmentId]
    )

    if (!appt.rows.length) {
      return res.status(404).json({ error: 'Cita no encontrada' })
    }

    const row = appt.rows[0]
    if (!row.accept_payments) {
      return res.status(400).json({ error: 'Este negocio no acepta pagos en línea' })
    }
    if (row.payment_status === 'paid') {
      return res.status(400).json({ error: 'Esta cita ya fue pagada' })
    }

    // Calcular monto
    let amount = Number(row.price) || 0
    if (row.payment_mode === 'deposit') {
      amount = Math.ceil(amount * (row.deposit_percentage / 100))
    }

    // Intentar crear sesión de pago
    const result = await paymentService.createStripeSession({
      businessId: row.business_id,
      appointmentId,
      amount,
      clientName: row.client_name,
      serviceName: row.service_name,
      returnUrl,
    })

    res.json({ paymentUrl: result.url, amount, sessionId: result.sessionId })
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
