import { useState } from 'react'

const API = import.meta.env.VITE_API_URL || ''

const TEMPLATES = [
  { id: 'barberia', emoji: '💈', name: 'Barbería', tagline: 'Cortes y estilos', color: '#C87533' },
  { id: 'salon-belleza', emoji: '💇‍♀️', name: 'Salón de Belleza', tagline: 'Estilismo y color', color: '#E91E8C' },
  { id: 'veterinaria', emoji: '🐾', name: 'Veterinaria', tagline: 'Cuidado animal', color: '#4CAF50' },
  { id: 'spa-masaje', emoji: '🧖‍♀️', name: 'Spa & Masaje', tagline: 'Relajación total', color: '#9C27B0' },
  { id: 'dentista', emoji: '🦷', name: 'Dentista', tagline: 'Salud dental', color: '#00BCD4' },
  { id: 'psicologo', emoji: '🧠', name: 'Psicólogo', tagline: 'Bienestar mental', color: '#673AB7' },
  { id: 'nutriologo', emoji: '🥗', name: 'Nutriólogo', tagline: 'Alimentación sana', color: '#8BC34A' },
  { id: 'fotografo', emoji: '📸', name: 'Fotógrafo', tagline: 'Captura momentos', color: '#FF9800' },
  { id: 'tatuador', emoji: '🎨', name: 'Tatuador', tagline: 'Arte en piel', color: '#F44336' },
  { id: 'yoga-fitness', emoji: '🧘', name: 'Yoga & Fitness', tagline: 'Cuerpo y mente', color: '#009688' },
  { id: 'tutor', emoji: '📚', name: 'Tutor', tagline: 'Educación', color: '#3F51B5' },
  { id: 'medico', emoji: '🩺', name: 'Médico General', tagline: 'Consulta médica', color: '#2196F3' },
]

const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M20 6 9 17l-5-5" />
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

function StepIndicator({ step }) {
  const steps = ['Giro', 'Datos', '¡Listo!']
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0,
      marginBottom: 32,
    }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '2px solid',
              borderColor: i < step ? 'var(--accent)' : i === step ? 'var(--primary)' : 'var(--border)',
              background: i < step ? 'var(--accent)' : i === step ? 'var(--primary)' : 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: i <= step ? 'white' : 'var(--muted)',
              fontSize: 13, fontWeight: 700,
              transition: 'all .3s',
            }}>
              {i < step ? <IconCheck /> : i + 1}
            </div>
            <span style={{
              fontSize: 11,
              color: i === step ? 'var(--primary)' : 'var(--muted)',
              fontWeight: i === step ? 600 : 400,
              whiteSpace: 'nowrap',
            }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width: 40, height: 2, marginBottom: 18,
              background: i < step ? 'var(--accent)' : 'var(--border)',
              transition: 'background .3s',
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Step 1: Choose Template ─────────────────────────────────────────

function Step1Template({ selected, onSelect, onNext }) {
  const [hovered, setHovered] = useState(null)

  return (
    <div className="fade-up">
      <h2 style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 22,
        fontWeight: 800,
        marginBottom: 6,
        textAlign: 'center',
        color: 'var(--text)',
      }}>
        ¿Cuál es tu giro?
      </h2>
      <p style={{
        color: 'var(--muted)',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 28,
      }}>
        Selecciona tu tipo de negocio para preconfigurar tus servicios
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 12,
        marginBottom: 16,
      }}>
        {TEMPLATES.map(t => {
          const isSelected = selected?.id === t.id
          const isHovered = hovered === t.id
          return (
            <div
              key={t.id}
              onClick={() => onSelect(t)}
              onMouseEnter={() => setHovered(t.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '18px 14px',
                borderRadius: 14,
                border: `2px solid ${isSelected ? '#FF5C3A' : isHovered ? 'rgba(255,92,58,0.3)' : 'var(--border)'}`,
                background: isSelected ? 'rgba(255,92,58,0.05)' : '#FFFFFF',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all .2s',
                transform: isHovered ? 'translateY(-2px)' : 'none',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{t.emoji}</div>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "'Syne', sans-serif",
                color: 'var(--text)',
                marginBottom: 2,
              }}>
                {t.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {t.tagline}
              </div>
            </div>
          )
        })}
      </div>

      {/* Otro giro */}
      <div
        onClick={() => onSelect({ id: 'custom', emoji: '⚙️', name: 'Otro giro', tagline: 'Configura manualmente', color: '#888' })}
        style={{
          padding: '14px 18px',
          borderRadius: 14,
          border: `2px solid ${selected?.id === 'custom' ? '#FF5C3A' : 'var(--border)'}`,
          background: selected?.id === 'custom' ? 'rgba(255,92,58,0.05)' : '#FFFFFF',
          cursor: 'pointer',
          textAlign: 'center',
          fontSize: 14,
          color: 'var(--muted)',
          fontWeight: 500,
          marginBottom: 28,
          transition: 'all .2s',
        }}
      >
        Otro giro (configurar manualmente)
      </div>

      <button
        onClick={onNext}
        disabled={!selected}
        style={{
          width: '100%',
          padding: '14px 0',
          background: selected ? 'linear-gradient(135deg, #FF5C3A, #FF7A52)' : '#ddd',
          color: '#fff',
          border: 'none',
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 700,
          fontFamily: "'Syne', sans-serif",
          cursor: selected ? 'pointer' : 'not-allowed',
          transition: 'transform .15s, box-shadow .2s',
          boxShadow: selected ? '0 4px 16px rgba(255,92,58,0.3)' : 'none',
        }}
        onMouseEnter={e => { if (selected) e.currentTarget.style.transform = 'translateY(-1px)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
      >
        Siguiente
      </button>
    </div>
  )
}

// ─── Step 2: Business & Owner Data ───────────────────────────────────

function Step2Form({ template, onBack, onSubmit, loading, error }) {
  const [form, setForm] = useState({
    businessName: '',
    name: '',
    phone: '',
    email: '',
    password: '',
  })

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const isValid = form.businessName && form.name && form.phone && form.email && form.password.length >= 6

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isValid) onSubmit(form)
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1.5px solid var(--border)',
    borderRadius: 12,
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    transition: 'border-color .2s',
    background: 'var(--bg)',
  }

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text)',
    marginBottom: 6,
  }

  const fields = [
    { key: 'businessName', label: 'Nombre del negocio', type: 'text', placeholder: 'Ej: Barbería Don Julio' },
    { key: 'name', label: 'Tu nombre completo', type: 'text', placeholder: 'Ej: Juan Pérez' },
    { key: 'phone', label: 'WhatsApp / Teléfono', type: 'tel', placeholder: 'Ej: 5512345678' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'tu@email.com' },
    { key: 'password', label: 'Contraseña', type: 'password', placeholder: 'Mínimo 6 caracteres' },
  ]

  return (
    <div className="fade-up">
      <h2 style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 22,
        fontWeight: 800,
        marginBottom: 6,
        textAlign: 'center',
        color: 'var(--text)',
      }}>
        Datos de tu negocio
      </h2>
      <p style={{
        color: 'var(--muted)',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 28,
      }}>
        {template?.name && template.id !== 'custom'
          ? `Configurando: ${template.emoji} ${template.name}`
          : 'Completa los datos para crear tu cuenta'
        }
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
        {fields.map(f => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              {f.label} <span style={{ color: '#FF5C3A' }}>*</span>
            </label>
            <input
              type={f.type}
              required
              value={form[f.key]}
              onChange={update(f.key)}
              placeholder={f.placeholder}
              minLength={f.key === 'password' ? 6 : undefined}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#FF5C3A'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
        ))}

        <div style={{
          display: 'flex',
          gap: 12,
          marginTop: 24,
        }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              flex: '0 0 auto',
              padding: '14px 20px',
              background: '#FFFFFF',
              color: 'var(--muted)',
              border: '1.5px solid var(--border)',
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all .2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--muted)'
              e.currentTarget.style.color = 'var(--text)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.color = 'var(--muted)'
            }}
          >
            <IconBack /> Atrás
          </button>

          <button
            type="submit"
            disabled={!isValid || loading}
            style={{
              flex: 1,
              padding: '14px 0',
              background: (!isValid || loading) ? '#ddd' : 'linear-gradient(135deg, #FF5C3A, #FF7A52)',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "'Syne', sans-serif",
              cursor: (!isValid || loading) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'transform .15s, box-shadow .2s',
              boxShadow: (!isValid || loading) ? 'none' : '0 4px 16px rgba(255,92,58,0.3)',
            }}
            onMouseEnter={e => { if (isValid && !loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
          >
            {loading ? <Spinner /> : 'Crear cuenta'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Step 3: Success ─────────────────────────────────────────────────

function Step3Success({ onSuccess }) {
  return (
    <div className="fade-up" style={{ textAlign: 'center', padding: '20px 0' }}>
      {/* Animated checkmark */}
      <div style={{
        width: 80, height: 80,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #00C48C, #00E5A0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        animation: 'scaleIn .5s cubic-bezier(0.34,1.56,0.64,1) forwards',
        boxShadow: '0 8px 24px rgba(0,196,140,0.3)',
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>

      <h2 style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 26,
        fontWeight: 800,
        color: 'var(--text)',
        marginBottom: 12,
      }}>
        ¡Tu negocio está listo!
      </h2>

      <p style={{
        color: 'var(--muted)',
        fontSize: 15,
        lineHeight: 1.6,
        maxWidth: 320,
        margin: '0 auto 32px',
      }}>
        Configuramos todo para ti. Ahora personaliza tus servicios y horarios.
      </p>

      <button
        onClick={onSuccess}
        style={{
          padding: '14px 40px',
          background: 'linear-gradient(135deg, #FF5C3A, #FF7A52)',
          color: '#fff',
          border: 'none',
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 700,
          fontFamily: "'Syne', sans-serif",
          cursor: 'pointer',
          transition: 'transform .15s, box-shadow .2s',
          boxShadow: '0 4px 16px rgba(255,92,58,0.3)',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        Ir a mi panel
      </button>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────

export default function RegisterPage({ onSuccess, onGoLogin }) {
  const [step, setStep] = useState(0)
  const [template, setTemplate] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleStep2Submit = async (form) => {
    setError('')
    setLoading(true)
    try {
      // 1. Register
      const regRes = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: form.businessName,
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
        }),
      })
      const regData = await regRes.json()
      if (!regRes.ok) throw new Error(regData.error || 'Error al crear la cuenta')

      // 2. Save token
      localStorage.setItem('agendamx_token', regData.token)

      // 3. Apply template if not custom
      if (template && template.id !== 'custom') {
        await fetch(`${API}/api/templates/apply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${regData.token}`,
          },
          body: JSON.stringify({ templateId: template.id }),
        })
      }

      // 4. Move to success step
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '24px 16px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
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
        marginTop: 16,
        marginBottom: 24,
        letterSpacing: '-0.5px',
      }}>
        agenda<span style={{ color: '#FF5C3A' }}>MX</span>
      </div>

      {/* Step indicator */}
      <StepIndicator step={step} />

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: 520,
        background: '#FFFFFF',
        borderRadius: 20,
        padding: '36px 28px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        {step === 0 && (
          <Step1Template
            selected={template}
            onSelect={setTemplate}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <Step2Form
            template={template}
            onBack={() => setStep(0)}
            onSubmit={handleStep2Submit}
            loading={loading}
            error={error}
          />
        )}
        {step === 2 && (
          <Step3Success onSuccess={onSuccess} />
        )}
      </div>

      {/* Login link (steps 0 & 1 only) */}
      {step < 2 && (
        <div style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: 14,
          color: 'var(--muted)',
        }}>
          ¿Ya tienes cuenta?{' '}
          <span
            onClick={onGoLogin}
            style={{
              color: '#FF5C3A',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'none',
            }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            Inicia sesión
          </span>
        </div>
      )}
    </div>
  )
}
