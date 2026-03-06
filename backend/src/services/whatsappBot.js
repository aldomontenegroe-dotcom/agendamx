const db = require('../config/db')
const wa = require('./whatsappService')
const { logEvent } = require('./clientEvents')

// ─── Conversation State (in-memory, 30-min TTL) ─────────────────
const conversations = new Map()
const STATE_TTL = 30 * 60 * 1000

function getState(phone) {
  const s = conversations.get(phone)
  if (!s) return null
  if (Date.now() - s.timestamp > STATE_TTL) {
    conversations.delete(phone)
    return null
  }
  return s
}

function setState(phone, data) {
  conversations.set(phone, { ...data, timestamp: Date.now() })
}

function clearState(phone) {
  conversations.delete(phone)
}

// ─── Intent Detection ────────────────────────────────────────────
const INTENTS = [
  { id: 'CONFIRM',    words: ['sí', 'si', 'confirmar', 'confirmo'] },
  { id: 'CANCEL',     words: ['cancelar'] },
  { id: 'RESCHEDULE', words: ['reagendar', 'cambiar fecha'] },
  { id: 'BOOK',       words: ['cita', 'agendar', 'reservar', 'reserva', 'quiero cita'] },
  { id: 'PRICES',     words: ['precio', 'precios', 'costo', 'costos', 'cuánto', 'cuanto', 'tarifa', 'tarifas'] },
  { id: 'HOURS',      words: ['horario', 'horarios', 'abren', 'cierran', 'hora de', 'horas', 'cuando abren'] },
  { id: 'LOCATION',   words: ['ubicación', 'ubicacion', 'donde', 'dirección', 'direccion', 'llegar', 'mapa', 'dónde'] },
  { id: 'SERVICES',   words: ['servicios', 'servicio', 'qué hacen', 'que hacen', 'menú', 'menu', 'que ofrecen'] },
  { id: 'HUMAN',      words: ['humano', 'persona', 'hablar', 'ayuda', 'help', 'asesor'] },
  { id: 'GREET',      words: ['hola', 'buenas', 'buen día', 'buenos días', 'buena tarde', 'buenas noches', 'info', 'buenos dias', 'buen dia'] },
]

function detectIntent(text) {
  const lower = text.toLowerCase().trim()
  // Exact matches for short responses
  if (lower === '1' || lower === 'sí' || lower === 'si') return 'CONFIRM'
  if (lower === '2' || lower === 'no') return 'CANCEL'
  if (lower === '3') return 'RESCHEDULE'
  // Keyword search
  for (const intent of INTENTS) {
    if (intent.words.some(w => lower.includes(w))) return intent.id
  }
  return null
}

// ─── Tone by business type ───────────────────────────────────────
const FORMAL = ['dentista', 'medico', 'psicologo', 'nutriologo']
const CASUAL = ['barberia', 'salon-belleza', 'tatuador', 'fotografo', 'yoga-fitness', 'tutor']

function getTone(templateId) {
  if (FORMAL.includes(templateId)) return 'formal'
  if (CASUAL.includes(templateId)) return 'casual'
  return 'neutral'
}

function greetWord(tone) {
  if (tone === 'formal') return 'Estimado/a cliente'
  if (tone === 'casual') return '¡Hey!'
  return '¡Hola!'
}

// ─── Day names ───────────────────────────────────────────────────
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const EMOJIS_NUM = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
const MX_OFFSET = '-06:00' // Mexico City UTC offset (no DST since 2022)

// ─── Resolve business from slug ──────────────────────────────────
async function resolveBusinessBySlug(slug) {
  const result = await db.query(
    `SELECT id, name, slug, template_id, welcome_message, address, city, state
     FROM businesses WHERE slug = $1`,
    [slug]
  )
  return result.rows[0] || null
}

// ─── Detect slug in first message ────────────────────────────────
function detectSlug(text) {
  const lower = text.toLowerCase().trim()
  // Pattern: "Hola slug-del-negocio" or just "slug-del-negocio"
  const match = lower.match(/^(?:hola\s+|buenas?\s+|hey\s+)?([a-z0-9][-a-z0-9]+[a-z0-9])$/)
  if (match && match[1].includes('-')) return match[1]
  // Also check if the whole message is a slug (contains at least one hyphen)
  if (/^[a-z0-9][-a-z0-9]+[a-z0-9]$/.test(lower) && lower.includes('-')) return lower
  return null
}

// ─── Resolve which business this phone belongs to ────────────────
async function resolveBusiness(phone) {
  // 1. From most recent appointment
  const appt = await db.query(
    `SELECT b.id, b.name, b.slug, b.template_id, b.welcome_message, b.address, b.city, b.state
     FROM appointments a
     JOIN businesses b ON b.id = a.business_id
     WHERE a.client_phone = $1
     ORDER BY a.created_at DESC LIMIT 1`,
    [phone]
  )
  if (appt.rows.length) return appt.rows[0]

  // 2. From client record
  const client = await db.query(
    `SELECT b.id, b.name, b.slug, b.template_id, b.welcome_message, b.address, b.city, b.state
     FROM clients c
     JOIN businesses b ON b.id = c.business_id
     WHERE c.phone = $1
     ORDER BY c.created_at DESC LIMIT 1`,
    [phone]
  )
  if (client.rows.length) return client.rows[0]

  return null
}

// ─── Get pending appointment ─────────────────────────────────────
async function getPendingAppointment(phone) {
  const result = await db.query(
    `SELECT a.id, a.status, a.starts_at, a.client_name,
            b.id as business_id, b.name as business_name, b.slug, b.template_id,
            s.name as service_name
     FROM appointments a
     JOIN businesses b ON b.id = a.business_id
     JOIN services s ON s.id = a.service_id
     WHERE a.client_phone = $1
       AND a.status IN ('pending','confirmed')
       AND a.starts_at > NOW()
     ORDER BY a.starts_at ASC LIMIT 1`,
    [phone]
  )
  return result.rows[0] || null
}

// ═══════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════
async function handleMessage(phone, text, contactName, interactiveReply) {
  const state = getState(phone)
  const trimmed = text.trim()

  // ─── Handle interactive reply IDs ─────────────────────────────
  // Interactive replies come as IDs like "menu_cita", "svc_0", "date_2", etc.
  if (interactiveReply) {
    const replyId = interactiveReply.id

    // Menu selections from greet list
    if (replyId.startsWith('menu_')) {
      const menuMap = {
        menu_servicios: 'SERVICES', menu_precios: 'PRICES', menu_cita: 'BOOK',
        menu_horario: 'HOURS', menu_ubicacion: 'LOCATION', menu_humano: 'HUMAN',
        menu_confirmar: 'CONFIRM', menu_cancelar: 'CANCEL', menu_reagendar: 'RESCHEDULE',
      }
      const mappedIntent = menuMap[replyId]
      if (mappedIntent) {
        // Resolve business context and handle
        const pendingAppt = await getPendingAppointment(phone)
        let biz = state ? { id: state.businessId, name: state.businessName, slug: state.slug } : null
        if (!biz && pendingAppt) biz = { id: pendingAppt.business_id, name: pendingAppt.business_name, slug: pendingAppt.slug, template_id: pendingAppt.template_id }
        if (!biz) { const resolved = await resolveBusiness(phone); if (resolved) biz = resolved }
        if (!biz) return wa.sendText(phone, '¡Hola! No encontré tu negocio. Pide a tu negocio su link de AgendaMX.')
        if (!biz.template_id) {
          const full = await db.query('SELECT template_id, welcome_message, address, city, state FROM businesses WHERE id = $1', [biz.id])
          if (full.rows.length) Object.assign(biz, full.rows[0])
        }
        const tone = getTone(biz.template_id)
        setState(phone, { ...(state || {}), businessId: biz.id, businessName: biz.name, slug: biz.slug })

        switch (mappedIntent) {
          case 'CONFIRM': return handleConfirm(phone, pendingAppt, biz)
          case 'CANCEL': return handleCancel(phone, pendingAppt)
          case 'RESCHEDULE': return handleReschedule(phone, pendingAppt, biz)
          case 'BOOK': return startBooking(phone, biz, contactName)
          case 'PRICES': return handlePrices(phone, biz, tone)
          case 'HOURS': return handleHours(phone, biz, tone)
          case 'LOCATION': return handleLocation(phone, biz, tone)
          case 'SERVICES': return handleServices(phone, biz, tone)
          case 'HUMAN': return handleHuman(phone, biz, contactName)
        }
      }
    }

    // Booking flow interactive replies
    if (state && state.step && state.step.startsWith('BOOK_')) {
      if (replyId === 'cancel_booking') {
        clearState(phone)
        return wa.sendText(phone, '❌ Reserva cancelada. Escribe *CITA* cuando quieras intentar de nuevo.')
      }
      if (replyId === 'confirm_booking') {
        return handleBookingStep(phone, 'sí', state, contactName)
      }
      // Extract number from interactive IDs like "svc_2", "date_1", "time_5", "staff_0"
      const numMatch = replyId.match(/^(?:svc|date|time|staff)_(\d+)$/)
      if (numMatch) {
        return handleBookingStep(phone, String(parseInt(numMatch[1]) + 1), state, contactName)
      }
    }
  }

  const intent = detectIntent(text)

  // ─── If in a booking flow, handle step input first ───────────
  if (state && state.step && state.step.startsWith('BOOK_')) {
    // Allow cancellation mid-flow
    if (intent === 'CANCEL' || trimmed.toLowerCase() === 'cancelar' || trimmed.toLowerCase() === 'salir') {
      clearState(phone)
      return wa.sendText(phone, '❌ Reserva cancelada. Escribe *CITA* cuando quieras intentar de nuevo.')
    }
    return handleBookingStep(phone, trimmed, state, contactName)
  }

  // ─── Try to detect business slug from message ──────────────
  const detectedSlug = detectSlug(trimmed)
  if (detectedSlug) {
    const bizFromSlug = await resolveBusinessBySlug(detectedSlug)
    if (bizFromSlug) {
      setState(phone, { businessId: bizFromSlug.id, businessName: bizFromSlug.name, slug: bizFromSlug.slug })
      const tone = getTone(bizFromSlug.template_id)
      const pendingAppt = await getPendingAppointment(phone)
      return handleGreet(phone, bizFromSlug, tone, contactName, pendingAppt)
    }
  }

  // ─── Resolve business context ────────────────────────────────
  const pendingAppt = await getPendingAppointment(phone)
  let biz = state ? { id: state.businessId, name: state.businessName, slug: state.slug } : null

  if (!biz && pendingAppt) {
    biz = { id: pendingAppt.business_id, name: pendingAppt.business_name, slug: pendingAppt.slug, template_id: pendingAppt.template_id }
  }
  if (!biz) {
    const resolved = await resolveBusiness(phone)
    if (resolved) biz = resolved
  }

  // ─── No business context at all ──────────────────────────────
  if (!biz) {
    return wa.sendText(phone,
      `¡Hola! 👋\n\nSoy el asistente de *AgendaMX*.\n\n` +
      `Para agendar una cita, necesito saber con qué negocio deseas agendar.\n\n` +
      `📲 Pide a tu negocio su link de AgendaMX y toca el botón de WhatsApp desde ahí.`
    )
  }

  // Load full business data if we only have partial
  if (!biz.template_id) {
    const full = await db.query(
      'SELECT template_id, welcome_message, address, city, state FROM businesses WHERE id = $1',
      [biz.id]
    )
    if (full.rows.length) Object.assign(biz, full.rows[0])
  }

  const tone = getTone(biz.template_id)

  // Save business context in state
  setState(phone, { ...(state || {}), businessId: biz.id, businessName: biz.name, slug: biz.slug })

  // ─── Handle intents ──────────────────────────────────────────
  switch (intent) {
    case 'CONFIRM':
      return handleConfirm(phone, pendingAppt, biz)
    case 'CANCEL':
      return handleCancel(phone, pendingAppt)
    case 'RESCHEDULE':
      return handleReschedule(phone, pendingAppt, biz)
    case 'BOOK':
      return startBooking(phone, biz, contactName)
    case 'PRICES':
      return handlePrices(phone, biz, tone)
    case 'HOURS':
      return handleHours(phone, biz, tone)
    case 'LOCATION':
      return handleLocation(phone, biz, tone)
    case 'SERVICES':
      return handleServices(phone, biz, tone)
    case 'HUMAN':
      return handleHuman(phone, biz, contactName)
    case 'GREET':
      return handleGreet(phone, biz, tone, contactName, pendingAppt)
    default:
      return handleUnknown(phone, biz, tone, contactName, pendingAppt)
  }
}

// ═══════════════════════════════════════════════════════════════════
// INTENT HANDLERS
// ═══════════════════════════════════════════════════════════════════

async function handleGreet(phone, biz, tone, name, pendingAppt) {
  const greeting = biz.welcome_message || `${greetWord(tone)} ${name}! Bienvenido a *${biz.name}*.`

  let bodyText = greeting + '\n\n¿En qué te puedo ayudar?'

  if (pendingAppt) {
    const d = new Date(pendingAppt.starts_at)
    bodyText += `\n\n📌 Tienes una cita: *${pendingAppt.service_name}*\n`
    bodyText += `📅 ${d.toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long', timeZone:'America/Mexico_City' })} `
    bodyText += `a las ${d.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit', timeZone:'America/Mexico_City' })}`
  }

  const sections = [{
    title: 'Opciones',
    rows: [
      { id: 'menu_cita', title: '📅 Agendar cita', description: 'Reserva una cita ahora' },
      { id: 'menu_servicios', title: '📋 Servicios', description: 'Ver qué ofrecemos' },
      { id: 'menu_precios', title: '💰 Precios', description: 'Consultar tarifas' },
      { id: 'menu_horario', title: '🕐 Horario', description: 'Ver horarios de operación' },
      { id: 'menu_ubicacion', title: '📍 Ubicación', description: 'Cómo llegar' },
      { id: 'menu_humano', title: '👤 Hablar con alguien', description: 'Contactar al negocio' },
    ]
  }]

  // Add appointment actions if pending
  if (pendingAppt) {
    sections.push({
      title: 'Tu cita pendiente',
      rows: [
        { id: 'menu_confirmar', title: '✅ Confirmar cita', description: 'Confirmar tu reservación' },
        { id: 'menu_reagendar', title: '🔄 Reagendar', description: 'Cambiar fecha u hora' },
        { id: 'menu_cancelar', title: '❌ Cancelar cita', description: 'Cancelar tu reservación' },
      ]
    })
  }

  return wa.sendInteractiveList(phone, bodyText, 'Ver opciones', sections)
}

async function handlePrices(phone, biz, tone) {
  const result = await db.query(
    'SELECT name, icon, price, duration_min FROM services WHERE business_id = $1 AND is_active = true ORDER BY sort_order, name',
    [biz.id]
  )
  if (!result.rows.length) return wa.sendText(phone, 'No hay servicios disponibles por el momento.')

  let msg = `💰 *Precios de ${biz.name}:*\n\n`
  for (const s of result.rows) {
    msg += `${s.icon || '•'} *${s.name}* — $${s.price || '?'} MXN _(${s.duration_min}min)_\n`
  }
  msg += `\nPara agendar, escribe *CITA* 📅`
  return wa.sendText(phone, msg)
}

async function handleHours(phone, biz, tone) {
  const result = await db.query(
    'SELECT day_of_week, opens_at, closes_at, is_open FROM business_hours WHERE business_id = $1 ORDER BY day_of_week',
    [biz.id]
  )
  if (!result.rows.length) return wa.sendText(phone, 'Los horarios no están configurados aún. Contacta al negocio.')

  let msg = `🕐 *Horarios de ${biz.name}:*\n\n`
  for (const h of result.rows) {
    const day = DAYS[h.day_of_week]
    if (h.is_open) {
      msg += `${day}: ${h.opens_at.slice(0,5)} - ${h.closes_at.slice(0,5)}\n`
    } else {
      msg += `${day}: _Cerrado_\n`
    }
  }

  // Current status
  const now = new Date()
  const today = result.rows.find(h => h.day_of_week === now.getDay())
  if (today && today.is_open) {
    const currentTime = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Mexico_City' })
    if (currentTime >= today.opens_at.slice(0,5) && currentTime < today.closes_at.slice(0,5)) {
      msg += `\n✅ *Ahora mismo estamos ABIERTOS*`
    } else {
      msg += `\n🔴 Ahora mismo estamos cerrados`
    }
  } else {
    msg += `\n🔴 Hoy estamos cerrados`
  }

  return wa.sendText(phone, msg)
}

async function handleLocation(phone, biz, tone) {
  if (biz.address) {
    let msg = `📍 *${biz.name}*\n\n${biz.address}`
    if (biz.city) msg += `, ${biz.city}`
    if (biz.state) msg += `, ${biz.state}`
    msg += `\n\n¡Te esperamos!`
    return wa.sendText(phone, msg)
  }
  return wa.sendText(phone, `Contacta directamente a *${biz.name}* para obtener la dirección.`)
}

async function handleServices(phone, biz, tone) {
  const result = await db.query(
    'SELECT name, icon, duration_min, is_popular FROM services WHERE business_id = $1 AND is_active = true ORDER BY sort_order, name',
    [biz.id]
  )
  if (!result.rows.length) return wa.sendText(phone, 'No hay servicios disponibles por el momento.')

  let msg = `📋 *Servicios de ${biz.name}:*\n\n`
  for (const s of result.rows) {
    msg += `${s.icon || '•'} *${s.name}* _(${s.duration_min}min)_`
    if (s.is_popular) msg += ` ⭐`
    msg += `\n`
  }
  msg += `\nEscribe *PRECIOS* para ver costos o *CITA* para agendar 📅`
  return wa.sendText(phone, msg)
}

async function handleHuman(phone, biz, contactName) {
  const owner = await db.query(
    'SELECT phone, name FROM users WHERE business_id = $1 AND role = $2',
    [biz.id, 'owner']
  )
  if (owner.rows[0]?.phone) {
    await wa.sendText(phone,
      `👤 Te comunicaremos con *${owner.rows[0].name}* de ${biz.name}.\n\n` +
      `En un momento te contactan. ¡Gracias por tu paciencia!`
    )
    await wa.sendText(owner.rows[0].phone,
      `👤 *Solicitud de contacto*\n\n` +
      `${contactName || 'Un cliente'} (${phone}) quiere hablar contigo.\n` +
      `Escríbele directamente a este número.`
    )
    return
  }
  return wa.sendText(phone, `Por favor contacta directamente a *${biz.name}* para hablar con alguien.`)
}

async function handleConfirm(phone, pendingAppt, biz) {
  if (!pendingAppt) return wa.sendText(phone, 'No tienes citas pendientes por confirmar.')
  await db.query("UPDATE appointments SET status = 'confirmed' WHERE id = $1", [pendingAppt.id])
  const apptData = await db.query('SELECT client_id, business_id FROM appointments WHERE id = $1', [pendingAppt.id])
  if (apptData.rows[0]?.client_id) {
    logEvent({ businessId: apptData.rows[0].business_id, clientId: apptData.rows[0].client_id, appointmentId: pendingAppt.id, eventType: 'confirmed', description: 'Cita confirmada via WhatsApp', channel: 'whatsapp' })
  }
  const d = new Date(pendingAppt.starts_at)
  return wa.sendText(phone,
    `✅ *¡Cita confirmada!*\n\n` +
    `Te esperamos el ${d.toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long', timeZone:'America/Mexico_City' })} ` +
    `a las ${d.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit', timeZone:'America/Mexico_City' })} ` +
    `en *${biz.name}* 😊`
  )
}

async function handleCancel(phone, pendingAppt) {
  if (!pendingAppt) return wa.sendText(phone, 'No tienes citas pendientes para cancelar.')
  await db.query("UPDATE appointments SET status = 'cancelled' WHERE id = $1", [pendingAppt.id])
  const apptData = await db.query('SELECT client_id, business_id FROM appointments WHERE id = $1', [pendingAppt.id])
  if (apptData.rows[0]?.client_id) {
    logEvent({ businessId: apptData.rows[0].business_id, clientId: apptData.rows[0].client_id, appointmentId: pendingAppt.id, eventType: 'cancelled', description: 'Cita cancelada via WhatsApp', channel: 'whatsapp' })
  }
  return wa.sendText(phone,
    `😔 Entendido, tu cita ha sido cancelada.\n\n` +
    `Cuando quieras reagendar, escribe *CITA*. ¡Hasta pronto!`
  )
}

async function handleReschedule(phone, pendingAppt, biz) {
  if (pendingAppt) {
    await db.query("UPDATE appointments SET status = 'cancelled' WHERE id = $1", [pendingAppt.id])
    const apptData = await db.query('SELECT client_id, business_id FROM appointments WHERE id = $1', [pendingAppt.id])
    if (apptData.rows[0]?.client_id) {
      logEvent({ businessId: apptData.rows[0].business_id, clientId: apptData.rows[0].client_id, appointmentId: pendingAppt.id, eventType: 'rescheduled', description: 'Cita reagendada via WhatsApp', channel: 'whatsapp' })
    }
  }
  return wa.sendText(phone,
    `📅 Para reagendar, usa este link:\n\n` +
    `👉 ${process.env.PUBLIC_BOOKING_URL || 'https://agendamx.net'}/${biz.slug}\n\n` +
    `O escribe *CITA* para agendar desde aquí.`
  )
}

async function handleUnknown(phone, biz, tone, name, pendingAppt) {
  let bodyText = `${greetWord(tone)} ${name} 👋\n\nNo entendí tu mensaje.`

  if (pendingAppt) {
    const d = new Date(pendingAppt.starts_at)
    bodyText = `${greetWord(tone)} ${name} 👋\n\n`
    bodyText += `Tienes una cita: *${pendingAppt.service_name}*\n`
    bodyText += `📅 ${d.toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long', timeZone:'America/Mexico_City' })} `
    bodyText += `a las ${d.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit', timeZone:'America/Mexico_City' })}`
  }

  const sections = [{
    title: 'Opciones',
    rows: [
      { id: 'menu_cita', title: '📅 Agendar cita' },
      { id: 'menu_precios', title: '💰 Precios' },
      { id: 'menu_horario', title: '🕐 Horarios' },
      { id: 'menu_servicios', title: '📋 Servicios' },
      { id: 'menu_ubicacion', title: '📍 Ubicación' },
      { id: 'menu_humano', title: '👤 Hablar con alguien' },
    ]
  }]

  if (pendingAppt) {
    sections.push({
      title: 'Tu cita',
      rows: [
        { id: 'menu_confirmar', title: '✅ Confirmar' },
        { id: 'menu_cancelar', title: '❌ Cancelar' },
        { id: 'menu_reagendar', title: '🔄 Reagendar' },
      ]
    })
  }

  return wa.sendInteractiveList(phone, bodyText, 'Ver opciones', sections)
}

// ═══════════════════════════════════════════════════════════════════
// BOOKING FLOW
// ═══════════════════════════════════════════════════════════════════

async function startBooking(phone, biz, contactName) {
  const services = await db.query(
    'SELECT id, name, icon, price, duration_min FROM services WHERE business_id = $1 AND is_active = true ORDER BY sort_order, name',
    [biz.id]
  )
  if (!services.rows.length) return wa.sendText(phone, 'No hay servicios disponibles en este momento.')

  // Fetch staff members
  const staffResult = await db.query(
    `SELECT id, name FROM users WHERE business_id = $1 AND is_active = true AND role IN ('owner','staff') ORDER BY role DESC, name`,
    [biz.id]
  )

  // Check if we know this client
  const client = await db.query(
    'SELECT name FROM clients WHERE business_id = $1 AND phone = $2',
    [biz.id, phone]
  )

  setState(phone, {
    step: 'BOOK_SELECT_SERVICE',
    businessId: biz.id, businessName: biz.name, slug: biz.slug,
    services: services.rows,
    staffMembers: staffResult.rows,
    clientName: client.rows[0]?.name || contactName || null,
  })

  const bodyText = `📅 *Agendar cita en ${biz.name}*\n\n¿Qué servicio necesitas?`
  const rows = services.rows.slice(0, 10).map((s, i) => ({
    id: `svc_${i}`,
    title: `${s.icon || ''} ${s.name}`.substring(0, 24),
    description: `${s.duration_min}min${s.price ? ` · $${s.price}` : ''}`,
  }))

  return wa.sendInteractiveList(phone, bodyText, 'Ver servicios', [{ title: 'Servicios', rows }])
}

// ─── Helper: generate date selection menu ──────────────────────
async function sendDateSelection(phone, state) {
  const hours = await db.query(
    'SELECT day_of_week, opens_at, closes_at, is_open FROM business_hours WHERE business_id = $1',
    [state.businessId]
  )
  const hoursMap = {}
  for (const h of hours.rows) hoursMap[h.day_of_week] = h

  const dates = []
  // Use Mexico City date to avoid UTC midnight edge cases
  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
  const todayBase = new Date(todayStr + 'T12:00:00Z') // Noon UTC avoids day boundary issues
  for (let i = 0; dates.length < 5 && i < 14; i++) {
    const d = new Date(todayBase.getTime() + i * 86400000)
    const dow = d.getUTCDay()
    if (hoursMap[dow] && hoursMap[dow].is_open) {
      dates.push({
        date: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Mexico_City' }),
        label: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : null,
      })
    }
  }

  if (!dates.length) return wa.sendText(phone, 'No hay días disponibles próximamente. Contacta al negocio.')

  setState(phone, {
    ...state,
    step: 'BOOK_SELECT_DATE',
    dates,
  })

  const bodyText = `📅 *${state.serviceName}*${state.staffName ? ` con ${state.staffName}` : ''}\n\n¿Qué día prefieres?`
  const rows = dates.map((d, i) => ({
    id: `date_${i}`,
    title: d.label ? `${d.label} (${d.dayName})` : d.dayName,
  }))

  return wa.sendInteractiveList(phone, bodyText, 'Ver fechas', [{ title: 'Fechas disponibles', rows }])
}

async function handleBookingStep(phone, text, state, contactName) {
  const num = parseInt(text, 10)

  switch (state.step) {
    case 'BOOK_SELECT_SERVICE': {
      if (isNaN(num) || num < 1 || num > state.services.length) {
        return wa.sendText(phone, `Por favor responde con un número del 1 al ${state.services.length}.`)
      }
      const service = state.services[num - 1]

      const updatedState = {
        ...state,
        serviceId: service.id, serviceName: service.name, serviceDuration: service.duration_min, servicePrice: service.price,
      }

      // If multiple staff, show staff selection
      if (state.staffMembers && state.staffMembers.length > 1) {
        setState(phone, {
          ...updatedState,
          step: 'BOOK_SELECT_STAFF',
        })

        const bodyText = `👤 *${service.name}*\n\n¿Con quién deseas tu cita?`
        const staffRows = [
          { id: 'staff_0', title: 'Cualquier disponible', description: 'El primero libre' },
          ...state.staffMembers.map((s, i) => ({
            id: `staff_${i + 1}`,
            title: s.name.substring(0, 24),
          }))
        ]

        return wa.sendInteractiveList(phone, bodyText, 'Ver profesionales', [{ title: 'Profesionales', rows: staffRows }])
      }

      // Single or no staff: skip staff selection
      const singleStaff = (state.staffMembers && state.staffMembers.length === 1) ? state.staffMembers[0] : null
      setState(phone, {
        ...updatedState,
        staffId: singleStaff ? singleStaff.id : null,
        staffName: singleStaff ? singleStaff.name : null,
      })

      return sendDateSelection(phone, {
        ...updatedState,
        staffId: singleStaff ? singleStaff.id : null,
        staffName: singleStaff ? singleStaff.name : null,
      })
    }

    case 'BOOK_SELECT_STAFF': {
      const maxOption = state.staffMembers.length + 1 // +1 for "Cualquier disponible"
      if (isNaN(num) || num < 1 || num > maxOption) {
        return wa.sendText(phone, `Por favor responde con un número del 1 al ${maxOption}.`)
      }

      let staffId = null
      let staffName = null
      if (num === 1) {
        // "Cualquier disponible"
        staffId = null
        staffName = null
      } else {
        const selectedStaff = state.staffMembers[num - 2]
        staffId = selectedStaff.id
        staffName = selectedStaff.name
      }

      const updatedState = { ...state, staffId, staffName }
      setState(phone, updatedState)

      return sendDateSelection(phone, updatedState)
    }

    case 'BOOK_SELECT_DATE': {
      if (isNaN(num) || num < 1 || num > state.dates.length) {
        return wa.sendText(phone, `Por favor responde con un número del 1 al ${state.dates.length}.`)
      }
      const selectedDate = state.dates[num - 1]

      // Generate available slots (same logic as appointmentsController.availability)
      const dayOfWeek = new Date(selectedDate.date).getDay()
      const hours = await db.query(
        'SELECT opens_at, closes_at FROM business_hours WHERE business_id = $1 AND day_of_week = $2 AND is_open = true',
        [state.businessId, dayOfWeek]
      )
      if (!hours.rows.length) return wa.sendText(phone, 'Ese día está cerrado. Elige otro.')

      const { opens_at, closes_at } = hours.rows[0]
      const [oh, om] = opens_at.split(':').map(Number)
      const [ch, cm] = closes_at.split(':').map(Number)
      const openMin = oh * 60 + om
      const closeMin = ch * 60 + cm
      const duration = state.serviceDuration

      // Get existing appointments (include staff_id for multi-staff availability)
      let existingQuery = `SELECT starts_at, ends_at, staff_id FROM appointments
         WHERE business_id = $1 AND status NOT IN ('cancelled')
           AND DATE(starts_at AT TIME ZONE 'America/Mexico_City') = $2`
      const existingParams = [state.businessId, selectedDate.date]
      if (state.staffId) {
        existingQuery += ` AND staff_id = $3`
        existingParams.push(state.staffId)
      }
      const existing = await db.query(existingQuery, existingParams)

      const slots = []
      const now = new Date()
      const multiStaff = !state.staffId && state.staffMembers && state.staffMembers.length > 1
      for (let m = openMin; m + duration <= closeMin; m += 30) {
        const h = Math.floor(m / 60)
        const min = m % 60
        const timeStr = `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`
        const slotStart = new Date(`${selectedDate.date}T${timeStr}:00${MX_OFFSET}`)
        const slotEnd = new Date(slotStart.getTime() + duration * 60000)

        // Skip past slots
        if (slotStart <= now) continue

        if (multiStaff) {
          // "Any available": slot is open if at least one staff member is free
          const hasAvailable = state.staffMembers.some(staff => {
            return !existing.rows.some(a => {
              if (a.staff_id !== staff.id) return false
              const aStart = new Date(a.starts_at)
              const aEnd = new Date(a.ends_at)
              return slotStart < aEnd && slotEnd > aStart
            })
          })
          if (hasAvailable) slots.push(timeStr)
        } else {
          // Specific staff or single staff
          const busy = existing.rows.some(a => {
            const aStart = new Date(a.starts_at)
            const aEnd = new Date(a.ends_at)
            return slotStart < aEnd && slotEnd > aStart
          })
          if (!busy) slots.push(timeStr)
        }
      }

      if (!slots.length) {
        return wa.sendText(phone,
          `😕 No hay horarios disponibles para ${selectedDate.dayName}.\n\n` +
          `Elige otro día (responde con el número) o escribe *CANCELAR*.`
        )
      }

      // Show max 10 slots (WhatsApp list limit)
      const displaySlots = slots.slice(0, 10)

      setState(phone, {
        ...state,
        step: 'BOOK_SELECT_TIME',
        date: selectedDate.date, dateLabel: selectedDate.dayName,
        slots: displaySlots,
      })

      const bodyText = `🕐 *Horarios para ${selectedDate.dayName}*\n\n${state.serviceName}${state.staffName ? ` con ${state.staffName}` : ''}`
      const rows = displaySlots.map((s, i) => ({
        id: `time_${i}`,
        title: s,
      }))

      return wa.sendInteractiveList(phone, bodyText, 'Ver horarios', [{ title: 'Horarios disponibles', rows }])
    }

    case 'BOOK_SELECT_TIME': {
      if (isNaN(num) || num < 1 || num > state.slots.length) {
        return wa.sendText(phone, `Por favor responde con un número del 1 al ${state.slots.length}.`)
      }
      const selectedTime = state.slots[num - 1]

      // If we know the client name, skip to confirm
      if (state.clientName) {
        const startsAt = `${state.date}T${selectedTime}:00${MX_OFFSET}`
        const d = new Date(startsAt)
        const dateStr = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Mexico_City' })

        setState(phone, { ...state, step: 'BOOK_FINAL_CONFIRM', time: selectedTime, startsAt })

        const summaryText =
          `📋 *Resumen de tu cita:*\n\n` +
          `📌 *Servicio:* ${state.serviceName}\n` +
          (state.staffName ? `✂️ *Con:* ${state.staffName}\n` : '') +
          `📅 *Fecha:* ${dateStr}\n` +
          `🕐 *Hora:* ${selectedTime}\n` +
          `👤 *Nombre:* ${state.clientName}\n` +
          (state.servicePrice ? `💰 *Precio:* $${state.servicePrice} MXN` : '')

        return wa.sendInteractiveButtons(phone, summaryText, [
          { id: 'confirm_booking', title: '✅ Confirmar' },
          { id: 'cancel_booking', title: '❌ Cancelar' },
        ])
      }

      // Ask for name
      setState(phone, { ...state, step: 'BOOK_ASK_NAME', time: selectedTime })
      return wa.sendText(phone, `👤 ¿A qué nombre agendamos la cita?`)
    }

    case 'BOOK_ASK_NAME': {
      const name = text.trim()
      if (name.length < 2) return wa.sendText(phone, 'Por favor escribe tu nombre completo.')

      const startsAt = `${state.date}T${state.time}:00${MX_OFFSET}`
      const d = new Date(startsAt)
      const dateStr = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Mexico_City' })

      setState(phone, { ...state, step: 'BOOK_FINAL_CONFIRM', clientName: name, startsAt })

      const summaryText =
        `📋 *Resumen de tu cita:*\n\n` +
        `📌 *Servicio:* ${state.serviceName}\n` +
        (state.staffName ? `✂️ *Con:* ${state.staffName}\n` : '') +
        `📅 *Fecha:* ${dateStr}\n` +
        `🕐 *Hora:* ${state.time}\n` +
        `👤 *Nombre:* ${name}\n` +
        (state.servicePrice ? `💰 *Precio:* $${state.servicePrice} MXN` : '')

      return wa.sendInteractiveButtons(phone, summaryText, [
        { id: 'confirm_booking', title: '✅ Confirmar' },
        { id: 'cancel_booking', title: '❌ Cancelar' },
      ])
    }

    case 'BOOK_FINAL_CONFIRM': {
      const lower = text.toLowerCase().trim()
      if (lower === 'no' || lower === 'cancelar') {
        clearState(phone)
        return wa.sendText(phone, '❌ Reserva cancelada. Escribe *CITA* cuando quieras intentar de nuevo.')
      }
      if (lower !== 'sí' && lower !== 'si' && lower !== '1' && lower !== 'confirmar') {
        return wa.sendText(phone, 'Responde *SÍ* para confirmar o *NO* para cancelar.')
      }

      // ─── Execute booking transaction ───────────────────────
      const txn = await db.pool.connect()
      try {
        await txn.query('BEGIN')

        const svc = await txn.query(
          'SELECT id, name, duration_min, price FROM services WHERE id = $1 AND business_id = $2 AND is_active = true',
          [state.serviceId, state.businessId]
        )
        if (!svc.rows.length) {
          await txn.query('ROLLBACK')
          clearState(phone)
          return wa.sendText(phone, '⚠️ Ese servicio ya no está disponible. Escribe *CITA* para intentar de nuevo.')
        }
        const service = svc.rows[0]
        const endsAt = new Date(new Date(state.startsAt).getTime() + service.duration_min * 60000)

        // Check availability with lock + auto-assign staff if "any available"
        let assignedStaffId = state.staffId
        let assignedStaffName = state.staffName

        if (!assignedStaffId && state.staffMembers && state.staffMembers.length > 0) {
          // "Any available": find the first free staff member
          const busyStaff = await txn.query(
            `SELECT DISTINCT staff_id FROM appointments
             WHERE business_id = $1 AND status NOT IN ('cancelled')
               AND tstzrange(starts_at, ends_at) && tstzrange($2::timestamptz, $3::timestamptz)
             FOR UPDATE`,
            [state.businessId, state.startsAt, endsAt.toISOString()]
          )
          const busyIds = new Set(busyStaff.rows.map(r => r.staff_id))
          const freeStaff = state.staffMembers.find(s => !busyIds.has(s.id))
          if (!freeStaff) {
            await txn.query('ROLLBACK')
            clearState(phone)
            return wa.sendText(phone, '😕 Ese horario ya fue tomado. Escribe *CITA* para elegir otro.')
          }
          assignedStaffId = freeStaff.id
          assignedStaffName = freeStaff.name
        } else {
          // Specific staff selected: check conflict directly
          let conflictQuery = `SELECT id FROM appointments
             WHERE business_id = $1 AND status NOT IN ('cancelled')
               AND tstzrange(starts_at, ends_at) && tstzrange($2::timestamptz, $3::timestamptz)`
          const conflictParams = [state.businessId, state.startsAt, endsAt.toISOString()]
          if (assignedStaffId) {
            conflictQuery += ` AND staff_id = $4`
            conflictParams.push(assignedStaffId)
          }
          conflictQuery += ` FOR UPDATE`
          const conflict = await txn.query(conflictQuery, conflictParams)
          if (conflict.rows.length) {
            await txn.query('ROLLBACK')
            clearState(phone)
            return wa.sendText(phone, '😕 Ese horario ya fue tomado. Escribe *CITA* para elegir otro.')
          }
        }

        // Create or find client
        let client = await txn.query(
          'SELECT id FROM clients WHERE business_id = $1 AND phone = $2',
          [state.businessId, phone]
        )
        if (!client.rows.length) {
          client = await txn.query(
            'INSERT INTO clients (business_id, name, phone) VALUES ($1,$2,$3) RETURNING id',
            [state.businessId, state.clientName, phone]
          )
        }

        // Create appointment
        const apptResult = await txn.query(
          `INSERT INTO appointments
             (business_id, service_id, client_id, staff_id, starts_at, ends_at,
              client_name, client_phone, price, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
           RETURNING id`,
          [state.businessId, state.serviceId, client.rows[0].id, assignedStaffId || null,
           state.startsAt, endsAt.toISOString(),
           state.clientName, phone, service.price]
        )
        await txn.query('COMMIT')

        // Log event
        logEvent({ businessId: state.businessId, clientId: client.rows[0].id, appointmentId: apptResult.rows[0].id, eventType: 'booked', description: `Cita agendada via WhatsApp: ${service.name}`, channel: 'whatsapp' })

        clearState(phone)

        // Check if business accepts payments and generate payment link
        const bizPayment = await db.query(
          'SELECT accept_payments, payment_mode, deposit_percentage FROM businesses WHERE id = $1',
          [state.businessId]
        )
        const paymentConfig = bizPayment.rows[0]
        let paymentUrl = null

        if (paymentConfig?.accept_payments && service.price > 0) {
          try {
            const paymentService = require('./paymentService')
            const result = await paymentService.generatePaymentLink({
              appointmentId: apptResult.rows[0].id,
              businessId: state.businessId,
              amount: service.price,
              paymentMode: paymentConfig.payment_mode,
              depositPercentage: paymentConfig.deposit_percentage,
              serviceName: service.name,
              clientName: state.clientName,
              clientPhone: phone,
            })
            paymentUrl = result?.url || null
          } catch (e) {
            console.error('WA payment link error:', e)
          }
        }

        // Send confirmation (with payment link if available)
        wa.sendConfirmation({
          clientPhone: phone, clientName: state.clientName, businessName: state.businessName,
          serviceName: service.name, startsAt: state.startsAt, price: service.price, slug: state.slug,
          staffName: assignedStaffName, paymentUrl,
        }).catch(e => console.error('WA confirm error:', e))

        // Notify owner
        db.query('SELECT phone FROM users WHERE business_id = $1 AND role = $2', [state.businessId, 'owner'])
          .then(r => r.rows[0]?.phone && wa.notifyOwner({
            ownerPhone: r.rows[0].phone, clientName: state.clientName, clientPhone: phone,
            serviceName: service.name, startsAt: state.startsAt,
          })).catch(e => console.error('WA owner error:', e))

        // Email notifications (fire-and-forget)
        try {
          const emailService = require('./emailService')
          db.query('SELECT email FROM clients WHERE id = $1', [client.rows[0].id])
            .then(r => r.rows[0]?.email && emailService.sendAppointmentConfirmation(r.rows[0].email, {
              clientName: state.clientName, businessName: state.businessName,
              serviceName: service.name, startsAt: state.startsAt, price: service.price, slug: state.slug,
            })).catch(() => {})
          db.query('SELECT email FROM users WHERE business_id = $1 AND role = $2', [state.businessId, 'owner'])
            .then(r => r.rows[0]?.email && emailService.sendOwnerNotification(r.rows[0].email, {
              clientName: state.clientName, clientPhone: phone,
              serviceName: service.name, startsAt: state.startsAt,
            })).catch(() => {})
        } catch (e) { /* emailService may not exist */ }

        return // Confirmation message already sent via sendConfirmation

      } catch (err) {
        await txn.query('ROLLBACK').catch(() => {})
        clearState(phone)
        console.error('WA booking error:', err)
        return wa.sendText(phone, '⚠️ Hubo un error al agendar. Por favor intenta de nuevo escribiendo *CITA*.')
      } finally {
        txn.release()
      }
    }

    default:
      clearState(phone)
      return wa.sendText(phone, 'Algo salió mal. Escribe *HOLA* para empezar de nuevo.')
  }
}

module.exports = { handleMessage }
