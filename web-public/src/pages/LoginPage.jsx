import { useState } from 'react'

const API = import.meta.env.VITE_API_URL || ''

const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

const Spinner = () => (
  <div style={{
    width: 20, height: 20,
    border: '2.5px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    animation: 'spin .6s linear infinite',
  }} />
)

export default function LoginPage({ onSuccess, onGoRegister }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión')
      localStorage.setItem('agendamx_token', data.token)
      onSuccess(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const gradientCTA = 'linear-gradient(135deg, #FF5C3A, #FF7A52)'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Back link */}
      <div style={{
        position: 'fixed',
        top: 20,
        left: 20,
        zIndex: 10,
      }}>
        <a
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--muted)',
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 500,
            transition: 'color .2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
        >
          <IconBack /> Volver
        </a>
      </div>

      {/* Logo */}
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 28,
        fontWeight: 800,
        marginBottom: 32,
        letterSpacing: '-0.5px',
      }}>
        agenda<span style={{ color: '#FF5C3A' }}>MX</span>
      </div>

      {/* Card */}
      <div className="fade-up" style={{
        width: '100%',
        maxWidth: 400,
        background: '#FFFFFF',
        borderRadius: 20,
        padding: '40px 32px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 24,
          fontWeight: 800,
          marginBottom: 8,
          textAlign: 'center',
          color: 'var(--text)',
        }}>
          Inicia sesión
        </h2>
        <p style={{
          color: 'var(--muted)',
          fontSize: 14,
          textAlign: 'center',
          marginBottom: 28,
        }}>
          Accede a tu panel de administración
        </p>

        {error && (
          <div style={{
            background: 'rgba(255,92,58,0.08)',
            border: '1px solid rgba(255,92,58,0.2)',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 20,
            fontSize: 13,
            color: '#FF5C3A',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text)',
              marginBottom: 6,
            }}>
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1.5px solid var(--border)',
                borderRadius: 12,
                fontSize: 15,
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none',
                transition: 'border-color .2s',
                background: 'var(--bg)',
              }}
              onFocus={e => e.target.style.borderColor = '#FF5C3A'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text)',
              marginBottom: 6,
            }}>
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1.5px solid var(--border)',
                borderRadius: 12,
                fontSize: 15,
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none',
                transition: 'border-color .2s',
                background: 'var(--bg)',
              }}
              onFocus={e => e.target.style.borderColor = '#FF5C3A'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 0',
              background: loading ? '#ccc' : gradientCTA,
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "'Syne', sans-serif",
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'transform .15s, box-shadow .2s',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(255,92,58,0.3)',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {loading ? <Spinner /> : 'Iniciar sesión'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: 14,
          color: 'var(--muted)',
        }}>
          ¿No tienes cuenta?{' '}
          <span
            onClick={onGoRegister}
            style={{
              color: '#FF5C3A',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            Regístrate
          </span>
        </div>
      </div>
    </div>
  )
}
