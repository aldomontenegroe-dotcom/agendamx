import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'

const planColors = {
  free:     { color: '#7070A0', bg: 'rgba(112,112,160,0.15)' },
  starter:  { color: '#FF9500', bg: 'rgba(255,149,0,0.15)' },
  pro:      { color: '#00E5A0', bg: 'rgba(0,229,160,0.15)' },
  business: { color: '#FF5C3A', bg: 'rgba(255,92,58,0.15)' },
}

export default function SuperAdminPage() {
  const [businesses, setBusinesses] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null) // business id being saved

  const fetchData = () => {
    setLoading(true)
    Promise.all([
      apiFetch('/api/admin/businesses'),
      apiFetch('/api/admin/stats'),
    ])
      .then(([bizData, statsData]) => {
        setBusinesses(bizData.businesses || [])
        setStats(statsData)
      })
      .catch(err => console.error('SuperAdmin fetch error:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const handlePlanChange = (biz, newPlan) => {
    setSaving(biz.id)
    const expiresAt = newPlan === 'free' ? null : '2027-01-01'
    apiFetch(`/api/admin/businesses/${biz.id}/plan`, {
      method: 'PATCH',
      body: JSON.stringify({ plan: newPlan, plan_expires_at: expiresAt }),
    })
      .then(() => {
        setBusinesses(prev => prev.map(b =>
          b.id === biz.id ? { ...b, plan: newPlan, plan_expires_at: expiresAt } : b
        ))
      })
      .catch(err => alert(err.message))
      .finally(() => setSaving(null))
  }

  const handleToggleActive = (biz) => {
    setSaving(biz.id)
    apiFetch(`/api/admin/businesses/${biz.id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !biz.is_active }),
    })
      .then(() => {
        setBusinesses(prev => prev.map(b =>
          b.id === biz.id ? { ...b, is_active: !b.is_active } : b
        ))
      })
      .catch(err => alert(err.message))
      .finally(() => setSaving(null))
  }

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <p style={{ color: '#7070A0', fontSize: 14 }}>Cargando panel de admin...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '40px 0' }}>
      <h2 style={{
        fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800,
        marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 20 }}>Panel Super Admin</span>
      </h2>
      <p style={{ color: '#7070A0', fontSize: 14, marginBottom: 28 }}>
        Administra todos los negocios de la plataforma
      </p>

      {/* KPIs */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
          <StatCard label="Negocios" value={stats.totalBusinesses} />
          <StatCard label="Citas totales" value={stats.totalAppointments} />
          {stats.planBreakdown.map(p => (
            <StatCard
              key={p.plan}
              label={`Plan ${p.plan}`}
              value={p.count}
              color={planColors[p.plan]?.color}
            />
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{
        background: '#13131A', borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['Negocio', 'Slug', 'Owner', 'Ciudad', 'Plan', 'Citas', 'Clientes', 'Activo', 'Creado'].map(h => (
                  <th key={h} style={{
                    padding: '14px 16px', textAlign: 'left', color: '#7070A0',
                    fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {businesses.map(biz => {
                const pc = planColors[biz.plan] || planColors.free
                return (
                  <tr key={biz.id} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    opacity: biz.is_active ? 1 : 0.5,
                  }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {biz.name}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#7070A0', fontFamily: 'monospace', fontSize: 12 }}>
                      {biz.slug}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#A0A0C0' }}>
                      {biz.owner_name || '-'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#7070A0' }}>
                      {biz.city || '-'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        value={biz.plan}
                        onChange={(e) => handlePlanChange(biz, e.target.value)}
                        disabled={saving === biz.id}
                        style={{
                          background: pc.bg, color: pc.color,
                          border: `1px solid ${pc.color}33`, borderRadius: 6,
                          padding: '5px 8px', fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', outline: 'none',
                        }}
                      >
                        <option value="free">free</option>
                        <option value="starter">starter</option>
                        <option value="pro">pro</option>
                        <option value="business">business</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#A0A0C0' }}>
                      {biz.total_appointments}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#A0A0C0' }}>
                      {biz.total_clients}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleToggleActive(biz)}
                        disabled={saving === biz.id}
                        style={{
                          width: 38, height: 22, borderRadius: 11, border: 'none',
                          background: biz.is_active ? '#00E5A0' : '#333',
                          cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                        }}
                      >
                        <span style={{
                          position: 'absolute', top: 3, width: 16, height: 16,
                          borderRadius: '50%', background: 'white', transition: 'left 0.2s',
                          left: biz.is_active ? 19 : 3,
                        }} />
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#7070A0', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {new Date(biz.created_at).toLocaleDateString('es-MX', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {businesses.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#7070A0' }}>
            No hay negocios registrados
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color = '#F0F0FF' }) {
  return (
    <div style={{
      background: '#13131A', borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.06)',
      padding: '16px 20px',
    }}>
      <p style={{ fontSize: 11, color: '#7070A0', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </p>
      <p style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Syne, sans-serif', color }}>
        {value}
      </p>
    </div>
  )
}
