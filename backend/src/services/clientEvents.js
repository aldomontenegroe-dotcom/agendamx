const db = require('../config/db')

async function logEvent({ businessId, clientId, appointmentId, eventType, description, channel }) {
  try {
    await db.query(
      `INSERT INTO client_events (business_id, client_id, appointment_id, event_type, description, channel)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [businessId, clientId, appointmentId || null, eventType, description || null, channel || null]
    )
  } catch (err) {
    console.error('logEvent error:', err.message)
  }
}

module.exports = { logEvent }
