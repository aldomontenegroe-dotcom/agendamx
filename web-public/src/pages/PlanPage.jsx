import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'

const PLAN_ORDER = ['free', 'starter', 'pro', 'business']

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00E5A0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

export default function PlanPage() {
  const [plans, setPlans] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [upgrading, setUpgrading] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      apiFetch('/api/subscription/plans'),
      apiFetch('/api/subscription/status'),
    ])
      .then(([plansData, statusData]) => {
        setPlans(plansData.plans || plansData)
        setSubscription(statusData.subscription || statusData)
      })
      .catch(err => setError(err.message || 'Error al cargar datos del plan'))
      .finally(() => setLoading(false))
  }, [])

  const handleUpgrade = async (planId) => {
    setUpgrading(planId)
    try {
      const data = await apiFetch('/api/subscription/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId }),
      })
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      alert(err.message || 'Error al iniciar el pago')
    } finally {
      setUpgrading(null)
    }
  }

  const handlePortal = async () => {
    try {
      const data = await apiFetch('/api/subscription/portal', { method: 'POST' })
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      alert(err.message || 'Error al abrir portal de facturación')
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await apiFetch('/api/subscription/cancel', { method: 'POST' })
      setShowCancelConfirm(false)
      // Refresh status
      const statusData = await apiFetch('/api/subscription/status')
      setSubscription(statusData.subscription || statusData)
    } catch (err) {
      alert(err.message || 'Error al cancelar suscripción')
    } finally {
      setCancelling(false)
    }
  }

  const currentPlan = subscription?.plan || 'free'
  const currentIndex = PLAN_ORDER.indexOf(currentPlan)

  if (loading) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <p style={{ color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>Cargando planes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '80px 0', textAlign: 'center' }}>
        <p style={{ color: '#FF5C3A', fontSize: 14, marginBottom: 12, fontFamily: 'DM Sans, sans-serif' }}>{error}</p>
        <button
          onClick={() => window.location.reload()}
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
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
          Tu Plan
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            display: 'inline-block', padding: '4px 14px', borderRadius: 8,
            background: currentPlan === 'free' ? 'rgba(112,112,160,0.15)' : 'rgba(255,92,58,0.15)',
            color: currentPlan === 'free' ? '#7070A0' : '#FF5C3A',
            fontSize: 13, fontWeight: 700, fontFamily: 'DM Sans, sans-serif',
          }}>
            {subscription?.planName || 'Gratis'}
          </span>
          {subscription?.cancelAtPeriodEnd && (
            <span style={{
              fontSize: 13, color: '#FF9500', fontFamily: 'DM Sans, sans-serif',
            }}>
              Se cancela al final del periodo
            </span>
          )}
          {subscription?.expiresAt && !subscription?.cancelAtPeriodEnd && (
            <span style={{
              fontSize: 13, color: '#7070A0', fontFamily: 'DM Sans, sans-serif',
            }}>
              Renueva el {new Date(subscription.expiresAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      {/* Plan cards */}
      <div className="fade-up delay-100" style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32,
      }}>
        {PLAN_ORDER.map((planId, idx) => {
          const plan = plans?.[planId]
          if (!plan) return null

          const isCurrent = planId === currentPlan
          const isHigher = idx > currentIndex
          const isLower = idx < currentIndex
          const isRecommended = planId === 'pro'

          return (
            <div key={planId} style={{
              background: 'rgba(255,255,255,0.03)',
              border: isRecommended ? '2px solid #FF5C3A' : '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: 28,
              display: 'flex', flexDirection: 'column',
              position: 'relative',
              opacity: isLower && !isCurrent ? 0.5 : 1,
              transition: 'transform 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'none'}
            >
              {isRecommended && (
                <div style={{
                  position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%) translateY(-50%)',
                  background: 'linear-gradient(135deg, #FF5C3A, #FF7A52)',
                  color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 14px',
                  borderRadius: 20, fontFamily: 'DM Sans, sans-serif',
                }}>
                  Recomendado
                </div>
              )}

              {/* Plan name */}
              <h3 style={{
                fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800,
                marginBottom: 8, color: '#fff',
              }}>
                {plan.name}
              </h3>

              {/* Price */}
              <div style={{ marginBottom: 20 }}>
                <span style={{
                  fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800,
                  color: '#fff',
                }}>
                  {plan.price === 0 ? 'Gratis' : `$${plan.price}`}
                </span>
                {plan.price > 0 && (
                  <span style={{
                    fontSize: 14, color: '#7070A0', fontFamily: 'DM Sans, sans-serif',
                    marginLeft: 4,
                  }}>
                    /mes
                  </span>
                )}
              </div>

              {/* Features */}
              <ul style={{
                listStyle: 'none', padding: 0, margin: 0, flex: 1,
                marginBottom: 24,
              }}>
                {plan.features.map((feature, fi) => (
                  <li key={fi} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13, color: '#fff', fontFamily: 'DM Sans, sans-serif',
                    marginBottom: 10,
                  }}>
                    <span style={{ color: '#00E5A0', flexShrink: 0 }}>
                      <IconCheck />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Action button */}
              {isCurrent ? (
                <button disabled style={{
                  background: 'rgba(255,255,255,0.05)', color: '#7070A0',
                  cursor: 'default', border: 'none', borderRadius: 12,
                  padding: '12px 28px', fontWeight: 700, fontSize: 14,
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  Plan actual
                </button>
              ) : isHigher ? (
                <button
                  onClick={() => handleUpgrade(planId)}
                  disabled={upgrading === planId}
                  style={{
                    background: 'linear-gradient(135deg, #FF5C3A, #FF7A52)',
                    color: '#fff', border: 'none', borderRadius: 12,
                    padding: '12px 28px', fontWeight: 700, fontSize: 14,
                    cursor: upgrading === planId ? 'wait' : 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                    boxShadow: '0 4px 20px rgba(255,92,58,0.3)',
                    opacity: upgrading === planId ? 0.7 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  {upgrading === planId ? 'Procesando...' : 'Mejorar'}
                </button>
              ) : (
                <button disabled style={{
                  background: 'rgba(255,255,255,0.05)', color: '#7070A0',
                  cursor: 'default', border: 'none', borderRadius: 12,
                  padding: '12px 28px', fontWeight: 700, fontSize: 14,
                  fontFamily: 'DM Sans, sans-serif',
                }}>
                  &mdash;
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Management actions */}
      <div className="fade-up delay-200" style={{
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: 28,
      }}>
        <h3 style={{
          fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700,
          marginBottom: 16, color: '#fff',
        }}>
          Administrar suscripcion
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Portal button */}
          {currentPlan !== 'free' && (
            <button onClick={handlePortal} style={{
              background: 'rgba(255,255,255,0.06)', color: '#F0F0FF',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
              padding: '12px 24px', fontWeight: 600, fontSize: 14,
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              transition: 'background 0.15s',
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            >
              Administrar facturacion
            </button>
          )}

          {/* Cancel link */}
          {currentPlan !== 'free' && !subscription?.cancelAtPeriodEnd && (
            <button onClick={() => setShowCancelConfirm(true)} style={{
              background: 'none', border: 'none', color: '#7070A0',
              fontSize: 14, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              textDecoration: 'underline', padding: '12px 8px',
            }}
            onMouseOver={e => e.currentTarget.style.color = '#FF5C3A'}
            onMouseOut={e => e.currentTarget.style.color = '#7070A0'}
            >
              Cancelar suscripcion
            </button>
          )}

          {currentPlan === 'free' && (
            <p style={{ color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>
              Estas en el plan gratuito. Mejora tu plan para desbloquear mas funciones.
            </p>
          )}
        </div>
      </div>

      {/* Cancel confirmation dialog */}
      {showCancelConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowCancelConfirm(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#13131A', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: 32, maxWidth: 420, width: '90%',
          }}>
            <h3 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800,
              marginBottom: 12, color: '#fff',
            }}>
              Cancelar suscripcion
            </h3>
            <p style={{
              color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif',
              marginBottom: 24, lineHeight: 1.6,
            }}>
              Tu plan seguira activo hasta el final del periodo de facturacion. Despues de eso, tu cuenta se cambiara al plan gratuito con un limite de 10 citas al mes.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCancelConfirm(false)} style={{
                background: 'rgba(255,255,255,0.06)', color: '#F0F0FF',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                padding: '10px 20px', fontWeight: 600, fontSize: 14,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              }}>
                Mantener plan
              </button>
              <button onClick={handleCancel} disabled={cancelling} style={{
                background: 'rgba(255,92,58,0.15)', color: '#FF5C3A',
                border: '1px solid rgba(255,92,58,0.3)', borderRadius: 12,
                padding: '10px 20px', fontWeight: 600, fontSize: 14,
                cursor: cancelling ? 'wait' : 'pointer', fontFamily: 'DM Sans, sans-serif',
                opacity: cancelling ? 0.7 : 1,
              }}>
                {cancelling ? 'Cancelando...' : 'Si, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
