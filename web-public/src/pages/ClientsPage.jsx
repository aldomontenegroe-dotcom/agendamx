import { useState, useEffect, useRef, useCallback } from 'react'
import { apiFetch } from '../utils/api'

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

const IconNote = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
)

const statusConfig = {
  confirmed: { label: 'Confirmada', color: '#00E5A0', bg: 'rgba(0,229,160,0.1)' },
  pending:   { label: 'Pendiente',  color: '#FF9500', bg: 'rgba(255,149,0,0.1)' },
  completed: { label: 'Completada', color: '#7070A0', bg: 'rgba(112,112,160,0.1)' },
  cancelled: { label: 'Cancelada',  color: '#FF5C3A', bg: 'rgba(255,92,58,0.1)' },
}

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

function getInitials(name) {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const debounceRef = useRef(null)

  const fetchClients = useCallback((query = '') => {
    setLoading(true)
    setError(null)
    const params = query ? `?search=${encodeURIComponent(query)}` : ''
    apiFetch(`/api/clients${params}`)
      .then(data => {
        setClients(data.clients || [])
      })
      .catch(err => {
        setError(err.message || 'Error al cargar clientes')
        setClients([])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const handleSearchChange = (value) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchClients(value)
    }, 300)
  }

  const fetchDetail = (clientId) => {
    setDetailLoading(true)
    apiFetch(`/api/clients/${clientId}`)
      .then(data => {
        setDetail(data)
        setEditing(false)
        setEditForm({
          name: data.client.name || '',
          phone: data.client.phone || '',
          email: data.client.email || '',
          notes: data.client.notes || '',
        })
      })
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false))
  }

  const handleSelectClient = (client) => {
    if (selectedId === client.id) {
      setSelectedId(null)
      setDetail(null)
      setEditing(false)
      return
    }
    setSelectedId(client.id)
    fetchDetail(client.id)
  }

  const handleSave = () => {
    if (!selectedId) return
    setSaving(true)
    apiFetch(`/api/clients/${selectedId}`, {
      method: 'PUT',
      body: JSON.stringify(editForm),
    })
      .then(() => {
        setEditing(false)
        fetchDetail(selectedId)
        fetchClients(search)
      })
      .catch(err => alert(err.message || 'Error al guardar'))
      .finally(() => setSaving(false))
  }

  const client = detail?.client
  const appointments = detail?.appointments || []

  return (
    <div style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#F0F0FF', marginBottom: 4 }}>
            Clientes
          </h1>
          <p style={{ color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>
            {loading ? 'Cargando...' : `${clients.length} cliente${clients.length !== 1 ? 's' : ''} registrado${clients.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: 24, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#7070A0' }}>
          <IconSearch />
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o email..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{
            ...inputStyle,
            paddingLeft: 42,
            width: '100%',
            maxWidth: 480,
          }}
        />
      </div>

      {error && (
        <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(255,92,58,0.1)', border: '1px solid rgba(255,92,58,0.2)', marginBottom: 20 }}>
          <p style={{ color: '#FF5C3A', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>{error}</p>
        </div>
      )}

      {/* Main layout: list + detail */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Client list */}
        <div style={{ flex: '1 1 400px', minWidth: 320 }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
            overflow: 'hidden',
          }}>
            {loading ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <p style={{ color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>Cargando clientes...</p>
              </div>
            ) : clients.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: 36, marginBottom: 12 }}>{search ? '\uD83D\uDD0D' : '\uD83D\uDC65'}</p>
                <p style={{ color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>
                  {search ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                </p>
              </div>
            ) : (
              clients.map((c, i) => {
                const isSelected = selectedId === c.id
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectClient(c)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 20px',
                      cursor: 'pointer',
                      borderBottom: i < clients.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      background: isSelected ? 'rgba(255,92,58,0.08)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={(e) => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseOut={(e) => !isSelected && (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: isSelected
                        ? 'linear-gradient(135deg, #FF5C3A, #FF7A52)'
                        : 'linear-gradient(135deg, rgba(255,92,58,0.25), rgba(255,140,66,0.25))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      color: isSelected ? '#fff' : '#FF8C42',
                      border: `1px solid ${isSelected ? 'rgba(255,92,58,0.4)' : 'rgba(255,92,58,0.15)'}`,
                      fontFamily: 'Syne, sans-serif',
                    }}>
                      {getInitials(c.name)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#F0F0FF',
                        fontFamily: 'DM Sans, sans-serif',
                        marginBottom: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {c.name}
                      </p>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {c.phone && (
                          <span style={{ fontSize: 12, color: '#7070A0', fontFamily: 'DM Sans, sans-serif' }}>
                            {c.phone}
                          </span>
                        )}
                        {c.email && (
                          <span style={{ fontSize: 12, color: '#7070A0', fontFamily: 'DM Sans, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Visits badge */}
                    {c.total_visits > 0 && (
                      <div style={{
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: 'rgba(0,229,160,0.1)',
                        border: '1px solid rgba(0,229,160,0.2)',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#00E5A0',
                        fontFamily: 'DM Sans, sans-serif',
                        whiteSpace: 'nowrap',
                      }}>
                        {c.total_visits} visita{c.total_visits !== 1 ? 's' : ''}
                      </div>
                    )}

                    {/* Last visit */}
                    {c.last_visit_at && (
                      <span style={{ fontSize: 12, color: '#7070A0', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
                        {formatDate(c.last_visit_at)}
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selectedId && (
          <div style={{ flex: '1 1 360px', minWidth: 320, maxWidth: 480 }}>
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16,
              overflow: 'hidden',
            }}>
              {detailLoading ? (
                <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <p style={{ color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>Cargando detalles...</p>
                </div>
              ) : !client ? (
                <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <p style={{ color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>Error al cargar cliente</p>
                </div>
              ) : (
                <>
                  {/* Client header */}
                  <div style={{
                    padding: '24px 24px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}>
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                      <div style={{
                        width: 52,
                        height: 52,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FF5C3A, #FF7A52)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#fff',
                        fontFamily: 'Syne, sans-serif',
                        boxShadow: '0 4px 20px rgba(255,92,58,0.3)',
                      }}>
                        {getInitials(client.name)}
                      </div>
                      <div>
                        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800, color: '#F0F0FF' }}>
                          {client.name}
                        </h2>
                        <p style={{ fontSize: 12, color: '#7070A0', fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>
                          Cliente desde {formatDate(client.created_at)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (editing) {
                          setEditing(false)
                        } else {
                          setEditForm({
                            name: client.name || '',
                            phone: client.phone || '',
                            email: client.email || '',
                            notes: client.notes || '',
                          })
                          setEditing(true)
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: editing ? '1px solid rgba(255,92,58,0.3)' : '1px solid rgba(255,255,255,0.1)',
                        background: editing ? 'rgba(255,92,58,0.1)' : 'rgba(255,255,255,0.04)',
                        color: editing ? '#FF5C3A' : '#F0F0FF',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontFamily: 'DM Sans, sans-serif',
                        fontWeight: 500,
                      }}
                    >
                      {editing ? <><IconX /> Cancelar</> : <><IconEdit /> Editar</>}
                    </button>
                  </div>

                  {/* Client info or edit form */}
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {editing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, color: '#7070A0', marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>
                            Nombre
                          </label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, color: '#7070A0', marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>
                            Teléfono
                          </label>
                          <input
                            type="text"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, color: '#7070A0', marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>
                            Email
                          </label>
                          <input
                            type="text"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 12, color: '#7070A0', marginBottom: 6, fontFamily: 'DM Sans, sans-serif' }}>
                            Notas
                          </label>
                          <textarea
                            value={editForm.notes}
                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                            rows={3}
                            style={{ ...inputStyle, resize: 'vertical' }}
                          />
                        </div>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          style={{
                            padding: '10px 20px',
                            borderRadius: 10,
                            border: 'none',
                            background: 'linear-gradient(135deg, #FF5C3A, #FF7A52)',
                            color: 'white',
                            cursor: saving ? 'not-allowed' : 'pointer',
                            fontSize: 14,
                            fontWeight: 600,
                            fontFamily: 'DM Sans, sans-serif',
                            boxShadow: '0 4px 20px rgba(255,92,58,0.3)',
                            opacity: saving ? 0.6 : 1,
                            alignSelf: 'flex-start',
                          }}
                        >
                          {saving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {client.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ color: '#7070A0' }}><IconPhone /></span>
                            <span style={{ fontSize: 14, color: '#F0F0FF', fontFamily: 'DM Sans, sans-serif' }}>{client.phone}</span>
                          </div>
                        )}
                        {client.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ color: '#7070A0' }}><IconMail /></span>
                            <span style={{ fontSize: 14, color: '#F0F0FF', fontFamily: 'DM Sans, sans-serif' }}>{client.email}</span>
                          </div>
                        )}
                        {client.notes && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <span style={{ color: '#7070A0', marginTop: 2 }}><IconNote /></span>
                            <span style={{ fontSize: 14, color: '#F0F0FF', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5 }}>{client.notes}</span>
                          </div>
                        )}
                        {!client.phone && !client.email && !client.notes && (
                          <p style={{ fontSize: 13, color: '#7070A0', fontFamily: 'DM Sans, sans-serif' }}>Sin información de contacto</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Appointment history */}
                  <div style={{ padding: '20px 24px' }}>
                    <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, color: '#F0F0FF', marginBottom: 14 }}>
                      Historial de citas
                    </h3>
                    {appointments.length === 0 ? (
                      <p style={{ fontSize: 13, color: '#7070A0', fontFamily: 'DM Sans, sans-serif' }}>
                        Sin citas registradas
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {appointments.map((appt) => {
                          const st = statusConfig[appt.status] || statusConfig.pending
                          return (
                            <div
                              key={appt.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '10px 14px',
                                borderRadius: 10,
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.04)',
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: '#F0F0FF',
                                  fontFamily: 'DM Sans, sans-serif',
                                  marginBottom: 2,
                                }}>
                                  {appt.service_name || 'Sin servicio'}
                                </p>
                                <p style={{ fontSize: 12, color: '#7070A0', fontFamily: 'DM Sans, sans-serif' }}>
                                  {formatDateTime(appt.starts_at)}
                                </p>
                              </div>
                              <div style={{
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                background: st.bg,
                                color: st.color,
                                fontFamily: 'DM Sans, sans-serif',
                                whiteSpace: 'nowrap',
                              }}>
                                {st.label}
                              </div>
                              {appt.price != null && (
                                <span style={{
                                  fontFamily: 'Syne, sans-serif',
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: '#F0F0FF',
                                  minWidth: 56,
                                  textAlign: 'right',
                                }}>
                                  ${appt.price}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
