const db  = require('../config/db')
const wa  = require('../services/whatsappService')

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

    const from     = wa.normalizePhone(message.from)  // normalizar para matchear con DB
    const text     = message.text?.body?.trim()?.toLowerCase() || ''
    const name     = contact?.profile?.name || 'Cliente'

    console.log(`📩 Mensaje de ${from}: "${text}"`)

    // ─── Buscar si tiene cita pendiente o confirmada ──────────────
    const appt = await db.query(
      `SELECT a.id, a.status, a.starts_at, a.client_name,
              b.whatsapp as owner_phone, b.name as business_name,
              s.name as service_name
       FROM appointments a
       JOIN businesses b ON b.id = a.business_id
       JOIN services s ON s.id = a.service_id
       WHERE a.client_phone = $1
         AND a.status IN ('pending','confirmed')
         AND a.starts_at > NOW()
       ORDER BY a.starts_at ASC
       LIMIT 1`,
      [from]
    ).catch(() => null)

    const hasAppt = appt?.rows?.length > 0

    // ─── Respuestas automáticas ───────────────────────────────────
    if (text === 'sí' || text === 'si' || text === '1' || text === 'confirmar') {
      if (hasAppt) {
        await db.query(
          "UPDATE appointments SET status = 'confirmed' WHERE id = $1",
          [appt.rows[0].id]
        )
        await wa.sendText(from,
          `✅ ¡Perfecto! Tu cita con *${appt.rows[0].business_name}* está confirmada.\n` +
          `Te esperamos el ${new Date(appt.rows[0].starts_at).toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long', timeZone:'America/Mexico_City' })} 😊`
        )
      }
    }

    else if (text === 'no' || text === 'cancelar' || text === '2') {
      if (hasAppt) {
        await db.query(
          "UPDATE appointments SET status = 'cancelled' WHERE id = $1",
          [appt.rows[0].id]
        )
        await wa.sendText(from,
          `😔 Entendido, hemos cancelado tu cita.\n\n` +
          `Cuando quieras reagendar, visita tu link de reservas. ¡Hasta pronto!`
        )
      }
    }

    else if (text === 'reagendar' || text === '3') {
      if (hasAppt) {
        const biz = await db.query(
          'SELECT slug FROM businesses b JOIN appointments a ON a.business_id = b.id WHERE a.id = $1',
          [appt.rows[0].id]
        )
        await wa.sendText(from,
          `📅 Para reagendar tu cita, usa este link:\n\n` +
          `👉 ${process.env.PUBLIC_BOOKING_URL || 'https://agendamx.net'}/${biz.rows[0]?.slug || ''}\n\n` +
          `Ahí puedes elegir el nuevo horario que mejor te quede.`
        )
      }
    }

    else if (text.includes('hola') || text.includes('buenas') || text.includes('info')) {
      await wa.sendText(from,
        `¡Hola ${name}! 👋\n\n` +
        `Soy el asistente automático de AgendaMX.\n\n` +
        `Si tienes una cita pendiente, responde:\n` +
        `✅ *SÍ* — Confirmar cita\n` +
        `❌ *NO* — Cancelar cita\n` +
        `📅 *REAGENDAR* — Cambiar fecha\n\n` +
        `Para hablar con una persona, escribe *HUMANO*.`
      )
    }

    else {
      // Mensaje no reconocido — respuesta genérica
      if (hasAppt) {
        const d = new Date(appt.rows[0].starts_at)
        await wa.sendText(from,
          `Hola ${name} 👋\n\n` +
          `Tienes una cita: *${appt.rows[0].service_name}* el ` +
          `${d.toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long', timeZone:'America/Mexico_City' })} ` +
          `a las ${d.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit', timeZone:'America/Mexico_City' })}\n\n` +
          `Responde *SÍ* para confirmar o *NO* para cancelar.`
        )
      }
    }

  } catch (err) {
    console.error('webhook receive error:', err)
  }
}
