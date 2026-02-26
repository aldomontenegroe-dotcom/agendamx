const stripeService = require('../services/stripeService')

exports.getPlans = async (req, res) => {
  try {
    const plans = {}
    for (const [id, plan] of Object.entries(stripeService.PLANS)) {
      plans[id] = { name: plan.name, price: plan.price, features: plan.features, monthlyLimit: plan.monthlyLimit }
    }
    res.json({ plans })
  } catch (err) {
    console.error('getPlans error:', err)
    res.status(500).json({ error: 'Error al obtener planes' })
  }
}

exports.createCheckout = async (req, res) => {
  const { planId } = req.body
  if (!planId || !stripeService.PLANS[planId] || planId === 'free') {
    return res.status(400).json({ error: 'Plan inválido' })
  }
  try {
    const result = await stripeService.createCheckoutSession(req.user.businessId, planId)
    res.json(result)
  } catch (err) {
    console.error('createCheckout error:', err)
    res.status(500).json({ error: 'Error al crear sesión de pago' })
  }
}

exports.webhook = async (req, res) => {
  if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Stripe no configurado' })
  const Stripe = require('stripe')
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature failed:', err.message)
    return res.status(400).json({ error: 'Firma inválida' })
  }
  try {
    await stripeService.handleWebhookEvent(event)
    res.json({ received: true })
  } catch (err) {
    console.error('Webhook processing error:', err)
    res.status(500).json({ error: 'Error procesando webhook' })
  }
}

exports.getStatus = async (req, res) => {
  try {
    const status = await stripeService.getSubscription(req.user.businessId)
    res.json({ subscription: status })
  } catch (err) {
    console.error('getStatus error:', err)
    res.status(500).json({ error: 'Error al obtener estado' })
  }
}

exports.cancel = async (req, res) => {
  try {
    await stripeService.cancelSubscription(req.user.businessId)
    res.json({ message: 'Suscripción se cancelará al final del periodo' })
  } catch (err) {
    console.error('cancel error:', err)
    res.status(500).json({ error: err.message || 'Error al cancelar' })
  }
}

exports.createPortal = async (req, res) => {
  try {
    const result = await stripeService.createPortalSession(
      req.user.businessId,
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}`
    )
    res.json(result)
  } catch (err) {
    console.error('createPortal error:', err)
    res.status(500).json({ error: 'Error al crear portal de facturación' })
  }
}
