import { useState, useEffect } from 'react'
import { Check, Copy } from 'lucide-react'
import { apiFetch } from '../utils/api'

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const timezones = [
  { value: 'America/Mexico_City', label: 'Ciudad de México (CST)' },
  { value: 'America/Cancun', label: 'Cancún (EST)' },
  { value: 'America/Monterrey', label: 'Monterrey (CST)' },
  { value: 'America/Chihuahua', label: 'Chihuahua (MST)' },
  { value: 'America/Tijuana', label: 'Tijuana (PST)' },
  { value: 'America/Hermosillo', label: 'Hermosillo (MST)' },
]

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 10,
  color: '#F0F0FF',
  padding: '10px 14px',
  fontSize: 14,
  fontFamily: "'Inter', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  color: '#7070A0',
  marginBottom: 6,
  fontFamily: "'Inter', sans-serif",
  fontWeight: 500,
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked ? '#00E5A0' : 'rgba(255,255,255,0.12)',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  )
}

export default function SettingsPage() {
  // Business info state
  const [business, setBusiness] = useState(null)
  const [bizLoading, setBizLoading] = useState(true)
  const [bizForm, setBizForm] = useState({
    name: '',
    description: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    city: '',
    state: '',
    timezone: 'America/Mexico_City',
    accentColor: '#FF5C3A',
    acceptPayments: false,
    paymentMode: 'full',
    depositPercentage: 50,
  })
  const [bizSaving, setBizSaving] = useState(false)
  const [bizSuccess, setBizSuccess] = useState(false)

  // Payment settings state
  const [paymentSaving, setPaymentSaving] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentProviders, setPaymentProviders] = useState({ stripe: { connected: false }, providers: { stripe: false, mercadopago: false } })
  const [connectingStripe, setConnectingStripe] = useState(false)

  // Business hours state
  const [hours, setHours] = useState(
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      opensAt: '09:00',
      closesAt: '18:00',
      isOpen: false,
    }))
  )
  const [hoursLoading, setHoursLoading] = useState(true)
  const [hoursSaving, setHoursSaving] = useState(false)
  const [hoursSuccess, setHoursSuccess] = useState(false)

  // Link copy state
  const [linkCopied, setLinkCopied] = useState(false)

  // Fetch business info
  useEffect(() => {
    setBizLoading(true)
    apiFetch('/api/businesses/me')
      .then(data => {
        const b = data.business
        setBusiness(b)
        setBizForm({
          name: b.name || '',
          description: b.description || '',
          phone: b.phone || '',
          whatsapp: b.whatsapp || '',
          email: b.email || '',
          address: b.address || '',
          city: b.city || '',
          state: b.state || '',
          timezone: b.timezone || 'America/Mexico_City',
          accentColor: b.accent_color || '#FF5C3A',
          acceptPayments: !!b.accept_payments,
          paymentMode: b.payment_mode || 'full',
          depositPercentage: b.deposit_percentage || 50,
        })
      })
      .catch(() => { })
      .finally(() => setBizLoading(false))
  }, [])

  // Fetch business hours
  useEffect(() => {
    setHoursLoading(true)
    apiFetch('/api/business-hours')
      .then(data => {
        const fetched = data.hours || []
        const merged = Array.from({ length: 7 }, (_, i) => {
          const existing = fetched.find(h => h.day_of_week === i)
          if (existing) {
            return {
              dayOfWeek: i,
              opensAt: existing.opens_at || '09:00',
              closesAt: existing.closes_at || '18:00',
              isOpen: !!existing.is_open,
            }
          }
          return { dayOfWeek: i, opensAt: '09:00', closesAt: '18:00', isOpen: false }
        })
        setHours(merged)
      })
      .catch(() => { })
      .finally(() => setHoursLoading(false))
  }, [])

  // Fetch payment providers status
  useEffect(() => {
    apiFetch('/api/payments/connect/status')
      .then(data => setPaymentProviders(data))
      .catch(() => {})
  }, [])

  const handleConnectStripe = () => {
    setConnectingStripe(true)
    apiFetch('/api/payments/connect/stripe', { method: 'POST' })
      .then(data => {
        if (data.url) window.open(data.url, '_blank')
      })
      .catch(err => alert(err.message || 'Error al conectar Stripe'))
      .finally(() => setConnectingStripe(false))
  }

  const handleDisconnectStripe = () => {
    if (!confirm('¿Desconectar Stripe? Los pagos online dejarán de funcionar.')) return
    apiFetch('/api/payments/connect/stripe/disconnect', { method: 'POST' })
      .then(() => setPaymentProviders(p => ({ ...p, stripe: { connected: false }, providers: { ...p.providers, stripe: false } })))
      .catch(err => alert(err.message || 'Error'))
  }

  const handleBizSave = () => {
    setBizSaving(true)
    setBizSuccess(false)
    apiFetch('/api/businesses/me', {
      method: 'PUT',
      body: JSON.stringify(bizForm),
    })
      .then(data => {
        setBusiness(data.business || { ...business, ...bizForm })
        setBizSuccess(true)
        setTimeout(() => setBizSuccess(false), 3000)
      })
      .catch(err => alert(err.message || 'Error al guardar'))
      .finally(() => setBizSaving(false))
  }

  const handleHoursSave = () => {
    setHoursSaving(true)
    setHoursSuccess(false)
    apiFetch('/api/business-hours', {
      method: 'PUT',
      body: JSON.stringify({ hours }),
    })
      .then(() => {
        setHoursSuccess(true)
        setTimeout(() => setHoursSuccess(false), 3000)
      })
      .catch(err => alert(err.message || 'Error al guardar horarios'))
      .finally(() => setHoursSaving(false))
  }

  const handlePaymentSave = () => {
    setPaymentSaving(true)
    setPaymentSuccess(false)
    apiFetch('/api/businesses/me', {
      method: 'PUT',
      body: JSON.stringify({
        acceptPayments: bizForm.acceptPayments,
        paymentMode: bizForm.paymentMode,
        depositPercentage: bizForm.depositPercentage,
      }),
    })
      .then(data => {
        setBusiness(data.business || business)
        setPaymentSuccess(true)
        setTimeout(() => setPaymentSuccess(false), 3000)
      })
      .catch(err => alert(err.message || 'Error al guardar configuración de pagos'))
      .finally(() => setPaymentSaving(false))
  }

  const updateHour = (index, field, value) => {
    setHours(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h))
  }

  const handleCopyLink = () => {
    const slug = business?.slug || ''
    navigator.clipboard.writeText(`https://agendamx.net/${slug}`)
      .then(() => {
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      })
      .catch(() => { })
  }

  const bookingUrl = `https://agendamx.net/${business?.slug || ''}`

  return (
    <div style={{ padding: 0, maxWidth: 820 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: 26, fontWeight: 800, color: '#F0F0FF', marginBottom: 4 }}>
          Ajustes
        </h1>
        <p style={{ color: '#7070A0', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>
          Configura tu negocio y horarios de operación
        </p>
      </div>

      {/* ===== Section 1: Business Info ===== */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: '28px',
        marginBottom: 24,
      }}>
        <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: '#F0F0FF', marginBottom: 24 }}>
          Datos del Negocio
        </h2>

        {bizLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p style={{ color: '#7070A0', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>Cargando datos del negocio...</p>
          </div>
        ) : (
          <>
            {/* 2-column grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Nombre del negocio *</label>
                <input
                  type="text"
                  value={bizForm.name}
                  onChange={(e) => setBizForm({ ...bizForm, name: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Descripción</label>
                <textarea
                  value={bizForm.description}
                  onChange={(e) => setBizForm({ ...bizForm, description: e.target.value })}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={labelStyle}>Teléfono</label>
                <input
                  type="text"
                  value={bizForm.phone}
                  onChange={(e) => setBizForm({ ...bizForm, phone: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>WhatsApp</label>
                <input
                  type="text"
                  value={bizForm.whatsapp}
                  onChange={(e) => setBizForm({ ...bizForm, whatsapp: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="text"
                  value={bizForm.email}
                  onChange={(e) => setBizForm({ ...bizForm, email: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Dirección</label>
                <input
                  type="text"
                  value={bizForm.address}
                  onChange={(e) => setBizForm({ ...bizForm, address: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Ciudad</label>
                <input
                  type="text"
                  value={bizForm.city}
                  onChange={(e) => setBizForm({ ...bizForm, city: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Estado</label>
                <input
                  type="text"
                  value={bizForm.state}
                  onChange={(e) => setBizForm({ ...bizForm, state: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Zona horaria</label>
                <select
                  value={bizForm.timezone}
                  onChange={(e) => setBizForm({ ...bizForm, timezone: e.target.value })}
                  style={{
                    ...inputStyle,
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237070A0' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 14px center',
                    paddingRight: 36,
                  }}
                >
                  {timezones.map(tz => (
                    <option key={tz.value} value={tz.value} style={{ background: '#13131A', color: '#F0F0FF' }}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Color de acento</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    type="color"
                    value={bizForm.accentColor}
                    onChange={(e) => setBizForm({ ...bizForm, accentColor: e.target.value })}
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      padding: 2,
                    }}
                  />
                  <span style={{ fontSize: 14, color: '#F0F0FF', fontFamily: "'Inter', sans-serif" }}>
                    {bizForm.accentColor}
                  </span>
                </div>
              </div>
            </div>

            {/* Save button + success message */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
              <button
                onClick={handleBizSave}
                disabled={bizSaving || !bizForm.name.trim()}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #FF5C3A, #FF7A52)',
                  color: 'white',
                  cursor: bizSaving || !bizForm.name.trim() ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  boxShadow: '0 4px 20px rgba(255,92,58,0.3)',
                  opacity: bizSaving || !bizForm.name.trim() ? 0.6 : 1,
                }}
              >
                {bizSaving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              {bizSuccess && (
                <span style={{ fontSize: 14, color: '#00E5A0', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Check size={16} /> Cambios guardados
                </span>
              )}
            </div>

            {/* Public booking link */}
            {business?.slug && (
              <div style={{
                marginTop: 24,
                padding: '16px 20px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <p style={{ fontSize: 12, color: '#7070A0', marginBottom: 8, fontFamily: "'Inter', sans-serif" }}>
                  Enlace público de reservas
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    flex: 1,
                    fontSize: 14,
                    color: '#FF5C3A',
                    fontFamily: "'Inter', sans-serif",
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {bookingUrl}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 8,
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: linkCopied ? 'rgba(0,229,160,0.1)' : 'rgba(255,255,255,0.04)',
                      color: linkCopied ? '#00E5A0' : '#F0F0FF',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontFamily: "'Inter', sans-serif",
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    {linkCopied ? <><Check size={16} /> Copiado</> : <><Copy size={16} /> Copiar enlace</>}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ===== Section 2: Business Hours ===== */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: '28px',
        marginBottom: 24,
      }}>
        <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: '#F0F0FF', marginBottom: 24 }}>
          Horarios de Operación
        </h2>

        {hoursLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p style={{ color: '#7070A0', fontSize: 14, fontFamily: "'Inter', sans-serif" }}>Cargando horarios...</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {hours.map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: h.isOpen ? 'rgba(0,229,160,0.04)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${h.isOpen ? 'rgba(0,229,160,0.1)' : 'rgba(255,255,255,0.04)'}`,
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Day name */}
                  <span style={{
                    width: 100,
                    fontSize: 14,
                    fontWeight: 600,
                    color: h.isOpen ? '#F0F0FF' : '#7070A0',
                    fontFamily: "'Inter', sans-serif",
                    flexShrink: 0,
                  }}>
                    {dayNames[i]}
                  </span>

                  {/* Toggle */}
                  <ToggleSwitch
                    checked={h.isOpen}
                    onChange={(val) => updateHour(i, 'isOpen', val)}
                  />

                  {/* Status label */}
                  <span style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: h.isOpen ? '#00E5A0' : '#7070A0',
                    fontFamily: "'Inter', sans-serif",
                    width: 56,
                    flexShrink: 0,
                  }}>
                    {h.isOpen ? 'Abierto' : 'Cerrado'}
                  </span>

                  {/* Time inputs */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <input
                      type="time"
                      value={h.opensAt}
                      onChange={(e) => updateHour(i, 'opensAt', e.target.value)}
                      disabled={!h.isOpen}
                      style={{
                        ...inputStyle,
                        width: 130,
                        opacity: h.isOpen ? 1 : 0.3,
                        cursor: h.isOpen ? 'text' : 'not-allowed',
                      }}
                    />
                    <span style={{ fontSize: 13, color: '#7070A0', fontFamily: "'Inter', sans-serif" }}>a</span>
                    <input
                      type="time"
                      value={h.closesAt}
                      onChange={(e) => updateHour(i, 'closesAt', e.target.value)}
                      disabled={!h.isOpen}
                      style={{
                        ...inputStyle,
                        width: 130,
                        opacity: h.isOpen ? 1 : 0.3,
                        cursor: h.isOpen ? 'text' : 'not-allowed',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Save button + success message */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 }}>
              <button
                onClick={handleHoursSave}
                disabled={hoursSaving}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #FF5C3A, #FF7A52)',
                  color: 'white',
                  cursor: hoursSaving ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  boxShadow: '0 4px 20px rgba(255,92,58,0.3)',
                  opacity: hoursSaving ? 0.6 : 1,
                }}
              >
                {hoursSaving ? 'Guardando...' : 'Guardar horarios'}
              </button>
              {hoursSuccess && (
                <span style={{ fontSize: 14, color: '#00E5A0', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Check size={16} /> Horarios guardados
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* ===== Section 3: Payment Settings ===== */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        padding: '28px',
        marginBottom: 24,
      }}>
        <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: 18, fontWeight: 700, color: '#F0F0FF', marginBottom: 8 }}>
          Pagos Online
        </h2>
        <p style={{ color: '#7070A0', fontSize: 13, fontFamily: "'Inter', sans-serif", marginBottom: 24 }}>
          Cobra a tus clientes al momento de agendar su cita
        </p>

        {/* Toggle accept payments */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderRadius: 12,
          background: bizForm.acceptPayments ? 'rgba(0,229,160,0.04)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${bizForm.acceptPayments ? 'rgba(0,229,160,0.1)' : 'rgba(255,255,255,0.04)'}`,
          marginBottom: 20,
          transition: 'all 0.2s',
        }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#F0F0FF', fontFamily: "'Inter', sans-serif", marginBottom: 2 }}>
              Aceptar pagos al agendar
            </p>
            <p style={{ fontSize: 12, color: '#7070A0', fontFamily: "'Inter', sans-serif" }}>
              Los clientes podrán pagar al reservar su cita online
            </p>
          </div>
          <ToggleSwitch
            checked={bizForm.acceptPayments}
            onChange={(val) => setBizForm({ ...bizForm, acceptPayments: val })}
          />
        </div>

        {/* Payment providers (visible when payments enabled) */}
        {bizForm.acceptPayments && (
          <div style={{
            padding: '16px 20px', borderRadius: 12, marginBottom: 20,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <label style={{ ...labelStyle, marginBottom: 12 }}>Conectar proveedor de pagos</label>

            {/* Stripe Connect */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>💳</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#F0F0FF', fontFamily: "'Inter', sans-serif" }}>Stripe</p>
                  <p style={{ fontSize: 11, color: paymentProviders.stripe?.connected ? '#00E5A0' : '#7070A0', fontFamily: "'Inter', sans-serif" }}>
                    {paymentProviders.stripe?.connected
                      ? (paymentProviders.stripe.chargesEnabled ? 'Conectado y activo' : 'Conectado (completar verificación)')
                      : 'No conectado'}
                  </p>
                </div>
              </div>
              {paymentProviders.stripe?.connected ? (
                <button onClick={handleDisconnectStripe} style={{
                  padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255,92,58,0.2)',
                  background: 'rgba(255,92,58,0.06)', color: '#FF5C3A', cursor: 'pointer',
                  fontSize: 12, fontFamily: "'Inter', sans-serif",
                }}>Desconectar</button>
              ) : (
                <button onClick={handleConnectStripe} disabled={connectingStripe} style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none',
                  background: 'linear-gradient(135deg, #635BFF, #7B73FF)', color: 'white', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, fontFamily: "'Inter', sans-serif",
                  opacity: connectingStripe ? 0.6 : 1,
                }}>{connectingStripe ? 'Conectando...' : 'Conectar Stripe'}</button>
              )}
            </div>

            {/* Mercado Pago info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>🔵</span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#F0F0FF', fontFamily: "'Inter', sans-serif" }}>Mercado Pago</p>
                  <p style={{ fontSize: 11, color: paymentProviders.providers?.mercadopago ? '#00E5A0' : '#7070A0', fontFamily: "'Inter', sans-serif" }}>
                    {paymentProviders.providers?.mercadopago ? 'Conectado' : 'Próximamente'}
                  </p>
                </div>
              </div>
            </div>

            {!paymentProviders.providers?.stripe && !paymentProviders.providers?.mercadopago && (
              <p style={{ fontSize: 12, color: '#FF9500', fontFamily: "'Inter', sans-serif", marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,149,0,0.08)' }}>
                Conecta Stripe para empezar a cobrar. Los pagos van directo a tu cuenta.
              </p>
            )}
          </div>
        )}

        {/* Payment mode options (visible when payments enabled and provider connected) */}
        {bizForm.acceptPayments && (paymentProviders.providers?.stripe || paymentProviders.providers?.mercadopago) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Payment mode radio */}
            <div>
              <label style={labelStyle}>Modo de cobro</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {/* Full payment */}
                <div
                  onClick={() => setBizForm({ ...bizForm, paymentMode: 'full' })}
                  style={{
                    flex: 1, padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                    background: bizForm.paymentMode === 'full' ? 'rgba(255,92,58,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${bizForm.paymentMode === 'full' ? 'rgba(255,92,58,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: `2px solid ${bizForm.paymentMode === 'full' ? '#FF5C3A' : 'rgba(255,255,255,0.15)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {bizForm.paymentMode === 'full' && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5C3A' }} />
                      )}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#F0F0FF', fontFamily: "'Inter', sans-serif" }}>
                      Pago completo
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#7070A0', fontFamily: "'Inter', sans-serif", paddingLeft: 28 }}>
                    El cliente paga el 100% del servicio al reservar
                  </p>
                </div>

                {/* Deposit */}
                <div
                  onClick={() => setBizForm({ ...bizForm, paymentMode: 'deposit' })}
                  style={{
                    flex: 1, padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                    background: bizForm.paymentMode === 'deposit' ? 'rgba(255,92,58,0.08)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${bizForm.paymentMode === 'deposit' ? 'rgba(255,92,58,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: `2px solid ${bizForm.paymentMode === 'deposit' ? '#FF5C3A' : 'rgba(255,255,255,0.15)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {bizForm.paymentMode === 'deposit' && (
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF5C3A' }} />
                      )}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#F0F0FF', fontFamily: "'Inter', sans-serif" }}>
                      Anticipo
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: '#7070A0', fontFamily: "'Inter', sans-serif", paddingLeft: 28 }}>
                    El cliente paga un porcentaje al reservar
                  </p>
                </div>
              </div>
            </div>

            {/* Deposit percentage (only when deposit mode) */}
            {bizForm.paymentMode === 'deposit' && (
              <div>
                <label style={labelStyle}>Porcentaje de anticipo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="5"
                    value={bizForm.depositPercentage}
                    onChange={(e) => setBizForm({ ...bizForm, depositPercentage: Number(e.target.value) })}
                    style={{
                      flex: 1, height: 6, borderRadius: 3,
                      appearance: 'none', background: 'rgba(255,255,255,0.1)',
                      cursor: 'pointer',
                      accentColor: '#FF5C3A',
                    }}
                  />
                  <span style={{
                    fontSize: 20, fontWeight: 700, color: '#FF5C3A',
                    fontFamily: "'Inter', sans-serif", minWidth: 52, textAlign: 'right',
                  }}>
                    {bizForm.depositPercentage}%
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#7070A0', fontFamily: "'Inter', sans-serif", marginTop: 6 }}>
                  Ejemplo: Para un servicio de $500, el cliente pagará ${Math.round(500 * bizForm.depositPercentage / 100)} al reservar
                </p>
              </div>
            )}
          </div>
        )}

        {/* Save button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 }}>
          <button
            onClick={handlePaymentSave}
            disabled={paymentSaving}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #FF5C3A, #FF7A52)',
              color: 'white',
              cursor: paymentSaving ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              boxShadow: '0 4px 20px rgba(255,92,58,0.3)',
              opacity: paymentSaving ? 0.6 : 1,
            }}
          >
            {paymentSaving ? 'Guardando...' : 'Guardar pagos'}
          </button>
          {paymentSuccess && (
            <span style={{ fontSize: 14, color: '#00E5A0', fontFamily: "'Inter', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={16} /> Configuración guardada
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
