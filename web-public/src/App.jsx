import { useState, useEffect } from 'react'
import BookingPage from './pages/BookingPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'

const API = import.meta.env.VITE_API_URL || ''

// Fixed routes that are NOT business slugs
const RESERVED = ['login', 'registro', 'dashboard']

export default function App() {
  const path = window.location.pathname.replace(/^\//, '').split('/')[0]
  const [screen, setScreen] = useState(() => {
    if (path === 'login') return 'login'
    if (path === 'registro') return 'register'
    if (path === 'dashboard') return localStorage.getItem('agendamx_token') ? 'dashboard' : 'login'
    if (path && !RESERVED.includes(path)) return 'booking'
    return 'landing'
  })
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(screen === 'dashboard')

  // Navigate helper — updates URL + state
  const navigate = (s, pushUrl) => {
    if (pushUrl) window.history.pushState({}, '', pushUrl)
    setScreen(s)
  }

  // Handle browser back/forward
  useEffect(() => {
    const onPop = () => {
      const p = window.location.pathname.replace(/^\//, '').split('/')[0]
      if (p === 'login') setScreen('login')
      else if (p === 'registro') setScreen('register')
      else if (p === 'dashboard') setScreen(localStorage.getItem('agendamx_token') ? 'dashboard' : 'login')
      else if (p && !RESERVED.includes(p)) setScreen('booking')
      else setScreen('landing')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // Fetch user data when entering dashboard
  useEffect(() => {
    if (screen !== 'dashboard') return
    const token = localStorage.getItem('agendamx_token')
    if (!token) { navigate('login', '/login'); return }

    setLoading(true)
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => {
        setUser({
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          businessName: data.business.name,
          businessSlug: data.business.slug,
          businessId: data.business.id,
          businessPlan: data.business.plan,
        })
      })
      .catch(() => {
        localStorage.removeItem('agendamx_token')
        navigate('login', '/login')
      })
      .finally(() => setLoading(false))
  }, [screen])

  // Apply dark theme for dashboard
  useEffect(() => {
    if (screen === 'dashboard') {
      document.documentElement.classList.add('dark-theme')
    } else {
      document.documentElement.classList.remove('dark-theme')
    }
  }, [screen])

  // ─── Screens ─────────────────────────────────────
  if (screen === 'booking') {
    return <BookingPage slug={path} />
  }

  if (screen === 'landing') {
    return (
      <LandingPage
        onLogin={() => navigate('login', '/login')}
        onRegister={() => navigate('register', '/registro')}
      />
    )
  }

  if (screen === 'login') {
    return (
      <LoginPage
        onSuccess={() => navigate('dashboard', '/dashboard')}
        onGoRegister={() => navigate('register', '/registro')}
      />
    )
  }

  if (screen === 'register') {
    return (
      <RegisterPage
        onSuccess={() => navigate('dashboard', '/dashboard')}
        onGoLogin={() => navigate('login', '/login')}
      />
    )
  }

  if (screen === 'dashboard') {
    if (loading || !user) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#08080F' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#FF5C3A', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#7070A0', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>Cargando...</p>
          </div>
        </div>
      )
    }
    return (
      <Dashboard
        user={user}
        onLogout={() => {
          localStorage.removeItem('agendamx_token')
          navigate('landing', '/')
        }}
      />
    )
  }

  return null
}
