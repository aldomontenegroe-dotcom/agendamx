const Stripe = require('stripe')
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null
const db = require('../config/db')

const PLATFORM_FEE_PERCENT = 3 // AgendaMX cobra 3% de comisión

// ─── Verificar si el negocio tiene pagos configurados ──────────
async function hasPaymentProvider(businessId) {
  const biz = await db.query(
    'SELECT stripe_connect_account_id, mercadopago_access_token FROM businesses WHERE id = $1',
    [businessId]
  )
  if (!biz.rows.length) return { stripe: false, mercadopago: false, any: false }
  const row = biz.rows[0]
  return {
    stripe: !!row.stripe_connect_account_id,
    mercadopago: !!row.mercadopago_access_token,
    any: !!(row.stripe_connect_account_id || row.mercadopago_access_token),
  }
}

// ═══════════════════════════════════════════════════════════════════
// STRIPE CONNECT
// ═══════════════════════════════════════════════════════════════════

// ─── Generar URL de onboarding Stripe Connect ───────────────────
async function getStripeConnectUrl(businessId) {
  if (!stripe) throw new Error('Stripe no está configurado en la plataforma')

  const biz = await db.query('SELECT slug, stripe_connect_account_id FROM businesses WHERE id = $1', [businessId])
  if (!biz.rows.length) throw new Error('Negocio no encontrado')

  let accountId = biz.rows[0].stripe_connect_account_id

  // Si ya tiene cuenta, crear link de dashboard
  if (accountId) {
    try {
      const loginLink = await stripe.accounts.createLoginLink(accountId)
      return { url: loginLink.url, type: 'dashboard' }
    } catch (e) {
      // Account may have been deleted, create new one
      accountId = null
    }
  }

  // Crear nueva cuenta Connect
  const account = await stripe.accounts.create({
    type: 'standard', // Standard Connect: el negocio maneja todo desde su propio Stripe
    country: 'MX',
    metadata: { businessId },
  })

  // Guardar el account ID
  await db.query(
    'UPDATE businesses SET stripe_connect_account_id = $1 WHERE id = $2',
    [account.id, businessId]
  )

  // Crear link de onboarding
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `https://admin.agendamx.net?stripe=refresh`,
    return_url: `https://admin.agendamx.net?stripe=success`,
    type: 'account_onboarding',
  })

  return { url: accountLink.url, type: 'onboarding', accountId: account.id }
}

// ─── Verificar status de cuenta Stripe Connect ──────────────────
async function getStripeConnectStatus(businessId) {
  if (!stripe) return { connected: false, reason: 'Stripe no configurado' }

  const biz = await db.query(
    'SELECT stripe_connect_account_id FROM businesses WHERE id = $1',
    [businessId]
  )
  if (!biz.rows.length || !biz.rows[0].stripe_connect_account_id) {
    return { connected: false, reason: 'No conectado' }
  }

  try {
    const account = await stripe.accounts.retrieve(biz.rows[0].stripe_connect_account_id)
    return {
      connected: true,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      accountId: account.id,
      email: account.email,
    }
  } catch (e) {
    return { connected: false, reason: e.message }
  }
}

// ─── Desconectar Stripe Connect ─────────────────────────────────
async function disconnectStripe(businessId) {
  await db.query(
    'UPDATE businesses SET stripe_connect_account_id = NULL WHERE id = $1',
    [businessId]
  )
  return { ok: true }
}

// ═══════════════════════════════════════════════════════════════════
// CREAR SESIÓN DE PAGO (usa la cuenta Connect del negocio)
// ═══════════════════════════════════════════════════════════════════

async function createStripeSession({ businessId, appointmentId, amount, clientName, serviceName, returnUrl }) {
  if (!stripe) throw new Error('Stripe no está configurado')

  const biz = await db.query(
    'SELECT name, slug, stripe_connect_account_id FROM businesses WHERE id = $1',
    [businessId]
  )
  if (!biz.rows.length) throw new Error('Negocio no encontrado')

  const connectAccountId = biz.rows[0].stripe_connect_account_id
  if (!connectAccountId) throw new Error('Negocio no tiene Stripe conectado')

  const amountCents = Math.round(amount * 100)
  const platformFeeCents = Math.round(amountCents * PLATFORM_FEE_PERCENT / 100)
  const slug = biz.rows[0].slug

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
        unit_amount: amountCents,
      },
      quantity: 1,
    }],
    payment_intent_data: {
      application_fee_amount: platformFeeCents, // Comisión para AgendaMX
    },
    success_url: returnUrl
      ? `${returnUrl}?payment=success&appointment=${appointmentId}`
      : `https://agendamx.net/${slug}?payment=success&appointment=${appointmentId}`,
    cancel_url: returnUrl
      ? `${returnUrl}?payment=cancel&appointment=${appointmentId}`
      : `https://agendamx.net/${slug}?payment=cancel&appointment=${appointmentId}`,
    metadata: { appointmentId, businessId },
  }, {
    stripeAccount: connectAccountId, // Pago va a la cuenta del negocio
  })

  // Guardar intent ID en la cita
  await db.query(
    'UPDATE appointments SET payment_intent_id = $1, payment_method = $2 WHERE id = $3',
    [session.id, 'stripe', appointmentId]
  )

  return { url: session.url, sessionId: session.id }
}

// ─── Crear preferencia Mercado Pago (usa token del negocio) ─────
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
      marketplace_fee: Math.round(amount * PLATFORM_FEE_PERCENT) / 100, // Comisión AgendaMX
    },
  })

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
    if (session.mode !== 'payment') return

    const { appointmentId } = session.metadata || {}
    if (!appointmentId) return

    await db.query(
      `UPDATE appointments SET
        payment_status = 'paid',
        payment_amount = $1,
        payment_reference = $2,
        paid_at = NOW(),
        status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END
      WHERE id = $3`,
      [session.amount_total / 100, session.payment_intent, appointmentId]
    )
    console.log(`✅ Payment completed for appointment ${appointmentId}`)
  }
}

// ─── Manejar webhook de Mercado Pago ────────────────────────────
async function handleMercadoPagoWebhook(data) {
  if (data.type === 'payment') {
    try {
      const paymentId = data.data?.id
      if (!paymentId) return
      console.log(`MP payment notification: ${paymentId}`)
      // TODO: Verificar pago con API de MP y actualizar appointment
    } catch (err) {
      console.error('MP webhook error:', err)
    }
  }
}

// ─── Generar link de pago (intenta Stripe → Mercado Pago) ───────
async function generatePaymentLink({ appointmentId, businessId }) {
  const appt = await db.query(
    `SELECT a.id, a.price, a.client_name, a.payment_status,
            s.name as service_name,
            b.accept_payments, b.payment_mode, b.deposit_percentage, b.slug,
            b.stripe_connect_account_id, b.mercadopago_access_token
     FROM appointments a
     JOIN services s ON s.id = a.service_id
     JOIN businesses b ON b.id = a.business_id
     WHERE a.id = $1 AND a.business_id = $2`,
    [appointmentId, businessId]
  )
  if (!appt.rows.length) return null
  const row = appt.rows[0]

  if (!row.accept_payments || row.payment_status === 'paid') return null

  // Verificar que el negocio tenga al menos un proveedor de pago
  if (!row.stripe_connect_account_id && !row.mercadopago_access_token) return null

  // Calcular monto según modo de pago
  let amount = Number(row.price) || 0
  if (row.payment_mode === 'deposit') {
    amount = Math.ceil(amount * (row.deposit_percentage / 100))
  }
  if (amount <= 0) return null

  // Intentar Stripe primero (si tiene cuenta conectada)
  if (row.stripe_connect_account_id) {
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
  }

  // Fallback a Mercado Pago (si tiene token)
  if (row.mercadopago_access_token) {
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
  hasPaymentProvider,
  getStripeConnectUrl,
  getStripeConnectStatus,
  disconnectStripe,
  createStripeSession,
  createMercadoPagoPreference,
  handleStripeWebhook,
  handleMercadoPagoWebhook,
  generatePaymentLink,
  getPaymentStatus,
}
