const sgMail = require('@sendgrid/mail')

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'notificaciones@agendamx.net'
const FROM_NAME = 'AgendaMX'

// Initialize only if API key exists
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

async function sendEmail(to, subject, html) {
  if (!process.env.SENDGRID_API_KEY) {
    return { ok: false, error: 'SendGrid not configured' }
  }
  try {
    await sgMail.send({ to, from: { email: FROM_EMAIL, name: FROM_NAME }, subject, html })
    console.log(`📧 Email sent to ${to}: ${subject}`)
    return { ok: true }
  } catch (err) {
    console.error('Email error:', err.response?.body?.errors || err.message)
    return { ok: false, error: err.message }
  }
}

// ─── Wrapper HTML template ─────────────────────────────
function wrapHtml(content) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#08080F;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#08080F;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#13131A;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.07);">
  <tr><td style="padding:32px 40px 24px;text-align:center;">
    <h1 style="margin:0;font-size:28px;font-weight:800;color:#FF5C3A;letter-spacing:-0.5px;">AgendaMX</h1>
  </td></tr>
  <tr><td style="padding:0 40px 32px;">
    ${content}
  </td></tr>
  <tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
    <p style="margin:0;font-size:12px;color:#7070A0;">AgendaMX — Sistema de citas inteligente</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

// ─── Email functions ─────────────────────────────────────

async function sendAppointmentConfirmation(to, { clientName, businessName, serviceName, startsAt, price, slug }) {
  const date = new Date(startsAt)
  const dateStr = date.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  const html = wrapHtml(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 16px;">¡Cita confirmada!</h2>
    <p style="color:#E0E0FF;font-size:16px;margin:0 0 24px;">Hola <strong>${clientName}</strong>, tu cita ha sido agendada.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:12px;padding:20px;border:1px solid rgba(255,255,255,0.05);">
      <tr><td style="padding:8px 16px;color:#7070A0;font-size:14px;">Servicio</td><td style="padding:8px 16px;color:#ffffff;font-size:14px;font-weight:600;">${serviceName}</td></tr>
      <tr><td style="padding:8px 16px;color:#7070A0;font-size:14px;">Fecha</td><td style="padding:8px 16px;color:#ffffff;font-size:14px;">${dateStr}</td></tr>
      <tr><td style="padding:8px 16px;color:#7070A0;font-size:14px;">Hora</td><td style="padding:8px 16px;color:#ffffff;font-size:14px;font-weight:600;">${timeStr}</td></tr>
      ${price ? `<tr><td style="padding:8px 16px;color:#7070A0;font-size:14px;">Precio</td><td style="padding:8px 16px;color:#00E5A0;font-size:14px;font-weight:600;">$${price} MXN</td></tr>` : ''}
      <tr><td style="padding:8px 16px;color:#7070A0;font-size:14px;">Negocio</td><td style="padding:8px 16px;color:#ffffff;font-size:14px;">${businessName}</td></tr>
    </table>
    <p style="color:#7070A0;font-size:13px;margin:24px 0 0;">Si necesitas reagendar o cancelar, contacta directamente al negocio.</p>
  `)

  return sendEmail(to, `Cita confirmada — ${serviceName} en ${businessName}`, html)
}

async function sendAppointmentReminder(to, { clientName, businessName, serviceName, startsAt, hoursUntil }) {
  const date = new Date(startsAt)
  const timeStr = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const label = hoursUntil === 24 ? 'mañana' : 'en 1 hora'

  const html = wrapHtml(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 16px;">Recordatorio de cita</h2>
    <p style="color:#E0E0FF;font-size:16px;margin:0 0 16px;">Hola <strong>${clientName}</strong>, tu cita es <strong style="color:#FF5C3A;">${label}</strong>.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:12px;padding:16px;border:1px solid rgba(255,255,255,0.05);">
      <tr><td style="padding:6px 16px;color:#7070A0;font-size:14px;">Servicio</td><td style="padding:6px 16px;color:#ffffff;font-size:14px;">${serviceName}</td></tr>
      <tr><td style="padding:6px 16px;color:#7070A0;font-size:14px;">Hora</td><td style="padding:6px 16px;color:#ffffff;font-size:14px;font-weight:600;">${timeStr}</td></tr>
      <tr><td style="padding:6px 16px;color:#7070A0;font-size:14px;">Negocio</td><td style="padding:6px 16px;color:#ffffff;font-size:14px;">${businessName}</td></tr>
    </table>
    <p style="color:#7070A0;font-size:13px;margin:16px 0 0;">Te esperamos. ¡No faltes!</p>
  `)

  return sendEmail(to, `Recordatorio: ${serviceName} ${label} — ${businessName}`, html)
}

async function sendOwnerNotification(to, { clientName, clientPhone, serviceName, startsAt }) {
  const date = new Date(startsAt)
  const dateStr = date.toLocaleDateString('es-MX', { weekday: 'short', month: 'short', day: 'numeric' })
  const timeStr = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  const html = wrapHtml(`
    <h2 style="color:#00E5A0;font-size:22px;margin:0 0 16px;">Nueva cita agendada</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:12px;padding:16px;border:1px solid rgba(255,255,255,0.05);">
      <tr><td style="padding:6px 16px;color:#7070A0;font-size:14px;">Cliente</td><td style="padding:6px 16px;color:#ffffff;font-size:14px;font-weight:600;">${clientName}</td></tr>
      <tr><td style="padding:6px 16px;color:#7070A0;font-size:14px;">Teléfono</td><td style="padding:6px 16px;color:#ffffff;font-size:14px;">${clientPhone}</td></tr>
      <tr><td style="padding:6px 16px;color:#7070A0;font-size:14px;">Servicio</td><td style="padding:6px 16px;color:#ffffff;font-size:14px;">${serviceName}</td></tr>
      <tr><td style="padding:6px 16px;color:#7070A0;font-size:14px;">Fecha</td><td style="padding:6px 16px;color:#ffffff;font-size:14px;">${dateStr} — ${timeStr}</td></tr>
    </table>
    <p style="color:#7070A0;font-size:13px;margin:16px 0 0;">Revisa tu panel de AgendaMX para más detalles.</p>
  `)

  return sendEmail(to, `Nueva cita: ${clientName} — ${serviceName}`, html)
}

async function sendFollowUp(to, { clientName, businessName, slug }) {
  const bookingUrl = process.env.PUBLIC_BOOKING_URL ? `${process.env.PUBLIC_BOOKING_URL}/${slug}` : '#'

  const html = wrapHtml(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 16px;">¡Gracias por tu visita!</h2>
    <p style="color:#E0E0FF;font-size:16px;margin:0 0 16px;">Hola <strong>${clientName}</strong>, esperamos que hayas tenido una excelente experiencia en <strong>${businessName}</strong>.</p>
    <p style="color:#E0E0FF;font-size:15px;margin:0 0 24px;">¿Quieres agendar otra cita?</p>
    <div style="text-align:center;">
      <a href="${bookingUrl}" style="display:inline-block;background:linear-gradient(135deg,#FF5C3A,#FF7A52);color:#ffffff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">Reagendar cita</a>
    </div>
  `)

  return sendEmail(to, `¡Gracias por tu visita a ${businessName}!`, html)
}

async function sendWelcomeEmail(to, { name, businessName, slug }) {
  const adminUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
  const bookingUrl = process.env.PUBLIC_BOOKING_URL ? `${process.env.PUBLIC_BOOKING_URL}/${slug}` : '#'

  const html = wrapHtml(`
    <h2 style="color:#ffffff;font-size:22px;margin:0 0 16px;">¡Bienvenido a AgendaMX!</h2>
    <p style="color:#E0E0FF;font-size:16px;margin:0 0 16px;">Hola <strong>${name}</strong>, tu negocio <strong>${businessName}</strong> ya está listo para recibir citas.</p>
    <p style="color:#E0E0FF;font-size:15px;margin:0 0 8px;">Tus siguientes pasos:</p>
    <ol style="color:#E0E0FF;font-size:14px;padding-left:20px;margin:0 0 24px;">
      <li style="margin-bottom:8px;">Selecciona una plantilla para tu negocio</li>
      <li style="margin-bottom:8px;">Personaliza tus servicios y horarios</li>
      <li style="margin-bottom:8px;">Comparte tu página de reservas con tus clientes</li>
    </ol>
    <div style="text-align:center;margin-bottom:16px;">
      <a href="${adminUrl}" style="display:inline-block;background:linear-gradient(135deg,#FF5C3A,#FF7A52);color:#ffffff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">Ir a mi panel</a>
    </div>
    <p style="color:#7070A0;font-size:13px;margin:16px 0 0;text-align:center;">Tu página de reservas: <a href="${bookingUrl}" style="color:#FF5C3A;">${bookingUrl}</a></p>
  `)

  return sendEmail(to, `¡Bienvenido a AgendaMX, ${name}!`, html)
}

module.exports = {
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendOwnerNotification,
  sendFollowUp,
  sendWelcomeEmail,
}
