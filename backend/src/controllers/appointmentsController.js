const db = require('../config/db')
const emailService = require('../services/emailService')

// ─── Listar citas del negocio ─────────────────────────────────────
exports.list = async (req, res) => {
  const { date, status } = req.query
  const businessId = req.user.businessId

  let query = `
    SELECT a.id, a.starts_at, a.ends_at, a.status, a.price,
           a.payment_status, a.client_name, a.client_phone, a.client_notes,
           a.staff_notes, a.reminder_24h_sent, a.reminder_1h_sent,
           s.name as service_name, s.duration_min, s.color as service_color,
           u.name as staff_name
    FROM appointments a
    LEFT JOIN services s ON s.id = a.service_id
    LEFT JOIN users u ON u.id = a.staff_id
    WHERE a.business_id = $1
  `
  const params = [businessId]
  let idx = 2

  if (date) {
    query += ` AND DATE(a.starts_at AT TIME ZONE COALESCE((SELECT timezone FROM businesses WHERE id = $1), 'America/Mexico_City')) = $${idx}`
    params.push(date)
    idx++
  }
  if (status) {
    const validStatuses = ['pending','confirmed','completed','cancelled','no_show']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' })
    }
    query += ` AND a.status = $${idx}`
    params.push(status)
  }

  query += ' ORDER BY a.starts_at ASC'

  try {
    const result = await db.query(query, params)
    res.json({ appointments: result.rows })
  } catch (err) {
    console.error('list appointments error:', err)
    res.status(500).json({ error: 'Error al obtener citas' })
  }
}

// ─── Crear cita (desde panel admin) ──────────────────────────────
exports.create = async (req, res) => {
  const businessId = req.user.businessId
  const { serviceId, clientName, clientPhone, startsAt, staffNotes } = req.body

  if (!serviceId || !clientName || !startsAt) {
    return res.status(400).json({ error: 'Servicio, nombre de cliente y fecha requeridos' })
  }

  const client = await db.pool.connect()
  try {
    await client.query('BEGIN')

    const service = await client.query(
      'SELECT duration_min, price FROM services WHERE id = $1 AND business_id = $2',
      [serviceId, businessId]
    )
    if (service.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Servicio no encontrado' })
    }
    const { duration_min, price } = service.rows[0]
    const endsAt = new Date(new Date(startsAt).getTime() + duration_min * 60000)

    // Verificar disponibilidad con lock
    const conflict = await client.query(
      `SELECT id FROM appointments
       WHERE business_id = $1
         AND status NOT IN ('cancelled')
         AND tstzrange(starts_at, ends_at) && tstzrange($2::timestamptz, $3::timestamptz)
       FOR UPDATE`,
      [businessId, startsAt, endsAt.toISOString()]
    )
    if (conflict.rows.length > 0) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'Ese horario ya está ocupado' })
    }

    // Create or find client
    let clientRecord = null
    if (clientPhone) {
      const waService = require('../services/whatsappService')
      const normalizedPhone = waService.normalizePhone(clientPhone)
      const existing = await client.query(
        'SELECT id FROM clients WHERE business_id = $1 AND phone = $2',
        [businessId, normalizedPhone]
      )
      if (existing.rows.length === 0) {
        clientRecord = await client.query(
          'INSERT INTO clients (business_id, name, phone) VALUES ($1,$2,$3) RETURNING id',
          [businessId, clientName, normalizedPhone]
        )
      } else {
        clientRecord = existing
      }
    }

    const result = await client.query(
      `INSERT INTO appointments
         (business_id, service_id, client_id, starts_at, ends_at, client_name, client_phone, staff_notes, price, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'confirmed')
       RETURNING *`,
      [businessId, serviceId, clientRecord?.rows[0]?.id || null, startsAt, endsAt.toISOString(), clientName, clientPhone || null, staffNotes || null, price]
    )
    await client.query('COMMIT')

    // WhatsApp confirmation to client (fire-and-forget)
    if (clientPhone) {
      const waService = require('../services/whatsappService')
      const normalizedPhone = waService.normalizePhone(clientPhone)
      const biz = await db.query('SELECT name, slug FROM businesses WHERE id = $1', [businessId])
      const svc = await db.query('SELECT name FROM services WHERE id = $1', [serviceId])
      waService.sendConfirmation({
        clientPhone: normalizedPhone, clientName,
        businessName: biz.rows[0]?.name, serviceName: svc.rows[0]?.name,
        startsAt, price, slug: biz.rows[0]?.slug,
      }).catch(e => console.error('WA admin-create error:', e))
    }

    res.status(201).json({ appointment: result.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('create appointment error:', err)
    res.status(500).json({ error: 'Error al crear cita' })
  } finally {
    client.release()
  }
}

// ─── Actualizar status de cita ─────────────────────────────────────
exports.updateStatus = async (req, res) => {
  const { id } = req.params
  const { status } = req.body
  const businessId = req.user.businessId
  const allowed = ['confirmed','completed','cancelled','no_show']

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Status inválido' })
  }

  try {
    const result = await db.query(
      `UPDATE appointments SET status = $1, updated_at = NOW()
       WHERE id = $2 AND business_id = $3
       RETURNING *`,
      [status, id, businessId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cita no encontrada' })
    }
    res.json({ appointment: result.rows[0] })
  } catch (err) {
    console.error('updateStatus error:', err)
    res.status(500).json({ error: 'Error al actualizar cita' })
  }
}

// ─── Disponibilidad pública (para la página de reservas) ──────────
exports.availability = async (req, res) => {
  const { slug } = req.params
  const { serviceId, date } = req.query

  if (!serviceId || !date) {
    return res.status(400).json({ error: 'serviceId y date requeridos' })
  }

  try {
    // Obtener el negocio
    const biz = await db.query(
      'SELECT id, timezone FROM businesses WHERE slug = $1 AND is_active = true',
      [slug]
    )
    if (biz.rows.length === 0) {
      return res.status(404).json({ error: 'Negocio no encontrado' })
    }
    const { id: businessId, timezone } = biz.rows[0]
    const tz = timezone || 'America/Mexico_City'

    // Duración del servicio
    const svc = await db.query(
      'SELECT duration_min FROM services WHERE id = $1 AND business_id = $2 AND is_active = true',
      [serviceId, businessId]
    )
    if (svc.rows.length === 0) {
      return res.status(404).json({ error: 'Servicio no encontrado' })
    }
    const duration = svc.rows[0].duration_min

    // Horario del día de la semana
    const dayOfWeek = new Date(date).getDay()
    const hours = await db.query(
      'SELECT opens_at, closes_at, is_open FROM business_hours WHERE business_id = $1 AND day_of_week = $2',
      [businessId, dayOfWeek]
    )
    if (hours.rows.length === 0 || !hours.rows[0].is_open) {
      return res.json({ slots: [], message: 'Cerrado ese día' })
    }
    const { opens_at, closes_at } = hours.rows[0]

    // Citas existentes ese día
    const existing = await db.query(
      `SELECT starts_at, ends_at FROM appointments
       WHERE business_id = $1
         AND status NOT IN ('cancelled')
         AND DATE(starts_at AT TIME ZONE $3) = $2`,
      [businessId, date, tz]
    )

    // Generar todos los slots cada 30 min
    const slots = []
    const [oh, om] = opens_at.split(':').map(Number)
    const [ch, cm] = closes_at.split(':').map(Number)
    const openMin  = oh * 60 + om
    const closeMin = ch * 60 + cm

    for (let m = openMin; m + duration <= closeMin; m += 30) {
      const h = Math.floor(m / 60)
      const min = m % 60
      const slotStart = new Date(`${date}T${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}:00`)
      const slotEnd   = new Date(slotStart.getTime() + duration * 60000)

      // ¿Hay conflicto?
      const busy = existing.rows.some(appt => {
        const aStart = new Date(appt.starts_at)
        const aEnd   = new Date(appt.ends_at)
        return slotStart < aEnd && slotEnd > aStart
      })

      // No mostrar slots pasados
      if (slotStart <= new Date()) continue

      slots.push({
        time: `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`,
        available: !busy,
      })
    }

    res.json({ slots })
  } catch (err) {
    console.error('availability error:', err)
    res.status(500).json({ error: 'Error al obtener disponibilidad' })
  }
}

// ─── Reserva pública (cliente final) ──────────────────────────────
exports.book = async (req, res) => {
  const { slug } = req.params
  const { serviceId, startsAt, clientName, clientPhone, clientNotes } = req.body

  if (!serviceId || !startsAt || !clientName || !clientPhone) {
    return res.status(400).json({ error: 'Datos incompletos' })
  }

  const waService = require('../services/whatsappService')
  const normalizedPhone = waService.normalizePhone(clientPhone)

  const txn = await db.pool.connect()
  try {
    await txn.query('BEGIN')

    const biz = await txn.query(
      'SELECT id, name FROM businesses WHERE slug = $1 AND is_active = true',
      [slug]
    )
    if (biz.rows.length === 0) {
      await txn.query('ROLLBACK')
      return res.status(404).json({ error: 'Negocio no encontrado' })
    }
    const businessId = biz.rows[0].id

    const svc = await txn.query(
      'SELECT id, name, duration_min, price FROM services WHERE id = $1 AND business_id = $2 AND is_active = true',
      [serviceId, businessId]
    )
    if (svc.rows.length === 0) {
      await txn.query('ROLLBACK')
      return res.status(404).json({ error: 'Servicio no encontrado' })
    }
    const service = svc.rows[0]
    const endsAt = new Date(new Date(startsAt).getTime() + service.duration_min * 60000)

    // Verificar disponibilidad con lock
    const conflict = await txn.query(
      `SELECT id FROM appointments
       WHERE business_id = $1
         AND status NOT IN ('cancelled')
         AND tstzrange(starts_at, ends_at) && tstzrange($2::timestamptz, $3::timestamptz)
       FOR UPDATE`,
      [businessId, startsAt, endsAt.toISOString()]
    )
    if (conflict.rows.length > 0) {
      await txn.query('ROLLBACK')
      return res.status(409).json({ error: 'Ese horario ya no está disponible, elige otro' })
    }

    // Crear o encontrar cliente
    let client = await txn.query(
      'SELECT id FROM clients WHERE business_id = $1 AND phone = $2',
      [businessId, normalizedPhone]
    )
    if (client.rows.length === 0) {
      client = await txn.query(
        'INSERT INTO clients (business_id, name, phone) VALUES ($1,$2,$3) RETURNING id',
        [businessId, clientName, normalizedPhone]
      )
    }

    // Crear la cita
    const appt = await txn.query(
      `INSERT INTO appointments
         (business_id, service_id, client_id, starts_at, ends_at,
          client_name, client_phone, client_notes, price, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')
       RETURNING id, starts_at, ends_at, status`,
      [businessId, serviceId, client.rows[0].id, startsAt, endsAt.toISOString(),
       clientName, normalizedPhone, clientNotes || null, service.price]
    )
    await txn.query('COMMIT')

    // WhatsApp (fire-and-forget, fuera del txn)
    waService.sendConfirmation({
      clientPhone: normalizedPhone, clientName, businessName: biz.rows[0].name,
      serviceName: service.name, startsAt, price: service.price, slug,
    }).catch(e => console.error('WA client error:', e))

    db.query('SELECT phone FROM users WHERE business_id = $1 AND role = $2', [businessId, 'owner'])
      .then(r => r.rows[0]?.phone && waService.notifyOwner({
        ownerPhone: r.rows[0].phone, clientName, clientPhone: normalizedPhone,
        serviceName: service.name, startsAt,
      })).catch(e => console.error('WA owner error:', e))

    // Email notifications (fire-and-forget)
    // Client email — check if client record has email
    db.query('SELECT email FROM clients WHERE id = $1', [client.rows[0].id])
      .then(r => r.rows[0]?.email && emailService.sendAppointmentConfirmation(r.rows[0].email, {
        clientName, businessName: biz.rows[0].name,
        serviceName: service.name, startsAt, price: service.price, slug,
      })).catch(e => console.error('Email client error:', e))

    // Owner email notification
    db.query('SELECT email FROM users WHERE business_id = $1 AND role = $2', [businessId, 'owner'])
      .then(r => r.rows[0]?.email && emailService.sendOwnerNotification(r.rows[0].email, {
        clientName, clientPhone: normalizedPhone,
        serviceName: service.name, startsAt,
      })).catch(e => console.error('Email owner error:', e))

    res.status(201).json({
      appointment: {
        id: appt.rows[0].id,
        startsAt: appt.rows[0].starts_at,
        endsAt: appt.rows[0].ends_at,
        status: appt.rows[0].status,
        service: service.name,
        price: service.price,
      },
      message: '¡Cita agendada! Recibirás confirmación por WhatsApp.',
    })
  } catch (err) {
    await txn.query('ROLLBACK').catch(() => {})
    console.error('book error:', err)
    res.status(500).json({ error: 'Error al agendar cita' })
  } finally {
    txn.release()
  }
}
