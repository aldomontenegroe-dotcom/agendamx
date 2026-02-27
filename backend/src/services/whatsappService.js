const axios = require('axios')

const WA_URL = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`
const HEADERS = {
  Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
  'Content-Type': 'application/json',
}

// ─── Normalizar número mexicano ───────────────────────────────────
// Meta requiere formato internacional sin + ni espacios: 521XXXXXXXXXX
function normalizePhone(phone) {
  let clean = phone.replace(/[\s\-\(\)\+]/g, '')
  // Si empieza con 52 y tiene 12 dígitos ya está bien
  if (clean.startsWith('52') && clean.length === 12) return clean
  // Si empieza con 52 y tiene 13 dígitos (con el 1 del celular)
  if (clean.startsWith('521') && clean.length === 13) return clean
  // Si es número local de 10 dígitos
  if (clean.length === 10) return `521${clean}`
  return clean
}

// ─── Enviar mensaje de texto simple ──────────────────────────────
async function sendText(phone, text) {
  const to = normalizePhone(phone)
  try {
    const res = await axios.post(WA_URL, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text, preview_url: true },
    }, { headers: HEADERS })
    return { ok: true, messageId: res.data.messages?.[0]?.id }
  } catch (err) {
    console.error('WA sendText error:', err.response?.data || err.message)
    return { ok: false, error: err.response?.data }
  }
}

// ─── Confirmación de cita al cliente ─────────────────────────────
async function sendConfirmation({ clientPhone, clientName, businessName, serviceName, startsAt, price, slug, staffName }) {
  const date = new Date(startsAt)
  const dateStr = date.toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    timeZone: 'America/Mexico_City',
  })
  const timeStr = date.toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City',
  })

  const message =
    `✅ *¡Cita confirmada!*\n\n` +
    `Hola ${clientName}, tu cita está lista 🎉\n\n` +
    `📋 *Servicio:* ${serviceName}\n` +
    (staffName ? `👤 *Con:* ${staffName}\n` : '') +
    `📅 *Fecha:* ${dateStr}\n` +
    `🕐 *Hora:* ${timeStr}\n` +
    `💰 *Total:* $${price} MXN\n\n` +
    `📍 *Negocio:* ${businessName}\n\n` +
    `Para reagendar o cancelar responde este mensaje.\n\n` +
    `_Agendado con AgendaMX_\n` +
    `👉 https://agendamx.net/${slug}`

  return sendText(clientPhone, message)
}

// ─── Recordatorio 24 horas antes ─────────────────────────────────
async function sendReminder24h({ clientPhone, clientName, businessName, serviceName, startsAt }) {
  const date = new Date(startsAt)
  const timeStr = date.toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City',
  })

  const message =
    `⏰ *Recordatorio de cita*\n\n` +
    `Hola ${clientName}! Te recordamos que mañana tienes:\n\n` +
    `📋 ${serviceName}\n` +
    `🕐 ${timeStr}\n` +
    `🏪 ${businessName}\n\n` +
    `¿Confirmas tu asistencia? Responde *SÍ* para confirmar o *NO* si necesitas reagendar.`

  return sendText(clientPhone, message)
}

// ─── Recordatorio 1 hora antes ────────────────────────────────────
async function sendReminder1h({ clientPhone, clientName, businessName, serviceName, startsAt }) {
  const date = new Date(startsAt)
  const timeStr = date.toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City',
  })

  const message =
    `🔔 *Tu cita es en 1 hora*\n\n` +
    `Hola ${clientName}! En 1 hora tienes:\n\n` +
    `📋 ${serviceName} en ${businessName}\n` +
    `🕐 ${timeStr}\n\n` +
    `¡Te esperamos! 😊`

  return sendText(clientPhone, message)
}

// ─── Notificación al dueño — nueva reserva ────────────────────────
async function notifyOwner({ ownerPhone, clientName, clientPhone, serviceName, startsAt }) {
  const date = new Date(startsAt)
  const dateStr = date.toLocaleDateString('es-MX', {
    weekday: 'short', month: 'short', day: 'numeric',
    timeZone: 'America/Mexico_City',
  })
  const timeStr = date.toLocaleTimeString('es-MX', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City',
  })

  const message =
    `📅 *Nueva cita agendada*\n\n` +
    `👤 *Cliente:* ${clientName}\n` +
    `📱 *Tel:* ${clientPhone}\n` +
    `📋 *Servicio:* ${serviceName}\n` +
    `🗓️ *Cuándo:* ${dateStr} a las ${timeStr}\n\n` +
    `_AgendaMX_`

  return sendText(ownerPhone, message)
}

// ─── Mensaje de seguimiento post-cita ────────────────────────────
async function sendFollowUp({ clientPhone, clientName, businessName, slug }) {
  const message =
    `⭐ *¿Cómo estuvo tu cita?*\n\n` +
    `Hola ${clientName}, esperamos que hayas quedado muy contento/a con tu servicio en *${businessName}*.\n\n` +
    `Si te gustó, ¡déjanos una reseña! Nos ayuda mucho 🙏\n\n` +
    `Y cuando quieras agendar tu próxima cita, ya sabes:\n` +
    `👉 https://agendamx.net/${slug}`

  return sendText(clientPhone, message)
}

module.exports = {
  sendText,
  sendConfirmation,
  sendReminder24h,
  sendReminder1h,
  notifyOwner,
  sendFollowUp,
  normalizePhone,
}
