import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'

const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

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

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0].substring(0, 2).toUpperCase()
}

export default function StaffPage() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  // Form state
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')

  const fetchStaff = () => {
    setLoading(true)
    setError(null)
    apiFetch('/api/staff')
      .then(data => {
        setStaff(Array.isArray(data) ? data : (data.staff || []))
      })
      .catch(err => setError(err.message || 'Error al cargar equipo'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  const resetForm = () => {
    setFormName('')
    setFormEmail('')
    setFormPhone('')
    setEditingMember(null)
  }

  const openCreateModal = () => {
    resetForm()
    setModalOpen(true)
  }

  const openEditModal = (member) => {
    setEditingMember(member)
    setFormName(member.name || '')
    setFormEmail(member.email || '')
    setFormPhone(member.phone || '')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    resetForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formName.trim()) return

    setSaving(true)
    try {
      if (editingMember) {
        await apiFetch(`/api/staff/${editingMember.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formName.trim(),
            phone: formPhone.trim() || null,
          }),
        })
      } else {
        await apiFetch('/api/staff', {
          method: 'POST',
          body: JSON.stringify({
            name: formName.trim(),
            email: formEmail.trim() || null,
            phone: formPhone.trim() || null,
          }),
        })
      }
      closeModal()
      fetchStaff()
    } catch (err) {
      alert(err.message || 'Error al guardar miembro')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (member) => {
    try {
      await apiFetch(`/api/staff/${member.id}`, { method: 'DELETE' })
      setConfirmDeleteId(null)
      fetchStaff()
    } catch (err) {
      alert(err.message || 'Error al desactivar miembro')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <div style={{
          width: 36, height: 36, border: '3px solid rgba(255,92,58,0.2)',
          borderTopColor: '#FF5C3A', borderRadius: '50%',
          margin: '0 auto 16px', animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <p style={{ color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>Cargando equipo...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <p style={{ color: '#FF5C3A', fontSize: 14, marginBottom: 12, fontFamily: 'DM Sans, sans-serif' }}>{error}</p>
        <button
          onClick={fetchStaff}
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
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#F0F0FF', marginBottom: 4 }}>
            Equipo
          </h1>
          <p style={{ color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>
            {staff.length} miembro{staff.length !== 1 ? 's' : ''} registrado{staff.length !== 1 ? 's' : ''}
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
          <IconPlus /> Agregar
        </button>
      </div>

      {/* Staff Cards */}
      <div className="fade-up delay-100" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {staff.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: '48px 24px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>👥</p>
            <p style={{ color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif', marginBottom: 4 }}>
              No hay miembros registrados
            </p>
            <p style={{ color: '#50506A', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
              Agrega a tu primer miembro del equipo
            </p>
          </div>
        ) : (
          staff.map((member, i) => {
            const isOwner = member.role === 'owner'
            const avatarGradient = isOwner
              ? 'linear-gradient(135deg, #FF5C3A, #FF8C42)'
              : 'linear-gradient(135deg, #3B82F6, #60A5FA)'
            const isConfirmingDelete = confirmDeleteId === member.id

            return (
              <div
                key={member.id || i}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 16,
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  transition: 'background 0.15s',
                  opacity: member.is_active === false ? 0.5 : 1,
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              >
                {/* Avatar */}
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: avatarGradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: isOwner
                    ? '0 4px 14px rgba(255,92,58,0.3)'
                    : '0 4px 14px rgba(59,130,246,0.3)',
                }}>
                  <span style={{
                    color: 'white', fontSize: 16, fontWeight: 700,
                    fontFamily: 'Syne, sans-serif', letterSpacing: '0.02em',
                  }}>
                    {getInitials(member.name)}
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <p style={{
                      fontSize: 15, fontWeight: 700, color: '#F0F0FF',
                      fontFamily: 'DM Sans, sans-serif',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {member.name}
                    </p>
                    <span style={{
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '3px 10px', borderRadius: 20,
                      fontFamily: 'DM Sans, sans-serif',
                      background: isOwner ? 'rgba(0,229,160,0.12)' : 'rgba(59,130,246,0.12)',
                      color: isOwner ? '#00E5A0' : '#3B82F6',
                      flexShrink: 0,
                    }}>
                      {isOwner ? 'Dueno' : 'Staff'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    {member.email && (
                      <p style={{ fontSize: 13, color: '#7070A0', fontFamily: 'DM Sans, sans-serif' }}>
                        {member.email}
                      </p>
                    )}
                    {member.phone && (
                      <p style={{ fontSize: 13, color: '#7070A0', fontFamily: 'DM Sans, sans-serif' }}>
                        {member.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions - only for non-owner staff */}
                {!isOwner && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {isConfirmingDelete ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, color: '#FF5C3A', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
                          Confirmar?
                        </span>
                        <button
                          onClick={() => handleDeactivate(member)}
                          style={{
                            padding: '6px 14px', borderRadius: 8, border: 'none',
                            background: 'rgba(255,92,58,0.15)', color: '#FF5C3A',
                            cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            fontFamily: 'DM Sans, sans-serif',
                            transition: 'all 0.15s',
                          }}
                          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,92,58,0.25)'}
                          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,92,58,0.15)'}
                        >
                          Si
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          style={{
                            padding: '6px 14px', borderRadius: 8, border: 'none',
                            background: 'rgba(255,255,255,0.06)', color: '#7070A0',
                            cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            fontFamily: 'DM Sans, sans-serif',
                            transition: 'all 0.15s',
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#F0F0FF' }}
                          onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#7070A0' }}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => openEditModal(member)}
                          style={{
                            width: 34, height: 34, borderRadius: 8, border: 'none',
                            background: 'rgba(255,255,255,0.06)', color: '#7070A0',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.15)'; e.currentTarget.style.color = '#3B82F6' }}
                          onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#7070A0' }}
                          title="Editar"
                        >
                          <IconEdit />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(member.id)}
                          style={{
                            width: 34, height: 34, borderRadius: 8, border: 'none',
                            background: 'rgba(255,255,255,0.06)', color: '#7070A0',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,92,58,0.15)'; e.currentTarget.style.color = '#FF5C3A' }}
                          onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#7070A0' }}
                          title="Desactivar"
                        >
                          <IconTrash />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Modal Overlay */}
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
                {editingMember ? 'Editar miembro' : 'Nuevo miembro'}
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
                <IconX />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Name */}
              <div>
                <label style={labelStyle}>Nombre *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ej: Maria Lopez"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,92,58,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  disabled={!!editingMember}
                  style={{
                    ...inputStyle,
                    ...(editingMember ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
                  }}
                  onFocus={e => { if (!editingMember) e.target.style.borderColor = 'rgba(255,92,58,0.4)' }}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Phone */}
              <div>
                <label style={labelStyle}>Telefono</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={e => setFormPhone(e.target.value)}
                  placeholder="Ej: 55 1234 5678"
                  style={inputStyle}
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
                  {saving ? 'Guardando...' : editingMember ? 'Guardar cambios' : 'Crear miembro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
