import { useState, useEffect } from 'react'
import TemplatePicker from './pages/TemplatePicker'
import AuthPage       from './pages/AuthPage'
import Dashboard      from './pages/Dashboard'

export default function App() {
  const [screen, setScreen] = useState(() =>
    localStorage.getItem('agendamx_token') ? 'dashboard' : 'picker'
  )
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => !!localStorage.getItem('agendamx_token'))

  useEffect(() => {
    const token = localStorage.getItem('agendamx_token')
    if (!token) return
    setLoading(true)
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => {
        setUser({ name: data.user.name, businessName: data.business.name })
        setScreen('dashboard')
      })
      .catch(() => {
        localStorage.removeItem('agendamx_token')
        setScreen('picker')
      })
      .finally(() => setLoading(false))
  }, [screen])

  const handleTemplatePicked = (template) => {
    setSelectedTemplate(template)
    setScreen('auth')
  }

  const handleAuth = async (userData) => {
    localStorage.setItem('agendamx_token', userData.token)
    if (selectedTemplate && userData.isNewUser && selectedTemplate.id !== 'custom') {
      try {
        await fetch(`${import.meta.env.VITE_API_URL || ''}/api/templates/apply`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${userData.token}` },
          body: JSON.stringify({ templateId: selectedTemplate.id }),
        })
      } catch (e) { console.error('template apply error:', e) }
    }
    setScreen('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('agendamx_token')
    setSelectedTemplate(null)
    setUser(null)
    setScreen('picker')
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0c0c0c', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'#7070A0', fontSize:14 }}>Cargando...</p>
    </div>
  )
  if (screen === 'picker')    return <TemplatePicker onSelect={handleTemplatePicked} />
  if (screen === 'auth')      return <AuthPage template={selectedTemplate} onAuth={handleAuth} onBack={() => setScreen('picker')} />
  if (screen === 'dashboard' && user) return <Dashboard user={user} onLogout={handleLogout} />
  return null
}
