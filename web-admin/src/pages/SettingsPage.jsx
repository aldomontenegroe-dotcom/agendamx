import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'

const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

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
  fontFamily: 'DM Sans, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  color: '#7070A0',
  marginBottom: 6,
  fontFamily: 'DM Sans, sans-serif',
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
  })
  const [bizSaving, setBizSaving] = useState(false)
  const [bizSuccess, setBizSuccess] = useState(false)

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
        })
      })
      .catch(() => {})
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
      .catch(() => {})
      .finally(() => setHoursLoading(false))
  }, [])

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
      .catch(() => {})
  }

  const bookingUrl = `https://agendamx.net/${business?.slug || ''}`

  return (
    <div style={{ padding: 0, maxWidth: 820 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#F0F0FF', marginBottom: 4 }}>
          Ajustes
        </h1>
        <p style={{ color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>
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
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#F0F0FF', marginBottom: 24 }}>
          Datos del Negocio
        </h2>

        {bizLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p style={{ color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>Cargando datos del negocio...</p>
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
                  <span style={{ fontSize: 14, color: '#F0F0FF', fontFamily: 'DM Sans, sans-serif' }}>
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
                  fontFamily: 'DM Sans, sans-serif',
                  boxShadow: '0 4px 20px rgba(255,92,58,0.3)',
                  opacity: bizSaving || !bizForm.name.trim() ? 0.6 : 1,
                }}
              >
                {bizSaving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              {bizSuccess && (
                <span style={{ fontSize: 14, color: '#00E5A0', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconCheck /> Cambios guardados
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
                <p style={{ fontSize: 12, color: '#7070A0', marginBottom: 8, fontFamily: 'DM Sans, sans-serif' }}>
                  Enlace público de reservas
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    flex: 1,
                    fontSize: 14,
                    color: '#FF5C3A',
                    fontFamily: 'DM Sans, sans-serif',
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
                      fontFamily: 'DM Sans, sans-serif',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s',
                    }}
                  >
                    {linkCopied ? <><IconCheck /> Copiado</> : <><IconCopy /> Copiar enlace</>}
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
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#F0F0FF', marginBottom: 24 }}>
          Horarios de Operación
        </h2>

        {hoursLoading ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <p style={{ color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>Cargando horarios...</p>
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
                    fontFamily: 'DM Sans, sans-serif',
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
                    fontFamily: 'DM Sans, sans-serif',
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
                    <span style={{ fontSize: 13, color: '#7070A0', fontFamily: 'DM Sans, sans-serif' }}>a</span>
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
                  fontFamily: 'DM Sans, sans-serif',
                  boxShadow: '0 4px 20px rgba(255,92,58,0.3)',
                  opacity: hoursSaving ? 0.6 : 1,
                }}
              >
                {hoursSaving ? 'Guardando...' : 'Guardar horarios'}
              </button>
              {hoursSuccess && (
                <span style={{ fontSize: 14, color: '#00E5A0', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IconCheck /> Horarios guardados
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
