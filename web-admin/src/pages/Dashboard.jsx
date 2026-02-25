import { useState } from 'react'

const IconCalendar  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IconUsers     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IconDollar    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
const IconBell      = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
const IconSettings  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07"/><path d="M4.93 4.93A10 10 0 0 1 19.07 19.07"/><path d="m12 2 .5 3"/><path d="m12 22-.5-3"/><path d="m2 12 3-.5"/><path d="m22 12-3 .5"/><path d="m4.93 4.93 2.12 2.12"/><path d="m16.95 16.95 2.12 2.12"/><path d="m4.93 19.07 2.12-2.12"/><path d="m16.95 7.05 2.12-2.12"/></svg>
const IconCheck     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
const IconX         = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
const IconTrend     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>

// Datos mock del día
const todayAppointments = [
  { time: '9:00', name: 'María García',   service: 'Corte + Tinte',    status: 'confirmed', price: 450, avatar: 'MG' },
  { time: '10:30', name: 'Carlos López',  service: 'Barba clásica',    status: 'confirmed', price: 180, avatar: 'CL' },
  { time: '11:00', name: 'Ana Torres',    service: 'Uñas gel',         status: 'pending',   price: 320, avatar: 'AT' },
  { time: '13:00', name: 'Luis Mendoza',  service: 'Corte caballero',  status: 'confirmed', price: 150, avatar: 'LM' },
  { time: '14:30', name: 'Sofia Ruiz',    service: 'Peinado + Brushing',status: 'completed', price: 280, avatar: 'SR' },
  { time: '16:00', name: 'Diego Vargas',  service: 'Tinte completo',   status: 'confirmed', price: 520, avatar: 'DV' },
  { time: '17:30', name: 'Valentina Cruz',service: 'Tratamiento keratina', status: 'pending', price: 750, avatar: 'VC' },
]

const navItems = [
  { id: 'dashboard', label: 'Dashboard',  icon: <IconCalendar /> },
  { id: 'citas',     label: 'Citas',      icon: <IconCalendar /> },
  { id: 'clientes',  label: 'Clientes',   icon: <IconUsers />    },
  { id: 'ingresos',  label: 'Ingresos',   icon: <IconDollar />   },
  { id: 'ajustes',   label: 'Ajustes',    icon: <IconSettings /> },
]

const statusConfig = {
  confirmed: { label: 'Confirmada', color: '#00E5A0', bg: 'rgba(0,229,160,0.1)' },
  pending:   { label: 'Pendiente',  color: '#FF9500', bg: 'rgba(255,149,0,0.1)' },
  completed: { label: 'Completada', color: '#7070A0', bg: 'rgba(112,112,160,0.1)' },
  cancelled: { label: 'Cancelada',  color: '#FF5C3A', bg: 'rgba(255,92,58,0.1)' },
}

export default function Dashboard({ user, onLogout }) {
  const [activeNav, setActiveNav] = useState('dashboard')
  const [selected, setSelected]   = useState(null)

  const totalHoy = todayAppointments.reduce((s, a) => s + a.price, 0)
  const confirmed = todayAppointments.filter(a => a.status === 'confirmed').length
  const pending   = todayAppointments.filter(a => a.status === 'pending').length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <div className="mesh-bg" />

      {/* ── Sidebar ── */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'rgba(15,15,26,0.95)', backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 16px', position: 'relative', zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 36 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg, #FF5C3A, #FF8C42)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', boxShadow: '0 4px 16px rgba(255,92,58,0.35)',
            flexShrink: 0,
          }}>
            <IconCalendar />
          </div>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700 }}>
            agenda<span style={{ color: '#FF5C3A' }}>MX</span>
          </span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveNav(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 12px', borderRadius: 10, border: 'none',
                background: activeNav === item.id ? 'rgba(255,92,58,0.12)' : 'transparent',
                color: activeNav === item.id ? '#FF5C3A' : '#7070A0',
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                fontSize: 14, fontWeight: activeNav === item.id ? 600 : 400,
                textAlign: 'left', transition: 'all 0.15s',
                boxShadow: activeNav === item.id ? 'inset 0 0 0 1px rgba(255,92,58,0.2)' : 'none',
              }}
              onMouseOver={e => activeNav !== item.id && (e.currentTarget.style.background = 'rgba(255,255,255,0.04)', e.currentTarget.style.color = '#F0F0FF')}
              onMouseOut={e => activeNav !== item.id && (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = '#7070A0')}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* User card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.07)', padding: '12px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, #FF5C3A, #FF8C42)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {(user.name || 'U')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
            <p style={{ fontSize: 11, color: '#7070A0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.businessName}</p>
          </div>
          <button onClick={onLogout} title="Cerrar sesión"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7070A0', padding: 4, flexShrink: 0 }}>
            <IconX />
          </button>
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <main style={{ flex: 1, padding: '32px 36px', position: 'relative', zIndex: 1, overflow: 'auto' }}>

        {/* Header */}
        <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
              Buenos días, <span style={{ color: '#FF5C3A' }}>{user.name}</span> 👋
            </h1>
            <p style={{ color: '#7070A0', fontSize: 14 }}>Martes 25 de febrero · {todayAppointments.length} citas hoy</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{
              padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)', color: '#F0F0FF', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 14,
              fontFamily: 'DM Sans, sans-serif',
            }}>
              <IconBell /> <span style={{ position: 'relative' }}>Notificaciones
                <span style={{
                  position: 'absolute', top: -8, right: -20,
                  background: '#FF5C3A', color: 'white', fontSize: 10, fontWeight: 700,
                  borderRadius: '50%', width: 16, height: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>3</span>
              </span>
            </button>
            <button style={{
              padding: '10px 18px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #FF5C3A, #FF7A52)',
              color: 'white', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              fontFamily: 'DM Sans, sans-serif',
              boxShadow: '0 4px 20px rgba(255,92,58,0.3)',
            }}>
              + Nueva cita
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="fade-up delay-100" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Citas hoy',       value: todayAppointments.length, sub: `${confirmed} confirmadas`, icon: '📅', color: '#FF5C3A' },
            { label: 'Ingresos del día', value: `$${totalHoy.toLocaleString()}`, sub: '↑ 12% vs ayer', icon: '💰', color: '#00E5A0' },
            { label: 'Pendientes',       value: pending, sub: 'Por confirmar', icon: '⏳', color: '#FF9500' },
            { label: 'Clientes nuevos',  value: 3, sub: 'Esta semana', icon: '✨', color: '#8B5CF6' },
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '20px',
              transition: 'transform 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'none'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 22 }}>{stat.icon}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#00E5A0', fontSize: 12 }}>
                  <IconTrend /> <span>{stat.sub}</span>
                </div>
              </div>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</p>
              <p style={{ color: '#7070A0', fontSize: 13, marginTop: 2 }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Agenda del día */}
        <div className="fade-up delay-200" style={{
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700 }}>Agenda de hoy</h2>
            <span style={{ fontSize: 13, color: '#7070A0' }}>Martes 25 Feb</span>
          </div>

          <div style={{ padding: '8px 0' }}>
            {todayAppointments.map((appt, i) => {
              const st = statusConfig[appt.status]
              const isSelected = selected === i
              return (
                <div key={i}
                  onClick={() => setSelected(isSelected ? null : i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '14px 24px', cursor: 'pointer',
                    borderBottom: i < todayAppointments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    background: isSelected ? 'rgba(255,92,58,0.06)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseOver={e => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseOut={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Hora */}
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#FF5C3A', minWidth: 44 }}>
                    {appt.time}
                  </span>

                  {/* Avatar */}
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, rgba(255,92,58,0.3), rgba(255,140,66,0.3))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#FF8C42',
                    border: '1px solid rgba(255,92,58,0.2)',
                  }}>
                    {appt.avatar}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{appt.name}</p>
                    <p style={{ fontSize: 13, color: '#7070A0' }}>{appt.service}</p>
                  </div>

                  {/* Status */}
                  <div style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    background: st.bg, color: st.color,
                  }}>
                    {st.label}
                  </div>

                  {/* Precio */}
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, minWidth: 72, textAlign: 'right' }}>
                    ${appt.price}
                  </span>

                  {/* Acciones rápidas */}
                  <div style={{ display: 'flex', gap: 6, opacity: isSelected ? 1 : 0, transition: 'opacity 0.15s' }}>
                    <button style={{
                      width: 32, height: 32, borderRadius: 8, border: 'none',
                      background: 'rgba(0,229,160,0.15)', color: '#00E5A0', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }} title="Confirmar">
                      <IconCheck />
                    </button>
                    <button style={{
                      width: 32, height: 32, borderRadius: 8, border: 'none',
                      background: 'rgba(255,92,58,0.15)', color: '#FF5C3A', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }} title="Cancelar">
                      <IconX />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </main>
    </div>
  )
}
