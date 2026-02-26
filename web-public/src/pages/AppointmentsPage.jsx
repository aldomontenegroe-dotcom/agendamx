import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const IconX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

const IconXLarge = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

const IconCheckCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const IconBan = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
)

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const statusConfig = {
  confirmed: { label: 'Confirmada', color: '#00E5A0', bg: 'rgba(0,229,160,0.1)' },
  pending:   { label: 'Pendiente',  color: '#FF9500', bg: 'rgba(255,149,0,0.1)' },
  completed: { label: 'Completada', color: '#7070A0', bg: 'rgba(112,112,160,0.1)' },
  cancelled: { label: 'Cancelada',  color: '#FF5C3A', bg: 'rgba(255,92,58,0.1)' },
  no_show:   { label: 'No asistió', color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
}

const filterButtons = [
  { key: '',          label: 'Todas' },
  { key: 'pending',   label: 'Pendientes' },
  { key: 'confirmed', label: 'Confirmadas' },
  { key: 'completed', label: 'Completadas' },
  { key: 'cancelled', label: 'Canceladas' },
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
  transition: 'border-color 0.2s',
}

const labelStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: '#7070A0',
  marginBottom: 6,
  display: 'block',
  fontFamily: 'DM Sans, sans-serif',
}

function getTodayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function formatTime(isoStr) {
  if (!isoStr) return '--:--'
  const d = new Date(isoStr)
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function getInitials(name) {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState(getTodayStr())
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [services, setServices] = useState([])
  const [saving, setSaving] = useState(false)

  // Create form state
  const [formServiceId, setFormServiceId] = useState('')
  const [formClientName, setFormClientName] = useState('')
  const [formClientPhone, setFormClientPhone] = useState('')
  const [formDate, setFormDate] = useState(getTodayStr())
  const [formTime, setFormTime] = useState('')
  const [formNotes, setFormNotes] = useState('')

  const fetchAppointments = () => {
    setLoading(true)
    setError(null)
    let url = `/api/appointments?date=${selectedDate}`
    if (statusFilter) url += `&status=${statusFilter}`
    apiFetch(url)
      .then(data => {
        const list = Array.isArray(data) ? data : (data.appointments || [])
        list.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
        setAppointments(list)
      })
      .catch(err => setError(err.message || 'Error al cargar citas'))
      .finally(() => setLoading(false))
  }

  const fetchServices = () => {
    apiFetch('/api/services')
      .then(data => {
        const list = Array.isArray(data) ? data : (data.services || [])
        setServices(list.filter(s => s.is_active !== false))
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchAppointments()
  }, [selectedDate, statusFilter])

  const handleStatusChange = async (apptId, newStatus) => {
    try {
      await apiFetch(`/api/appointments/${apptId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      fetchAppointments()
    } catch (err) {
      alert(err.message || 'Error al actualizar estado')
    }
  }

  const openCreateModal = () => {
    setFormServiceId('')
    setFormClientName('')
    setFormClientPhone('')
    setFormDate(selectedDate)
    setFormTime('')
    setFormNotes('')
    fetchServices()
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!formServiceId || !formClientName.trim() || !formDate || !formTime) return

    const startsAt = new Date(`${formDate}T${formTime}:00`).toISOString()

    setSaving(true)
    try {
      await apiFetch('/api/appointments', {
        method: 'POST',
        body: JSON.stringify({
          serviceId: formServiceId,
          clientName: formClientName.trim(),
          clientPhone: formClientPhone.trim() || null,
          startsAt,
          staffNotes: formNotes.trim() || null,
        }),
      })
      closeModal()
      setSelectedDate(formDate)
      fetchAppointments()
    } catch (err) {
      alert(err.message || 'Error al crear cita')
    } finally {
      setSaving(false)
    }
  }

  const dateDisplay = (() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number)
      const date = new Date(y, m - 1, d)
      const str = date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
      return str.charAt(0).toUpperCase() + str.slice(1)
    } catch {
      return selectedDate
    }
  })()

  if (loading && appointments.length === 0) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{
          width: 36, height: 36, border: '3px solid rgba(255,92,58,0.2)',
          borderTopColor: '#FF5C3A', borderRadius: '50%',
          margin: '0 auto 16px', animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p style={{ color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>Cargando citas...</p>
      </div>
    )
  }

  if (error && appointments.length === 0) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <p style={{ color: '#FF5C3A', fontSize: 14, marginBottom: 12, fontFamily: 'DM Sans, sans-serif' }}>{error}</p>
        <button
          onClick={fetchAppointments}
          style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,92,58,0.3)',
            background: 'rgba(255,92,58,0.1)', color: '#FF5C3A', cursor: 'pointer',
            fontSize: 13, fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '40px 0' }}>
      {/* Header */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#F0F0FF', marginBottom: 4 }}>
            Citas
          </h1>
          <p style={{ color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>
            {appointments.length} cita{appointments.length !== 1 ? 's' : ''} {statusFilter ? `(${filterButtons.find(f => f.key === statusFilter)?.label || statusFilter})` : ''} &middot; {dateDisplay}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #FF5C3A, #FF7A52)',
            color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            fontFamily: 'DM Sans, sans-serif',
            boxShadow: '0 4px 20px rgba(255,92,58,0.3)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,92,58,0.4)' }}
          onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,92,58,0.3)' }}
        >
          <IconPlus /> Nueva cita
        </button>
      </div>

      {/* Date Selector + Status Filters */}
      <div className="fade-up delay-100" style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {/* Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              color: '#F0F0FF',
              padding: '9px 14px',
              fontSize: 14,
              fontFamily: 'DM Sans, sans-serif',
              outline: 'none',
              cursor: 'pointer',
              colorScheme: 'dark',
            }}
          />
          <button
            onClick={() => setSelectedDate(getTodayStr())}
            style={{
              padding: '9px 16px', borderRadius: 10,
              border: selectedDate === getTodayStr() ? '1px solid rgba(255,92,58,0.3)' : '1px solid rgba(255,255,255,0.1)',
              background: selectedDate === getTodayStr() ? 'rgba(255,92,58,0.1)' : 'rgba(255,255,255,0.04)',
              color: selectedDate === getTodayStr() ? '#FF5C3A' : '#7070A0',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
              fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            Hoy
          </button>
        </div>

        {/* Status Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {filterButtons.map(fb => {
            const isActive = statusFilter === fb.key
            return (
              <button
                key={fb.key}
                onClick={() => setStatusFilter(fb.key)}
                style={{
                  padding: '7px 16px', borderRadius: 8,
                  border: isActive ? '1px solid rgba(255,92,58,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  background: isActive ? 'rgba(255,92,58,0.12)' : 'rgba(255,255,255,0.03)',
                  color: isActive ? '#FF5C3A' : '#7070A0',
                  cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 600 : 400,
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.color = '#F0F0FF'
                  }
                }}
                onMouseOut={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    e.currentTarget.style.color = '#7070A0'
                  }
                }}
              >
                {fb.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Appointments List */}
      <div className="fade-up delay-200" style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        {loading && (
          <div style={{ padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 14, height: 14, border: '2px solid rgba(255,92,58,0.2)',
              borderTopColor: '#FF5C3A', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <span style={{ fontSize: 12, color: '#7070A0', fontFamily: 'DM Sans, sans-serif' }}>Actualizando...</span>
          </div>
        )}

        {appointments.length === 0 && !loading ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📅</p>
            <p style={{ color: '#7070A0', fontSize: 15, fontFamily: 'DM Sans, sans-serif', fontWeight: 500, marginBottom: 4 }}>
              No hay citas para esta fecha
            </p>
            <p style={{ color: '#50506A', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
              Selecciona otra fecha o crea una nueva cita
            </p>
          </div>
        ) : (
          appointments.map((appt, i) => {
            const st = statusConfig[appt.status] || statusConfig.pending
            const time = formatTime(appt.starts_at)
            const endTime = formatTime(appt.ends_at)
            const name = appt.client_name || 'Sin nombre'
            const initials = getInitials(appt.client_name)
            const service = appt.service_name || 'Sin servicio'
            const price = appt.price != null ? appt.price : 0
            const serviceColor = appt.service_color || '#3B82F6'

            const canConfirm = appt.status === 'pending'
            const canCancel = appt.status === 'pending' || appt.status === 'confirmed'
            const canComplete = appt.status === 'confirmed'

            return (
              <div
                key={appt.id || i}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '16px 24px',
                  borderBottom: i < appointments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Time column */}
                <div style={{ minWidth: 56, textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#FF5C3A' }}>
                    {time}
                  </p>
                  {appt.ends_at && (
                    <p style={{ fontSize: 11, color: '#50506A', fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>
                      {endTime}
                    </p>
                  )}
                </div>

                {/* Initials avatar */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${serviceColor}44, ${serviceColor}22)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: serviceColor,
                  border: `1px solid ${serviceColor}33`,
                }}>
                  {initials}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#F0F0FF', fontFamily: 'DM Sans, sans-serif', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: serviceColor, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 13, color: '#7070A0', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {service} &middot; {appt.duration_min || '?'} min
                    </span>
                  </div>
                </div>

                {/* Status badge */}
                <div style={{
                  padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  background: st.bg, color: st.color,
                  fontFamily: 'DM Sans, sans-serif',
                  whiteSpace: 'nowrap',
                }}>
                  {st.label}
                </div>

                {/* Price */}
                <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#F0F0FF', minWidth: 72, textAlign: 'right' }}>
                  ${Number(price).toLocaleString('es-MX')}
                </span>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 6, minWidth: 110, justifyContent: 'flex-end' }}>
                  {canConfirm && (
                    <button
                      onClick={() => handleStatusChange(appt.id, 'confirmed')}
                      title="Confirmar"
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none',
                        background: 'rgba(0,229,160,0.12)', color: '#00E5A0',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(0,229,160,0.25)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(0,229,160,0.12)'}
                    >
                      <IconCheck />
                    </button>
                  )}
                  {canComplete && (
                    <button
                      onClick={() => handleStatusChange(appt.id, 'completed')}
                      title="Completar"
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none',
                        background: 'rgba(139,92,246,0.12)', color: '#8B5CF6',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(139,92,246,0.25)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(139,92,246,0.12)'}
                    >
                      <IconCheckCircle />
                    </button>
                  )}
                  {canCancel && (
                    <button
                      onClick={() => handleStatusChange(appt.id, 'cancelled')}
                      title="Cancelar"
                      style={{
                        width: 32, height: 32, borderRadius: 8, border: 'none',
                        background: 'rgba(255,92,58,0.12)', color: '#FF5C3A',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255,92,58,0.25)'}
                      onMouseOut={e => e.currentTarget.style.background = 'rgba(255,92,58,0.12)'}
                    >
                      <IconX />
                    </button>
                  )}
                  {appt.status === 'completed' || appt.status === 'cancelled' || appt.status === 'no_show' ? (
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)', color: '#50506A',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <IconBan />
                    </div>
                  ) : null}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create Appointment Modal */}
      {modalOpen && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <style>{`
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
          `}</style>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#13131A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '32px',
              width: '100%',
              maxWidth: 480,
              maxHeight: '90vh',
              overflow: 'auto',
              animation: 'slideUp 0.25s ease',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#F0F0FF' }}>
                Nueva cita
              </h2>
              <button
                onClick={closeModal}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: 'none',
                  background: 'rgba(255,255,255,0.06)', color: '#7070A0',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,92,58,0.15)'; e.currentTarget.style.color = '#FF5C3A' }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#7070A0' }}
              >
                <IconXLarge />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Service dropdown */}
              <div>
                <label style={labelStyle}>Servicio *</label>
                <select
                  required
                  value={formServiceId}
                  onChange={e => setFormServiceId(e.target.value)}
                  style={{
                    ...inputStyle,
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%237070A0' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 14px center',
                    paddingRight: 36,
                    cursor: 'pointer',
                  }}
                >
                  <option value="" style={{ background: '#13131A' }}>Seleccionar servicio...</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id} style={{ background: '#13131A' }}>
                      {s.name} — {s.duration_min} min {s.price ? `· $${s.price}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Name */}
              <div>
                <label style={labelStyle}>Nombre del cliente *</label>
                <input
                  type="text"
                  required
                  value={formClientName}
                  onChange={e => setFormClientName(e.target.value)}
                  placeholder="Nombre completo"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,92,58,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Client Phone */}
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input
                  type="tel"
                  value={formClientPhone}
                  onChange={e => setFormClientPhone(e.target.value)}
                  placeholder="55 1234 5678"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,92,58,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Date + Time row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Fecha *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    style={{ ...inputStyle, colorScheme: 'dark', cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,92,58,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Hora *</label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    style={{ ...inputStyle, colorScheme: 'dark', cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,92,58,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={labelStyle}>Notas</label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Notas internas sobre la cita..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,92,58,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    flex: 1, padding: '12px 20px', borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)', color: '#7070A0',
                    cursor: 'pointer', fontSize: 14, fontWeight: 600,
                    fontFamily: 'DM Sans, sans-serif',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#F0F0FF' }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#7070A0' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1, padding: '12px 20px', borderRadius: 10, border: 'none',
                    background: saving ? 'rgba(255,92,58,0.3)' : 'linear-gradient(135deg, #FF5C3A, #FF7A52)',
                    color: 'white', cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: 14, fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
                    boxShadow: saving ? 'none' : '0 4px 20px rgba(255,92,58,0.3)',
                    transition: 'all 0.15s',
                  }}
                >
                  {saving ? 'Creando...' : 'Agendar cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
