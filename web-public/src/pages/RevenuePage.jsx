import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'

const formatMoney = (n) => `$${Number(n || 0).toLocaleString('es-MX')} MXN`

function getDefaultDates() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  }
}

export default function RevenuePage() {
  const defaults = getDefaultDates()
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!from || !to) return
    setLoading(true)
    setError(null)
    apiFetch(`/api/stats/revenue?from=${from}&to=${to}`)
      .then(d => setData(d))
      .catch(err => setError(err.message || 'Error al cargar estadísticas'))
      .finally(() => setLoading(false))
  }, [from, to])

  const ticketPromedio =
    data && data.totalAppointments > 0
      ? Math.round(data.totalRevenue / data.totalAppointments)
      : 0

  const maxRevenue =
    data && data.dailyRevenue
      ? Math.max(...data.dailyRevenue.map(d => d.revenue), 1)
      : 1

  // ─── Styles ───────────────────────────────────────────────
  const card = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: '20px 24px',
  }
  const muted = { color: '#7070A0', fontSize: 13 }
  const inputStyle = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: '#F0F0FF',
    padding: '8px 12px',
    fontSize: 14,
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
  }

  // ─── Loading state ────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <p style={{ color: '#7070A0', fontSize: 14 }}>Cargando estadísticas...</p>
      </div>
    )
  }

  // ─── Error state ──────────────────────────────────────────
  if (error) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <p style={{ color: '#FF5C3A', fontSize: 14 }}>{error}</p>
      </div>
    )
  }

  // ─── Empty state ──────────────────────────────────────────
  const isEmpty = !data || (data.totalAppointments === 0 && data.dailyRevenue.length === 0)

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
          Ingresos y <span style={{ color: '#FF5C3A' }}>Analíticas</span>
        </h1>
        <p style={muted}>Resumen de rendimiento del negocio</p>
      </div>

      {/* Date range selector */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
        <label style={{ ...muted, fontSize: 14 }}>Desde</label>
        <input
          type="date"
          value={from}
          onChange={e => setFrom(e.target.value)}
          style={inputStyle}
        />
        <label style={{ ...muted, fontSize: 14 }}>Hasta</label>
        <input
          type="date"
          value={to}
          onChange={e => setTo(e.target.value)}
          style={inputStyle}
        />
      </div>

      {isEmpty ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <p style={{ color: '#7070A0', fontSize: 15 }}>No hay datos para este período</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="fade-up delay-100" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            {/* Ingresos totales */}
            <div style={card}>
              <p style={muted}>Ingresos totales</p>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#00E5A0', marginTop: 8 }}>
                {formatMoney(data.totalRevenue)}
              </p>
            </div>
            {/* Total citas */}
            <div style={card}>
              <p style={muted}>Total citas</p>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#FF5C3A', marginTop: 8 }}>
                {data.totalAppointments}
              </p>
            </div>
            {/* Ticket promedio */}
            <div style={card}>
              <p style={muted}>Ticket promedio</p>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#F0F0FF', marginTop: 8 }}>
                {formatMoney(ticketPromedio)}
              </p>
            </div>
            {/* Clientes nuevos */}
            <div style={card}>
              <p style={muted}>Clientes nuevos</p>
              <p style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#8B5CF6', marginTop: 8 }}>
                {data.newClients}
              </p>
            </div>
          </div>

          {/* Bar chart */}
          <div className="fade-up delay-200" style={{
            ...card,
            marginBottom: 28,
            padding: '24px',
          }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
              Ingresos diarios
            </h2>

            {/* Chart container */}
            <div style={{ position: 'relative', height: 200, padding: '0 0 28px 0' }}>
              {/* Grid lines */}
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: `${(i / 3) * 160}px`,
                  height: 1,
                  background: 'rgba(255,255,255,0.05)',
                }} />
              ))}

              {/* Bars */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: data.dailyRevenue.length > 20 ? 2 : 6,
                height: 160,
                position: 'relative',
                zIndex: 1,
              }}>
                {data.dailyRevenue.map((d, i) => {
                  const h = Math.max((d.revenue / maxRevenue) * 160, 2)
                  const dayLabel = new Date(d.date + 'T12:00:00').getDate()
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        title={`${d.date}: ${formatMoney(d.revenue)} (${d.count} citas)`}
                        style={{
                          width: '100%',
                          maxWidth: 32,
                          height: h,
                          background: 'linear-gradient(180deg, #FF5C3A, #FF7A52)',
                          borderRadius: '4px 4px 0 0',
                          transition: 'opacity 0.15s',
                          cursor: 'pointer',
                          opacity: 0.85,
                        }}
                        onMouseOver={e => (e.currentTarget.style.opacity = '1')}
                        onMouseOut={e => (e.currentTarget.style.opacity = '0.85')}
                      />
                      <span style={{
                        fontSize: 10,
                        color: '#7070A0',
                        marginTop: 6,
                        fontFamily: 'DM Sans, sans-serif',
                      }}>
                        {dayLabel}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Top services table */}
          {data.topServices && data.topServices.length > 0 && (
            <div className="fade-up delay-200" style={{ ...card, marginBottom: 28, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700 }}>
                  Servicios más solicitados
                </h2>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans, sans-serif' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['#', 'Servicio', 'Citas', 'Ingresos'].map((h, i) => (
                      <th key={i} style={{
                        padding: '12px 24px',
                        textAlign: i >= 2 ? 'right' : 'left',
                        color: '#7070A0',
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.topServices.map((svc, i) => (
                    <tr key={i} style={{
                      borderBottom: i < data.topServices.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 24px', color: '#7070A0', fontSize: 14 }}>{i + 1}</td>
                      <td style={{ padding: '14px 24px', fontSize: 14, fontWeight: 500, color: '#F0F0FF' }}>{svc.name}</td>
                      <td style={{ padding: '14px 24px', textAlign: 'right', fontSize: 14, color: '#F0F0FF' }}>{svc.count}</td>
                      <td style={{ padding: '14px 24px', textAlign: 'right', fontSize: 14, fontWeight: 600, color: '#00E5A0' }}>
                        ${Number(svc.revenue).toLocaleString('es-MX')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Completed vs cancelled */}
          <div className="fade-up delay-200" style={{ ...card, display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00E5A0' }} />
              <span style={{ fontSize: 14, color: '#F0F0FF', fontFamily: 'DM Sans, sans-serif' }}>
                <strong>{data.completedAppointments}</strong> completadas
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5C3A' }} />
              <span style={{ fontSize: 14, color: '#F0F0FF', fontFamily: 'DM Sans, sans-serif' }}>
                <strong>{data.cancelledAppointments}</strong> canceladas
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
