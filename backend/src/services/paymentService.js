const Stripe = require('stripe')
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null
const db = require('../config/db')

// ─── Crear sesión de pago Stripe (one-time, no subscription) ────
async function createStripeSession({ businessId, appointmentId, amount, clientName, serviceName, returnUrl }) {
  if (!stripe) throw new Error('Stripe no está configurado')

  // Get business Stripe customer or use direct payment
  const biz = await db.query(
    'SELECT name, slug, stripe_customer_id FROM businesses WHERE id = $1',
    [businessId]
  )
  if (!biz.rows.length) throw new Error('Negocio no encontrado')

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'mxn',
        product_data: {
          name: serviceName || 'Cita',
          description: `Cita en ${biz.rows[0].name}`,
        },
        unit_amount: Math.round(amount * 100), // Stripe usa centavos
      },
      quantity: 1,
    }],
    success_url: returnUrl
      ? `${returnUrl}?payment=success&appointment=${appointmentId}`
      : `https://agendamx.net/${biz.rows[0].slug}?payment=success&appointment=${appointmentId}`,
    cancel_url: returnUrl
      ? `${returnUrl}?payment=cancel&appointment=${appointmentId}`
      : `https://agendamx.net/${biz.rows[0].slug}?payment=cancel&appointment=${appointmentId}`,
    metadata: { appointmentId, businessId },
    expires_after: 1800, // 30 min para pagar
  })

  // Guardar intent ID en la cita
  await db.query(
    'UPDATE appointments SET payment_intent_id = $1, payment_method = $2 WHERE id = $3',
    [session.id, 'stripe', appointmentId]
  )

  return { url: session.url, sessionId: session.id }
}

// ─── Crear preferencia Mercado Pago ─────────────────────────────
async function createMercadoPagoPreference({ businessId, appointmentId, amount, clientName, serviceName, returnUrl }) {
  const biz = await db.query(
    'SELECT name, slug, mercadopago_access_token FROM businesses WHERE id = $1',
    [businessId]
  )
  if (!biz.rows.length) throw new Error('Negocio no encontrado')

  const mpToken = biz.rows[0].mercadopago_access_token
  if (!mpToken) throw new Error('Mercado Pago no configurado para este negocio')

  const { MercadoPagoConfig, Preference } = require('mercadopago')
  const mpClient = new MercadoPagoConfig({ accessToken: mpToken })
  const preference = new Preference(mpClient)

  const slug = biz.rows[0].slug
  const baseUrl = returnUrl || `https://agendamx.net/${slug}`

  const result = await preference.create({
    body: {
      items: [{
        title: serviceName || 'Cita',
        description: `Cita en ${biz.rows[0].name}`,
        quantity: 1,
        currency_id: 'MXN',
        unit_price: Number(amount),
      }],
      back_urls: {
        success: `${baseUrl}?payment=success&appointment=${appointmentId}`,
        failure: `${baseUrl}?payment=cancel&appointment=${appointmentId}`,
        pending: `${baseUrl}?payment=pending&appointment=${appointmentId}`,
      },
      auto_return: 'approved',
      external_reference: appointmentId,
      metadata: { appointmentId, businessId },
    },
  })

  // Guardar reference
  await db.query(
    'UPDATE appointments SET payment_intent_id = $1, payment_method = $2 WHERE id = $3',
    [result.id, 'mercadopago', appointmentId]
  )

  return { url: result.init_point, preferenceId: result.id }
}

// ─── Manejar webhook de Stripe (pagos one-time) ────────────────
async function handleStripeWebhook(event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    if (session.mode !== 'payment') return // solo pagos, no subscriptions

    const { appointmentId } = session.metadata || {}
    if (!appointmentId) return

    await db.query(
      `UPDATE appointments SET
        payment_status = 'paid',
        payment_amount = $1,
        payment_reference = $2,
        paid_at = NOW()
      WHERE id = $3`,
      [session.amount_total / 100, session.payment_intent, appointmentId]
    )
    console.log(`Payment completed for appointment ${appointmentId}`)
  }
}

// ─── Manejar webhook de Mercado Pago ────────────────────────────
async function handleMercadoPagoWebhook(data) {
  if (data.type === 'payment') {
    try {
      // Get the appointment from the external_reference
      const paymentId = data.data?.id
      if (!paymentId) return

      // We need to fetch payment details from MP API
      // For now, mark as paid if notification received
      // The business's MP token is needed to verify
      console.log(`MP payment notification: ${paymentId}`)
    } catch (err) {
      console.error('MP webhook error:', err)
    }
  }
}

// ─── Generar link de pago para WhatsApp ─────────────────────────
async function generatePaymentLink({ appointmentId, businessId }) {
  const appt = await db.query(
    `SELECT a.id, a.price, a.client_name, a.payment_status,
            s.name as service_name,
            b.accept_payments, b.payment_mode, b.deposit_percentage, b.slug
     FROM appointments a
     JOIN services s ON s.id = a.service_id
     JOIN businesses b ON b.id = a.business_id
     WHERE a.id = $1 AND a.business_id = $2`,
    [appointmentId, businessId]
  )
  if (!appt.rows.length) return null
  const row = appt.rows[0]

  if (!row.accept_payments || row.payment_status === 'paid') return null

  // Calcular monto según modo de pago
  let amount = Number(row.price) || 0
  if (row.payment_mode === 'deposit') {
    amount = Math.ceil(amount * (row.deposit_percentage / 100))
  }
  if (amount <= 0) return null

  // Intentar Stripe primero
  try {
    const result = await createStripeSession({
      businessId,
      appointmentId,
      amount,
      clientName: row.client_name,
      serviceName: row.service_name,
    })
    return { url: result.url, amount, method: 'stripe' }
  } catch (e) {
    console.error('Stripe payment link error:', e.message)
  }

  // Fallback a Mercado Pago
  try {
    const result = await createMercadoPagoPreference({
      businessId,
      appointmentId,
      amount,
      clientName: row.client_name,
      serviceName: row.service_name,
    })
    return { url: result.url, amount, method: 'mercadopago' }
  } catch (e) {
    console.error('MP payment link error:', e.message)
  }

  return null
}

// ─── Obtener status de pago ─────────────────────────────────────
async function getPaymentStatus(appointmentId) {
  const result = await db.query(
    `SELECT payment_status, payment_method, payment_amount, payment_reference, paid_at
     FROM appointments WHERE id = $1`,
    [appointmentId]
  )
  return result.rows[0] || null
}

module.exports = {
  createStripeSession,
  createMercadoPagoPreference,
  handleStripeWebhook,
  handleMercadoPagoWebhook,
  generatePaymentLink,
  getPaymentStatus,
}
