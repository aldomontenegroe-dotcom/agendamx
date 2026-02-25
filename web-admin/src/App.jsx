import { useState } from 'react'
import TemplatePicker from './pages/TemplatePicker'
import AuthPage       from './pages/AuthPage'
import Dashboard      from './pages/Dashboard'

export default function App() {
  const [screen, setScreen] = useState(() =>
    localStorage.getItem('agendamx_token') ? 'dashboard' : 'picker'
  )
  const [selectedTemplate, setSelectedTemplate] = useState(null)

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
    setScreen('picker')
  }

  if (screen === 'picker')    return <TemplatePicker onSelect={handleTemplatePicked} />
  if (screen === 'auth')      return <AuthPage template={selectedTemplate} onAuth={handleAuth} onBack={() => setScreen('picker')} />
  if (screen === 'dashboard') return <Dashboard onLogout={handleLogout} />
  return null
}
