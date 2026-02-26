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

export default function ServicesPage() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formDuration, setFormDuration] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formColor, setFormColor] = useState('#3B82F6')

  const fetchServices = () => {
    setLoading(true)
    setError(null)
    apiFetch('/api/services')
      .then(data => {
        setServices(Array.isArray(data) ? data : (data.services || []))
      })
      .catch(err => setError(err.message || 'Error al cargar servicios'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const resetForm = () => {
    setFormName('')
    setFormDescription('')
    setFormDuration('')
    setFormPrice('')
    setFormColor('#3B82F6')
    setEditingService(null)
  }

  const openCreateModal = () => {
    resetForm()
    setModalOpen(true)
  }

  const openEditModal = (service) => {
    setEditingService(service)
    setFormName(service.name || '')
    setFormDescription(service.description || '')
    setFormDuration(service.duration_min != null ? String(service.duration_min) : '')
    setFormPrice(service.price != null ? String(service.price) : '')
    setFormColor(service.color || '#3B82F6')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    resetForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formName.trim() || !formDuration) return

    setSaving(true)
    try {
      if (editingService) {
        await apiFetch(`/api/services/${editingService.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: formName.trim(),
            description: formDescription.trim(),
            durationMin: parseInt(formDuration, 10),
            price: formPrice ? parseFloat(formPrice) : null,
            color: formColor,
            isActive: editingService.is_active,
          }),
        })
      } else {
        await apiFetch('/api/services', {
          method: 'POST',
          body: JSON.stringify({
            name: formName.trim(),
            description: formDescription.trim(),
            durationMin: parseInt(formDuration, 10),
            price: formPrice ? parseFloat(formPrice) : null,
            color: formColor,
          }),
        })
      }
      closeModal()
      fetchServices()
    } catch (err) {
      alert(err.message || 'Error al guardar servicio')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (service) => {
    if (!window.confirm(`¿Eliminar el servicio "${service.name}"? Se desactivará y ya no estará disponible para nuevas citas.`)) return
    try {
      await apiFetch(`/api/services/${service.id}`, { method: 'DELETE' })
      fetchServices()
    } catch (err) {
      alert(err.message || 'Error al eliminar servicio')
    }
  }

  const handleToggleActive = async (service) => {
    try {
      await apiFetch(`/api/services/${service.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: service.name,
          description: service.description,
          durationMin: service.duration_min,
          price: service.price,
          color: service.color,
          isActive: !service.is_active,
        }),
      })
      fetchServices()
    } catch (err) {
      alert(err.message || 'Error al actualizar servicio')
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
        <p style={{ color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>Cargando servicios...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <p style={{ color: '#FF5C3A', fontSize: 14, marginBottom: 12, fontFamily: 'DM Sans, sans-serif' }}>{error}</p>
        <button
          onClick={fetchServices}
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
            Servicios
          </h1>
          <p style={{ color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>
            {services.length} servicio{services.length !== 1 ? 's' : ''} registrado{services.length !== 1 ? 's' : ''}
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
          <IconPlus /> Agregar servicio
        </button>
      </div>

      {/* Services Table */}
      <div className="fade-up delay-100" style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '44px 1fr 120px 120px 110px 100px',
          padding: '14px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#7070A0', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'DM Sans, sans-serif' }}>
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#7070A0', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'DM Sans, sans-serif' }}>
            Nombre
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#7070A0', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'DM Sans, sans-serif' }}>
            Duración
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#7070A0', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'DM Sans, sans-serif' }}>
            Precio
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#7070A0', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'DM Sans, sans-serif' }}>
            Estado
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#7070A0', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'DM Sans, sans-serif', textAlign: 'right' }}>
            Acciones
          </span>
        </div>

        {/* Table Rows */}
        {services.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>✨</p>
            <p style={{ color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif', marginBottom: 4 }}>
              No hay servicios registrados
            </p>
            <p style={{ color: '#50506A', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
              Agrega tu primer servicio para comenzar
            </p>
          </div>
        ) : (
          services.map((service, i) => (
            <div
              key={service.id || i}
              style={{
                display: 'grid',
                gridTemplateColumns: '44px 1fr 120px 120px 110px 100px',
                padding: '16px 24px',
                alignItems: 'center',
                borderBottom: i < services.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                transition: 'background 0.15s',
                opacity: service.is_active === false ? 0.5 : 1,
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Color dot */}
              <div>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: service.color || '#3B82F6',
                  boxShadow: `0 0 8px ${service.color || '#3B82F6'}44`,
                }} />
              </div>

              {/* Name + Description */}
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#F0F0FF', fontFamily: 'DM Sans, sans-serif', marginBottom: 2 }}>
                  {service.name}
                </p>
                {service.description && (
                  <p style={{ fontSize: 12, color: '#7070A0', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.4 }}>
                    {service.description.length > 60 ? service.description.substring(0, 60) + '...' : service.description}
                  </p>
                )}
              </div>

              {/* Duration */}
              <span style={{ fontSize: 14, color: '#F0F0FF', fontFamily: 'DM Sans, sans-serif' }}>
                {service.duration_min} min
              </span>

              {/* Price */}
              <span style={{ fontSize: 14, fontWeight: 600, color: '#F0F0FF', fontFamily: 'Syne, sans-serif' }}>
                {service.price != null ? `$${Number(service.price).toLocaleString('es-MX')}` : '—'}
              </span>

              {/* Status Toggle */}
              <div>
                <button
                  onClick={() => handleToggleActive(service)}
                  style={{
                    position: 'relative',
                    width: 44, height: 24, borderRadius: 12, border: 'none',
                    background: service.is_active !== false
                      ? 'rgba(0,229,160,0.25)'
                      : 'rgba(255,255,255,0.08)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    padding: 0,
                  }}
                  title={service.is_active !== false ? 'Activo — clic para desactivar' : 'Inactivo — clic para activar'}
                >
                  <div style={{
                    position: 'absolute',
                    top: 3, left: service.is_active !== false ? 22 : 3,
                    width: 18, height: 18, borderRadius: '50%',
                    background: service.is_active !== false ? '#00E5A0' : '#7070A0',
                    transition: 'left 0.2s, background 0.2s',
                    boxShadow: service.is_active !== false ? '0 2px 8px rgba(0,229,160,0.4)' : 'none',
                  }} />
                </button>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => openEditModal(service)}
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
                  onClick={() => handleDelete(service)}
                  style={{
                    width: 34, height: 34, borderRadius: 8, border: 'none',
                    background: 'rgba(255,255,255,0.06)', color: '#7070A0',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,92,58,0.15)'; e.currentTarget.style.color = '#FF5C3A' }}
                  onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#7070A0' }}
                  title="Eliminar"
                >
                  <IconTrash />
                </button>
              </div>
            </div>
          ))
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
                {editingService ? 'Editar servicio' : 'Nuevo servicio'}
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
                <label style={labelStyle}>Nombre del servicio *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ej: Corte de cabello"
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,92,58,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Descripción</label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Descripción opcional del servicio..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
                  onFocus={e => e.target.style.borderColor = 'rgba(255,92,58,0.4)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              {/* Duration + Price row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Duración (min) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formDuration}
                    onChange={e => setFormDuration(e.target.value)}
                    placeholder="30"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,92,58,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Precio (MXN)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    placeholder="250"
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,92,58,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              </div>

              {/* Color */}
              <div>
                <label style={labelStyle}>Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    type="color"
                    value={formColor}
                    onChange={e => setFormColor(e.target.value)}
                    style={{
                      width: 44, height: 44, borderRadius: 10, border: '2px solid rgba(255,255,255,0.1)',
                      background: 'transparent', cursor: 'pointer', padding: 2,
                    }}
                  />
                  <div style={{
                    flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap',
                  }}>
                    {['#3B82F6', '#FF5C3A', '#00E5A0', '#FF9500', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormColor(c)}
                        style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: c, border: formColor === c ? '2px solid #F0F0FF' : '2px solid transparent',
                          cursor: 'pointer', transition: 'transform 0.15s',
                          boxShadow: formColor === c ? `0 0 12px ${c}44` : 'none',
                        }}
                        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.15)'}
                        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                      />
                    ))}
                  </div>
                </div>
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
                  {saving ? 'Guardando...' : editingService ? 'Guardar cambios' : 'Crear servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
