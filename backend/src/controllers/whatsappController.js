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
    if (!body?.entry?.[0]?.changes?.[0]?.value) return

    const value   = body.entry[0].changes[0].value

    // Handle status updates (delivered, read, etc.)
    if (value.statuses) {
      // Future: track delivery/read for campaigns
      return
    }

    if (!value.messages) return

    const message = value.messages[0]
    const contact = value.contacts?.[0]

    const from = wa.normalizePhone(message.from)
    const name = contact?.profile?.name || 'Cliente'

    // Extract text from different message types
    let text = ''
    let interactiveReply = null

    if (message.type === 'text') {
      text = message.text?.body?.trim() || ''
    } else if (message.type === 'interactive') {
      // Interactive button reply
      if (message.interactive?.type === 'button_reply') {
        interactiveReply = {
          type: 'button',
          id: message.interactive.button_reply.id,
          title: message.interactive.button_reply.title,
        }
        text = message.interactive.button_reply.id
      }
      // Interactive list reply
      else if (message.interactive?.type === 'list_reply') {
        interactiveReply = {
          type: 'list',
          id: message.interactive.list_reply.id,
          title: message.interactive.list_reply.title,
          description: message.interactive.list_reply.description,
        }
        text = message.interactive.list_reply.id
      }
    }

    if (!from || !text) return

    console.log(`📩 Mensaje de ${from}: "${text}"${interactiveReply ? ` [interactive:${interactiveReply.type}]` : ''}`)

    // Delegar al bot inteligente
    const bot = require('../services/whatsappBot')
    await bot.handleMessage(from, text, name, interactiveReply)
  } catch (err) {
    console.error('webhook receive error:', err)
  }
}
