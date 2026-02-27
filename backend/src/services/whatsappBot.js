const db = require('../config/db')
const wa = require('./whatsappService')

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
async function handleMessage(phone, text, contactName) {
  const state = getState(phone)
  const intent = detectIntent(text)
  const trimmed = text.trim()

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
  let msg = `${greeting}\n\n¿En qué te puedo ayudar?\n\n`
  msg += `📋 *SERVICIOS* — Ver qué ofrecemos\n`
  msg += `💰 *PRECIOS* — Consultar tarifas\n`
  msg += `📅 *CITA* — Agendar una cita\n`
  msg += `🕐 *HORARIO* — Ver horarios\n`
  msg += `📍 *UBICACIÓN* — Cómo llegar\n`
  msg += `👤 *HUMANO* — Hablar con alguien\n`

  if (pendingAppt) {
    const d = new Date(pendingAppt.starts_at)
    msg += `\n━━━━━━━━━━━━━━━━━━\n`
    msg += `📌 Tienes una cita: *${pendingAppt.service_name}*\n`
    msg += `📅 ${d.toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long', timeZone:'America/Mexico_City' })} `
    msg += `a las ${d.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit', timeZone:'America/Mexico_City' })}\n`
    msg += `Responde *SÍ* para confirmar o *NO* para cancelar.`
  }

  return wa.sendText(phone, msg)
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
  return wa.sendText(phone,
    `😔 Entendido, tu cita ha sido cancelada.\n\n` +
    `Cuando quieras reagendar, escribe *CITA*. ¡Hasta pronto!`
  )
}

async function handleReschedule(phone, pendingAppt, biz) {
  if (pendingAppt) {
    await db.query("UPDATE appointments SET status = 'cancelled' WHERE id = $1", [pendingAppt.id])
  }
  return wa.sendText(phone,
    `📅 Para reagendar, usa este link:\n\n` +
    `👉 ${process.env.PUBLIC_BOOKING_URL || 'https://agendamx.net'}/${biz.slug}\n\n` +
    `O escribe *CITA* para agendar desde aquí.`
  )
}

async function handleUnknown(phone, biz, tone, name, pendingAppt) {
  if (pendingAppt) {
    const d = new Date(pendingAppt.starts_at)
    return wa.sendText(phone,
      `${greetWord(tone)} ${name} 👋\n\n` +
      `Tienes una cita: *${pendingAppt.service_name}*\n` +
      `📅 ${d.toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long', timeZone:'America/Mexico_City' })} ` +
      `a las ${d.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit', timeZone:'America/Mexico_City' })}\n\n` +
      `Responde *SÍ* para confirmar o *NO* para cancelar.\n\n` +
      `Otros comandos: CITA · PRECIOS · HORARIO · SERVICIOS · UBICACIÓN · HUMANO`
    )
  }
  return wa.sendText(phone,
    `${greetWord(tone)} ${name} 👋\n\n` +
    `No entendí tu mensaje. Prueba con:\n\n` +
    `📅 *CITA* — Agendar\n💰 *PRECIOS* — Tarifas\n🕐 *HORARIO* — Horarios\n📋 *SERVICIOS* — Qué ofrecemos\n📍 *UBICACIÓN* — Dirección\n👤 *HUMANO* — Hablar con alguien`
  )
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

  let msg = `📅 *Agendar cita en ${biz.name}*\n\n¿Qué servicio necesitas? Responde con el *número*:\n\n`
  services.rows.forEach((s, i) => {
    msg += `${EMOJIS_NUM[i] || (i+1)+'.'} ${s.icon || ''} ${s.name}`
    if (s.price) msg += ` — $${s.price}`
    msg += `\n`
  })
  msg += `\n_Escribe *CANCELAR* para salir_`

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

  return wa.sendText(phone, msg)
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
  const today = new Date()
  for (let i = 0; dates.length < 5 && i < 14; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const dow = d.getDay()
    if (hoursMap[dow] && hoursMap[dow].is_open) {
      dates.push({
        date: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'America/Mexico_City' }),
        label: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : null,
      })
    }
  }

  if (!dates.length) return wa.sendText(phone, 'No hay días disponibles próximamente. Contacta al negocio.')

  let msg = `📅 *${state.serviceName}* — ¿Qué día?\n\n`
  dates.forEach((d, i) => {
    msg += `${EMOJIS_NUM[i]} ${d.label ? d.label + ' (' + d.dayName + ')' : d.dayName}\n`
  })
  msg += `\n_Escribe *CANCELAR* para salir_`

  setState(phone, {
    ...state,
    step: 'BOOK_SELECT_DATE',
    dates,
  })

  return wa.sendText(phone, msg)
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
        let msg = `👤 *${service.name}* — ¿Con quién deseas tu cita?\n\n`
        msg += `${EMOJIS_NUM[0]} Cualquier disponible\n`
        state.staffMembers.forEach((s, i) => {
          msg += `${EMOJIS_NUM[i + 1]} ${s.name}\n`
        })
        msg += `\n_Escribe *CANCELAR* para salir_`

        setState(phone, {
          ...updatedState,
          step: 'BOOK_SELECT_STAFF',
        })

        return wa.sendText(phone, msg)
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

      // Get existing appointments (filter by staff if selected)
      let existingQuery = `SELECT starts_at, ends_at FROM appointments
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
      for (let m = openMin; m + duration <= closeMin; m += 30) {
        const h = Math.floor(m / 60)
        const min = m % 60
        const timeStr = `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`
        const slotStart = new Date(`${selectedDate.date}T${timeStr}:00`)
        const slotEnd = new Date(slotStart.getTime() + duration * 60000)

        // Skip past slots
        if (slotStart <= now) continue

        // Check conflicts
        const busy = existing.rows.some(a => {
          const aStart = new Date(a.starts_at)
          const aEnd = new Date(a.ends_at)
          return slotStart < aEnd && slotEnd > aStart
        })
        if (!busy) slots.push(timeStr)
      }

      if (!slots.length) {
        return wa.sendText(phone,
          `😕 No hay horarios disponibles para ${selectedDate.dayName}.\n\n` +
          `Elige otro día (responde con el número) o escribe *CANCELAR*.`
        )
      }

      // Show max 10 slots
      const displaySlots = slots.slice(0, 10)
      let msg = `🕐 *Horarios disponibles para ${selectedDate.dayName}:*\n\n`
      displaySlots.forEach((s, i) => {
        msg += `${EMOJIS_NUM[i]} ${s}\n`
      })
      if (slots.length > 10) msg += `\n_(y ${slots.length - 10} más)_\n`
      msg += `\n_Escribe *CANCELAR* para salir_`

      setState(phone, {
        ...state,
        step: 'BOOK_SELECT_TIME',
        date: selectedDate.date, dateLabel: selectedDate.dayName,
        slots: displaySlots,
      })

      return wa.sendText(phone, msg)
    }

    case 'BOOK_SELECT_TIME': {
      if (isNaN(num) || num < 1 || num > state.slots.length) {
        return wa.sendText(phone, `Por favor responde con un número del 1 al ${state.slots.length}.`)
      }
      const selectedTime = state.slots[num - 1]

      // If we know the client name, skip to confirm
      if (state.clientName) {
        const startsAt = `${state.date}T${selectedTime}:00`
        const d = new Date(startsAt)
        const dateStr = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Mexico_City' })

        setState(phone, { ...state, step: 'BOOK_FINAL_CONFIRM', time: selectedTime, startsAt })

        return wa.sendText(phone,
          `📋 *Resumen de tu cita:*\n\n` +
          `📌 *Servicio:* ${state.serviceName}\n` +
          (state.staffName ? `✂️ *Con:* ${state.staffName}\n` : '') +
          `📅 *Fecha:* ${dateStr}\n` +
          `🕐 *Hora:* ${selectedTime}\n` +
          `👤 *Nombre:* ${state.clientName}\n` +
          (state.servicePrice ? `💰 *Precio:* $${state.servicePrice} MXN\n` : '') +
          `\n¿Confirmas tu cita? Responde *SÍ* para agendar o *NO* para cancelar.`
        )
      }

      // Ask for name
      setState(phone, { ...state, step: 'BOOK_ASK_NAME', time: selectedTime })
      return wa.sendText(phone, `👤 ¿A qué nombre agendamos la cita?`)
    }

    case 'BOOK_ASK_NAME': {
      const name = text.trim()
      if (name.length < 2) return wa.sendText(phone, 'Por favor escribe tu nombre completo.')

      const startsAt = `${state.date}T${state.time}:00`
      const d = new Date(startsAt)
      const dateStr = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Mexico_City' })

      setState(phone, { ...state, step: 'BOOK_FINAL_CONFIRM', clientName: name, startsAt })

      return wa.sendText(phone,
        `📋 *Resumen de tu cita:*\n\n` +
        `📌 *Servicio:* ${state.serviceName}\n` +
        (state.staffName ? `✂️ *Con:* ${state.staffName}\n` : '') +
        `📅 *Fecha:* ${dateStr}\n` +
        `🕐 *Hora:* ${state.time}\n` +
        `👤 *Nombre:* ${name}\n` +
        (state.servicePrice ? `💰 *Precio:* $${state.servicePrice} MXN\n` : '') +
        `\n¿Confirmas tu cita? Responde *SÍ* para agendar o *NO* para cancelar.`
      )
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

        // Check availability with lock (staff-aware)
        let conflictQuery = `SELECT id FROM appointments
           WHERE business_id = $1 AND status NOT IN ('cancelled')
             AND tsrange(starts_at, ends_at) && tsrange($2::timestamptz, $3::timestamptz)`
        const conflictParams = [state.businessId, state.startsAt, endsAt.toISOString()]
        if (state.staffId) {
          conflictQuery += ` AND staff_id = $4`
          conflictParams.push(state.staffId)
        }
        conflictQuery += ` FOR UPDATE`
        const conflict = await txn.query(conflictQuery, conflictParams)
        if (conflict.rows.length) {
          await txn.query('ROLLBACK')
          clearState(phone)
          return wa.sendText(phone, '😕 Ese horario ya fue tomado. Escribe *CITA* para elegir otro.')
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
        await txn.query(
          `INSERT INTO appointments
             (business_id, service_id, client_id, staff_id, starts_at, ends_at,
              client_name, client_phone, price, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')`,
          [state.businessId, state.serviceId, client.rows[0].id, state.staffId || null,
           state.startsAt, endsAt.toISOString(),
           state.clientName, phone, service.price]
        )
        await txn.query('COMMIT')

        clearState(phone)

        // Send confirmation
        wa.sendConfirmation({
          clientPhone: phone, clientName: state.clientName, businessName: state.businessName,
          serviceName: service.name, startsAt: state.startsAt, price: service.price, slug: state.slug,
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
