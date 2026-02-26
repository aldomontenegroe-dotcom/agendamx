const Stripe = require('stripe')
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null
const db = require('../config/db')

const PLANS = {
  free: {
    name: 'Gratis',
    price: 0,
    priceId: null,
    monthlyLimit: 10,
    features: ['10 citas al mes', 'Panel de administración', 'Página de reservas pública'],
  },
  starter: {
    name: 'Starter',
    price: 299,
    priceId: process.env.STRIPE_PRICE_STARTER,
    monthlyLimit: 100,
    features: ['100 citas al mes', 'Notificaciones WhatsApp', 'Recordatorios automáticos', 'Todo de Gratis'],
  },
  pro: {
    name: 'Pro',
    price: 599,
    priceId: process.env.STRIPE_PRICE_PRO,
    monthlyLimit: null,
    features: ['Citas ilimitadas', 'Analíticas avanzadas', 'Soporte prioritario', 'Todo de Starter'],
  },
  business: {
    name: 'Business',
    price: 999,
    priceId: process.env.STRIPE_PRICE_BUSINESS,
    monthlyLimit: null,
    features: ['Multi-staff', 'Acceso API', 'Marca blanca', 'Todo de Pro'],
  },
}

async function getOrCreateCustomer(businessId) {
  const biz = await db.query(
    'SELECT id, stripe_customer_id, name, slug FROM businesses WHERE id = $1',
    [businessId]
  )
  if (!biz.rows.length) throw new Error('Negocio no encontrado')
  const business = biz.rows[0]

  if (business.stripe_customer_id) return business.stripe_customer_id

  // Get owner email
  const owner = await db.query(
    'SELECT email FROM users WHERE business_id = $1 AND role = $2',
    [businessId, 'owner']
  )

  const customer = await stripe.customers.create({
    name: business.name,
    email: owner.rows[0]?.email,
    metadata: { businessId, slug: business.slug },
  })

  await db.query(
    'UPDATE businesses SET stripe_customer_id = $1 WHERE id = $2',
    [customer.id, businessId]
  )
  return customer.id
}

async function createCheckoutSession(businessId, planId, successUrl, cancelUrl) {
  if (!stripe) throw new Error('Stripe no está configurado')
  const plan = PLANS[planId]
  if (!plan || !plan.priceId) throw new Error('Plan inválido')

  const customerId = await getOrCreateCustomer(businessId)

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: successUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}?plan=success`,
    cancel_url: cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}?plan=cancel`,
    metadata: { businessId, planId },
  })

  return { url: session.url }
}

async function handleWebhookEvent(event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      const { businessId, planId } = session.metadata || {}
      if (!businessId || !planId) break

      const subscription = await stripe.subscriptions.retrieve(session.subscription)
      const periodEnd = new Date(subscription.current_period_end * 1000)

      await db.query(
        `UPDATE businesses SET plan = $1, plan_expires_at = $2, stripe_subscription_id = $3 WHERE id = $4`,
        [planId, periodEnd.toISOString(), session.subscription, businessId]
      )
      console.log(`Plan upgraded: business ${businessId} → ${planId}`)

      // Email notification (fire-and-forget)
      try {
        const emailService = require('./emailService')
        const owner = await db.query(
          'SELECT u.email, u.name, b.name as biz_name, b.slug FROM users u JOIN businesses b ON b.id = u.business_id WHERE u.business_id = $1 AND u.role = $2',
          [businessId, 'owner']
        )
        if (owner.rows[0]?.email) {
          emailService.sendWelcomeEmail(owner.rows[0].email, {
            name: owner.rows[0].name, businessName: owner.rows[0].biz_name, slug: owner.rows[0].slug,
          }).catch(() => {})
        }
      } catch (e) { /* emailService may not be available */ }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object
      const biz = await db.query(
        'SELECT id FROM businesses WHERE stripe_subscription_id = $1',
        [subscription.id]
      )
      if (!biz.rows.length) break
      const periodEnd = new Date(subscription.current_period_end * 1000)

      await db.query(
        'UPDATE businesses SET plan_expires_at = $1 WHERE id = $2',
        [periodEnd.toISOString(), biz.rows[0].id]
      )
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      await db.query(
        `UPDATE businesses SET plan = 'free', plan_expires_at = NULL, stripe_subscription_id = NULL
         WHERE stripe_subscription_id = $1`,
        [subscription.id]
      )
      console.log(`Subscription cancelled: ${subscription.id}`)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object
      console.error(`Payment failed for subscription ${invoice.subscription}`)
      break
    }
  }
}

async function getSubscription(businessId) {
  const biz = await db.query(
    'SELECT plan, plan_expires_at, stripe_subscription_id FROM businesses WHERE id = $1',
    [businessId]
  )
  if (!biz.rows.length) throw new Error('Negocio no encontrado')

  const { plan, plan_expires_at, stripe_subscription_id } = biz.rows[0]
  let cancelAtPeriodEnd = false

  if (stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const sub = await stripe.subscriptions.retrieve(stripe_subscription_id)
      cancelAtPeriodEnd = sub.cancel_at_period_end
    } catch (e) { /* subscription may not exist */ }
  }

  return {
    plan,
    planName: PLANS[plan]?.name || plan,
    expiresAt: plan_expires_at,
    cancelAtPeriodEnd,
    features: PLANS[plan]?.features || [],
  }
}

async function cancelSubscription(businessId) {
  const biz = await db.query(
    'SELECT stripe_subscription_id FROM businesses WHERE id = $1',
    [businessId]
  )
  if (!biz.rows[0]?.stripe_subscription_id) throw new Error('No hay suscripción activa')

  await stripe.subscriptions.update(biz.rows[0].stripe_subscription_id, {
    cancel_at_period_end: true,
  })
}

async function createPortalSession(businessId, returnUrl) {
  const customerId = await getOrCreateCustomer(businessId)
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl || process.env.FRONTEND_URL || 'http://localhost:3000',
  })
  return { url: session.url }
}

module.exports = { PLANS, createCheckoutSession, handleWebhookEvent, getSubscription, cancelSubscription, createPortalSession }
