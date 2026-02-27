/**
 * AgendaMX — Cron de recordatorios WhatsApp
 *
 * Ejecutar con: node src/jobs/reminders.js
 * En producción con crontab: * /15 * * * * node /var/www/agendamx/backend/src/jobs/reminders.js
 *
 * Este proceso:
 *  1. Busca citas confirmadas en las próximas 24 horas sin recordatorio 24h enviado
 *  2. Busca citas confirmadas en la próxima 1 hora sin recordatorio 1h enviado
 *  3. Busca citas completadas hace 2 horas para enviar mensaje de seguimiento
 *  4. Envía los mensajes y marca como enviados
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })
const db = require('../config/db')
const wa = require('../services/whatsappService')
const email = require('../services/emailService')
const { logEvent } = require('../services/clientEvents')

const log = (msg) => console.log(`[${new Date().toISOString()}] 📲 ${msg}`)

async function runReminders() {
  log('Iniciando cron de recordatorios...')

  try {
    // ─── 1. Recordatorios 24 horas ────────────────────────────────
    const r24 = await db.query(`
      SELECT a.id, a.starts_at, a.client_name, a.client_phone,
             a.client_id, a.business_id,
             s.name as service_name,
             b.name as business_name,
             c.email as client_email
      FROM appointments a
      JOIN services s ON s.id = a.service_id
      JOIN businesses b ON b.id = a.business_id
      LEFT JOIN clients c ON c.id = a.client_id
      WHERE a.status = 'confirmed'
        AND a.reminder_24h_sent = false
        AND a.starts_at BETWEEN NOW() + INTERVAL '23 hours'
                             AND NOW() + INTERVAL '25 hours'
    `)

    for (const appt of r24.rows) {
      log(`Enviando recordatorio 24h a ${appt.client_name} (${appt.client_phone})`)
      const result = await wa.sendReminder24h({
        clientPhone:   appt.client_phone,
        clientName:    appt.client_name,
        businessName:  appt.business_name,
        serviceName:   appt.service_name,
        startsAt:      appt.starts_at,
      })
      if (result.ok) {
        await db.query(
          'UPDATE appointments SET reminder_24h_sent = true WHERE id = $1',
          [appt.id]
        )
        log(`✅ 24h enviado a ${appt.client_name}`)
        if (appt.client_id) logEvent({ businessId: appt.business_id, clientId: appt.client_id, appointmentId: appt.id, eventType: 'reminder_24h', description: 'Recordatorio 24h enviado', channel: 'system' })
      } else {
        log(`❌ Error 24h para ${appt.client_name}: ${JSON.stringify(result.error)}`)
      }

      // Email reminder (fire-and-forget)
      if (appt.client_email) {
        email.sendAppointmentReminder(appt.client_email, {
          clientName: appt.client_name, businessName: appt.business_name,
          serviceName: appt.service_name, startsAt: appt.starts_at, hoursUntil: 24,
        }).catch(e => console.error('Email 24h error:', e))
      }
    }

    // ─── 2. Recordatorios 1 hora ──────────────────────────────────
    const r1h = await db.query(`
      SELECT a.id, a.starts_at, a.client_name, a.client_phone,
             a.client_id, a.business_id,
             s.name as service_name,
             b.name as business_name,
             c.email as client_email
      FROM appointments a
      JOIN services s ON s.id = a.service_id
      JOIN businesses b ON b.id = a.business_id
      LEFT JOIN clients c ON c.id = a.client_id
      WHERE a.status = 'confirmed'
        AND a.reminder_1h_sent = false
        AND a.starts_at BETWEEN NOW() + INTERVAL '55 minutes'
                             AND NOW() + INTERVAL '65 minutes'
    `)

    for (const appt of r1h.rows) {
      log(`Enviando recordatorio 1h a ${appt.client_name}`)
      const result = await wa.sendReminder1h({
        clientPhone:   appt.client_phone,
        clientName:    appt.client_name,
        businessName:  appt.business_name,
        serviceName:   appt.service_name,
        startsAt:      appt.starts_at,
      })
      if (result.ok) {
        await db.query(
          'UPDATE appointments SET reminder_1h_sent = true WHERE id = $1',
          [appt.id]
        )
        log(`✅ 1h enviado a ${appt.client_name}`)
        if (appt.client_id) logEvent({ businessId: appt.business_id, clientId: appt.client_id, appointmentId: appt.id, eventType: 'reminder_1h', description: 'Recordatorio 1h enviado', channel: 'system' })
      } else {
        log(`❌ Error 1h para ${appt.client_name}: ${JSON.stringify(result.error)}`)
      }

      if (appt.client_email) {
        email.sendAppointmentReminder(appt.client_email, {
          clientName: appt.client_name, businessName: appt.business_name,
          serviceName: appt.service_name, startsAt: appt.starts_at, hoursUntil: 1,
        }).catch(e => console.error('Email 1h error:', e))
      }
    }

    // ─── 3. Seguimiento post-cita (2 horas después) ───────────────
    const followups = await db.query(`
      SELECT a.id, a.client_name, a.client_phone,
             a.client_id, a.business_id,
             b.name as business_name, b.slug,
             c.email as client_email
      FROM appointments a
      JOIN businesses b ON b.id = a.business_id
      LEFT JOIN clients c ON c.id = a.client_id
      WHERE a.status = 'completed'
        AND a.followup_sent = false
        AND a.ends_at BETWEEN NOW() - INTERVAL '2.5 hours'
                          AND NOW() - INTERVAL '1.5 hours'
    `)

    for (const appt of followups.rows) {
      log(`Enviando follow-up a ${appt.client_name}`)
      const result = await wa.sendFollowUp({
        clientPhone:  appt.client_phone,
        clientName:   appt.client_name,
        businessName: appt.business_name,
        slug:         appt.slug,
      })
      if (result.ok) {
        await db.query(
          'UPDATE appointments SET followup_sent = true WHERE id = $1',
          [appt.id]
        )
        log(`✅ Follow-up enviado a ${appt.client_name}`)
        if (appt.client_id) logEvent({ businessId: appt.business_id, clientId: appt.client_id, appointmentId: appt.id, eventType: 'followup', description: 'Follow-up enviado', channel: 'system' })
      }

      if (appt.client_email) {
        email.sendFollowUp(appt.client_email, {
          clientName: appt.client_name, businessName: appt.business_name,
          slug: appt.slug,
        }).catch(e => console.error('Email followup error:', e))
      }
    }

    log(`✅ Cron completado — 24h: ${r24.rows.length}, 1h: ${r1h.rows.length}, follow-up: ${followups.rows.length}`)
  } catch (err) {
    console.error('[CRON ERROR]', err)
  } finally {
    process.exit(0)
  }
}

runReminders()
