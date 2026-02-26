const wa = require('../services/whatsappService')

// ─── Verificación del webhook (Meta lo llama al configurar) ───────
exports.verify = (req, res) => {
  const mode      = req.query['hub.mode']
  const token     = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verificado')
    res.status(200).send(challenge)
  } else {
    res.status(403).json({ error: 'Token de verificación incorrecto' })
  }
}

// ─── Recibir mensajes entrantes ───────────────────────────────────
exports.receive = async (req, res) => {
  // Siempre responder 200 rápido a Meta para evitar reintentos
  res.sendStatus(200)

  try {
    const body = req.body
    if (!body?.entry?.[0]?.changes?.[0]?.value?.messages) return

    const value   = body.entry[0].changes[0].value
    const message = value.messages[0]
    const contact = value.contacts?.[0]

    const from = wa.normalizePhone(message.from)
    const text = message.text?.body?.trim() || ''
    const name = contact?.profile?.name || 'Cliente'

    if (!from || !text) return

    console.log(`📩 Mensaje de ${from}: "${text}"`)

    // Delegar al bot inteligente
    const bot = require('../services/whatsappBot')
    await bot.handleMessage(from, text, name)
  } catch (err) {
    console.error('webhook receive error:', err)
  }
}
