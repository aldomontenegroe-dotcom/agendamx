import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || ''

// Generar próximos 7 días
function getNext7Days() {
  const days = []
  const names = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i + 1)
    days.push({
      label: i === 0 ? 'Mañana' : names[d.getDay()],
      date: `${d.getDate()} ${months[d.getMonth()]}`,
      full: d,
      dayIdx: i,
    })
  }
  return days
}

// ─── Iconos ───────────────────────────────────────────────────────
const IconStar   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF9500" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const IconClock  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IconPin    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
const IconCheck  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
const IconWA     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
const IconArrow  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
const IconBack   = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>

// ─── Componentes de pasos ─────────────────────────────────────────

function StepIndicator({ step, steps: customSteps }) {
  const steps = customSteps || ['Servicio','Fecha','Datos','¡Listo!']
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:0, marginBottom:32 }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div style={{
              width:32, height:32, borderRadius:'50%', border:`2px solid`,
              borderColor: i < step ? 'var(--accent)' : i === step ? 'var(--primary)' : 'var(--border)',
              background: i < step ? 'var(--accent)' : i === step ? 'var(--primary)' : 'white',
              display:'flex', alignItems:'center', justifyContent:'center',
              color: i <= step ? 'white' : 'var(--muted)',
              fontSize: 13, fontWeight:700, transition:'all .3s',
            }}>
              {i < step ? <IconCheck /> : i + 1}
            </div>
            <span style={{ fontSize:11, color: i === step ? 'var(--primary)' : 'var(--muted)', fontWeight: i === step ? 600 : 400, whiteSpace:'nowrap' }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              width:40, height:2, marginBottom:18,
              background: i < step ? 'var(--accent)' : 'var(--border)',
              transition:'background .3s',
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

function Step1Services({ services, selected, onSelect, onNext }) {
  return (
    <div className="fade-up">
      <h2 style={{ fontSize:20, fontWeight:800, marginBottom:6 }}>¿Qué servicio necesitas?</h2>
      <p style={{ color:'var(--muted)', fontSize:14, marginBottom:24 }}>Selecciona uno para continuar</p>
      <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
        {services.map(s => {
          const isSelected = selected?.id === s.id
          return (
            <div key={s.id} onClick={() => onSelect(s)}
              style={{
                display:'flex', alignItems:'center', gap:14,
                padding:'16px 18px', borderRadius:14,
                border:`2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                background: isSelected ? 'var(--primary-light)' : 'white',
                cursor:'pointer', transition:'all .18s',
                boxShadow: isSelected ? '0 0 0 4px rgba(255,92,58,0.1)' : 'var(--shadow)',
              }}
              onMouseOver={e => !isSelected && (e.currentTarget.style.borderColor = '#E0E0EE', e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseOut={e => !isSelected && (e.currentTarget.style.borderColor = 'var(--border)', e.currentTarget.style.transform = 'none')}
            >
              <span style={{ fontSize:24 }}>{s.icon || '📋'}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                  <span style={{ fontSize:15, fontWeight:600 }}>{s.name}</span>
                  {s.is_popular && (
                    <span style={{ fontSize:10, fontWeight:700, background:'#FF9500', color:'white', padding:'2px 7px', borderRadius:20 }}>
                      POPULAR
                    </span>
                  )}
                </div>
                <div style={{ display:'flex', gap:12, color:'var(--muted)', fontSize:13 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:4 }}><IconClock /> {s.duration_min} min</span>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'Syne, sans-serif', fontSize:18, fontWeight:800, color: isSelected ? 'var(--primary)' : 'var(--text)' }}>
                  ${s.price}
                </div>
                <div style={{ fontSize:11, color:'var(--muted)' }}>MXN</div>
              </div>
              <div style={{
                width:22, height:22, borderRadius:'50%', flexShrink:0,
                border:`2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                background: isSelected ? 'var(--primary)' : 'white',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'white', transition:'all .18s',
              }}>
                {isSelected && <IconCheck />}
              </div>
            </div>
          )
        })}
      </div>
      <button onClick={onNext} disabled={!selected}
        style={{
          width:'100%', padding:'15px', borderRadius:14, border:'none',
          background: selected ? 'linear-gradient(135deg, #FF5C3A, #FF7A52)' : 'var(--border)',
          color: selected ? 'white' : 'var(--muted)',
          fontFamily:'Syne, sans-serif', fontSize:16, fontWeight:700,
          cursor: selected ? 'pointer' : 'not-allowed',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          boxShadow: selected ? '0 6px 24px rgba(255,92,58,0.3)' : 'none',
          transition:'all .2s',
        }}>
        Siguiente <IconArrow />
      </button>
    </div>
  )
}

function Step2DateTime({ slug, service, staffId, onNext, onBack }) {
  const days = getNext7Days()
  const [selDay, setSelDay] = useState(null)
  const [selTime, setSelTime] = useState(null)
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  const selectDay = (i) => {
    setSelDay(i)
    setSelTime(null)
    setSlotsLoading(true)
    const dateStr = days[i].full.toISOString().split('T')[0]
    let availUrl = `${API}/api/appointments/public/${slug}/availability?serviceId=${service.id}&date=${dateStr}`
    if (staffId) availUrl += `&staffId=${staffId}`
    fetch(availUrl)
      .then(r => r.json())
      .then(data => setSlots(data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }

  return (
    <div className="fade-up">
      <h2 style={{ fontSize:20, fontWeight:800, marginBottom:6 }}>Elige fecha y hora</h2>
      <p style={{ color:'var(--muted)', fontSize:14, marginBottom:24 }}>
        {service.name} · {service.duration_min} min · <strong style={{ color:'var(--primary)' }}>${service.price} MXN</strong>
      </p>

      {/* Días */}
      <p style={{ fontSize:13, fontWeight:600, marginBottom:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Fecha</p>
      <div style={{ display:'flex', gap:8, marginBottom:24, overflowX:'auto', paddingBottom:4 }}>
        {days.map((d, i) => (
          <div key={i} onClick={() => selectDay(i)}
            style={{
              flexShrink:0, padding:'10px 14px', borderRadius:12,
              border:`2px solid ${selDay === i ? 'var(--primary)' : 'var(--border)'}`,
              background: selDay === i ? 'var(--primary-light)' : 'white',
              cursor:'pointer', textAlign:'center', transition:'all .18s',
              boxShadow: selDay === i ? '0 0 0 3px rgba(255,92,58,0.1)' : 'var(--shadow)',
            }}>
            <div style={{ fontSize:11, color:'var(--muted)', fontWeight:600, marginBottom:2 }}>{d.label}</div>
            <div style={{ fontSize:14, fontWeight:800, fontFamily:'Syne, sans-serif', color: selDay === i ? 'var(--primary)' : 'var(--text)' }}>{d.date}</div>
          </div>
        ))}
      </div>

      {/* Slots */}
      {selDay !== null && (
        <>
          <p style={{ fontSize:13, fontWeight:600, marginBottom:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Horario disponible</p>
          {slotsLoading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'24px 0', marginBottom:28 }}>
              <div style={{ width:24, height:24, border:'3px solid var(--border)', borderTopColor:'var(--primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
            </div>
          ) : slots.length === 0 ? (
            <p style={{ color:'var(--muted)', fontSize:13, textAlign:'center', padding:'16px 0', marginBottom:28 }}>
              No hay horarios disponibles para este día.
            </p>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginBottom:28 }}>
              {slots.map((slot, i) => (
                <div key={i} onClick={() => slot.available && setSelTime(slot.time)}
                  style={{
                    padding:'10px 8px', borderRadius:10, textAlign:'center',
                    border:`2px solid ${selTime === slot.time ? 'var(--primary)' : slot.available ? 'var(--border)' : 'transparent'}`,
                    background: selTime === slot.time ? 'var(--primary-light)' : slot.available ? 'white' : '#F5F5FA',
                    color: selTime === slot.time ? 'var(--primary)' : slot.available ? 'var(--text)' : 'var(--border)',
                    cursor: slot.available ? 'pointer' : 'not-allowed',
                    fontSize:13, fontWeight: selTime === slot.time ? 700 : 500,
                    textDecoration: !slot.available ? 'line-through' : 'none',
                    transition:'all .15s', boxShadow: selTime === slot.time ? '0 0 0 3px rgba(255,92,58,0.1)' : 'none',
                  }}>
                  {slot.time}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ display:'flex', gap:10 }}>
        <button onClick={onBack} style={{
          padding:'14px 20px', borderRadius:14, border:'2px solid var(--border)',
          background:'white', cursor:'pointer', display:'flex', alignItems:'center', gap:6,
          fontFamily:'DM Sans, sans-serif', fontSize:14, fontWeight:600, color:'var(--muted)',
        }}>
          <IconBack />
        </button>
        <button onClick={() => onNext({ day: days[selDay], time: selTime })}
          disabled={!selDay !== null && !selTime}
          style={{
            flex:1, padding:'15px', borderRadius:14, border:'none',
            background: selTime ? 'linear-gradient(135deg, #FF5C3A, #FF7A52)' : 'var(--border)',
            color: selTime ? 'white' : 'var(--muted)',
            fontFamily:'Syne, sans-serif', fontSize:16, fontWeight:700,
            cursor: selTime ? 'pointer' : 'not-allowed',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            boxShadow: selTime ? '0 6px 24px rgba(255,92,58,0.3)' : 'none',
            transition:'all .2s',
          }}>
          Continuar <IconArrow />
        </button>
      </div>
    </div>
  )
}

function Step3Contact({ slug, booking, onNext, onBack }) {
  const [form, setForm] = useState({ name:'', phone:'', notes:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const set = k => e => setForm(p => ({...p, [k]: e.target.value}))
  const valid = form.name.trim() && form.phone.trim().length >= 10

  const submit = async () => {
    setLoading(true)
    setError(null)
    try {
      const day = booking.dateTime.day
      const time = booking.dateTime.time
      const dateStr = day.full.toISOString().split('T')[0]
      const startsAt = `${dateStr}T${time}:00`
      const res = await fetch(`${API}/api/appointments/public/${slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: booking.service.id,
          staffId: booking.staffId || null,
          startsAt,
          clientName: form.name,
          clientPhone: form.phone,
          clientNotes: form.notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al agendar')
      setLoading(false)
      onNext(form)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const inputStyle = {
    width:'100%', padding:'13px 16px', borderRadius:12,
    border:'2px solid var(--border)', background:'white',
    fontSize:15, fontFamily:'DM Sans, sans-serif', color:'var(--text)',
    outline:'none', transition:'border-color .2s',
  }

  return (
    <div className="fade-up">
      <h2 style={{ fontSize:20, fontWeight:800, marginBottom:6 }}>Tus datos de contacto</h2>
      <p style={{ color:'var(--muted)', fontSize:14, marginBottom:24 }}>
        Para confirmar y enviarte recordatorio por WhatsApp
      </p>

      {/* Resumen de la cita */}
      <div style={{
        background:'linear-gradient(135deg, rgba(255,92,58,0.06), rgba(255,122,82,0.03))',
        border:'1px solid rgba(255,92,58,0.15)', borderRadius:14, padding:'16px 18px', marginBottom:24,
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontSize:13, color:'var(--muted)' }}>Servicio</span>
          <span style={{ fontSize:13, fontWeight:600 }}>{booking.service.name}</span>
        </div>
        {booking.staffName && (
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
            <span style={{ fontSize:13, color:'var(--muted)' }}>Con</span>
            <span style={{ fontSize:13, fontWeight:600 }}>{booking.staffName}</span>
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontSize:13, color:'var(--muted)' }}>Fecha</span>
          <span style={{ fontSize:13, fontWeight:600 }}>{booking.dateTime.day?.date} · {booking.dateTime.time}</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <span style={{ fontSize:13, color:'var(--muted)' }}>Total</span>
          <span style={{ fontSize:15, fontWeight:800, color:'var(--primary)', fontFamily:'Syne, sans-serif' }}>${booking.service.price} MXN</span>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:24 }}>
        <div>
          <label style={{ fontSize:13, fontWeight:600, color:'var(--muted)', display:'block', marginBottom:6 }}>Nombre completo *</label>
          <input value={form.name} onChange={set('name')} placeholder="Ej. María García"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
        <div>
          <label style={{ fontSize:13, fontWeight:600, color:'var(--muted)', display:'block', marginBottom:6 }}>
            WhatsApp / Teléfono *
          </label>
          <input value={form.phone} onChange={set('phone')} placeholder="+52 442 123 4567" type="tel"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
        <div>
          <label style={{ fontSize:13, fontWeight:600, color:'var(--muted)', display:'block', marginBottom:6 }}>
            Notas para el negocio <span style={{ fontWeight:400 }}>(opcional)</span>
          </label>
          <textarea value={form.notes} onChange={set('notes')} placeholder="Ej. Prefiero corte con tijera, tengo el cabello rizado..."
            rows={3} style={{ ...inputStyle, resize:'none' }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)',
          borderRadius:10, padding:'12px 14px', marginBottom:16,
        }}>
          <p style={{ fontSize:13, color:'#B91C1C', lineHeight:1.5 }}>{error}</p>
        </div>
      )}

      {/* WhatsApp note */}
      <div style={{
        display:'flex', gap:10, alignItems:'flex-start',
        background:'rgba(0,196,140,0.07)', border:'1px solid rgba(0,196,140,0.2)',
        borderRadius:10, padding:'12px 14px', marginBottom:24,
      }}>
        <span style={{ color:'#00C48C', flexShrink:0 }}><IconWA /></span>
        <p style={{ fontSize:13, color:'#006850', lineHeight:1.5 }}>
          Recibirás <strong>confirmación inmediata</strong> y recordatorio <strong>1 hora antes</strong> por WhatsApp.
        </p>
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <button onClick={onBack} style={{
          padding:'14px 20px', borderRadius:14, border:'2px solid var(--border)',
          background:'white', cursor:'pointer', display:'flex', alignItems:'center', gap:6,
          fontFamily:'DM Sans, sans-serif', fontSize:14, fontWeight:600, color:'var(--muted)',
        }}>
          <IconBack />
        </button>
        <button onClick={submit} disabled={!valid || loading}
          style={{
            flex:1, padding:'15px', borderRadius:14, border:'none',
            background: valid ? 'linear-gradient(135deg, #FF5C3A, #FF7A52)' : 'var(--border)',
            color: valid ? 'white' : 'var(--muted)',
            fontFamily:'Syne, sans-serif', fontSize:16, fontWeight:700,
            cursor: valid ? 'pointer' : 'not-allowed',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            boxShadow: valid ? '0 6px 24px rgba(255,92,58,0.3)' : 'none',
            transition:'all .2s',
          }}>
          {loading ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation:'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <><span>Confirmar cita</span><IconArrow /></>
          )}
        </button>
      </div>
    </div>
  )
}

function Step4Confirmation({ business, booking }) {
  const waMessage = encodeURIComponent(
    `Hola, acabo de agendar una cita en ${business.name}:\n` +
    `📋 ${booking.service.name}\n` +
    `📅 ${booking.dateTime.day?.date} a las ${booking.dateTime.time}\n` +
    `💰 $${booking.service.price} MXN\n\nNos vemos pronto! ✂️`
  )
  return (
    <div className="fade-up" style={{ textAlign:'center', padding:'8px 0' }}>
      {/* Success animation */}
      <div style={{
        width:80, height:80, borderRadius:'50%',
        background:'linear-gradient(135deg, #00C48C, #00E5A0)',
        display:'flex', alignItems:'center', justifyContent:'center',
        margin:'0 auto 24px',
        boxShadow:'0 8px 32px rgba(0,196,140,0.35)',
        animation:'pulse 2s ease-in-out infinite',
        fontSize:36,
      }}>
        ✅
      </div>

      <h2 style={{ fontSize:24, fontWeight:800, marginBottom:8 }}>¡Cita confirmada!</h2>
      <p style={{ color:'var(--muted)', fontSize:15, lineHeight:1.6, marginBottom:28 }}>
        Te enviamos confirmación a tu WhatsApp.<br />
        También recibirás un recordatorio <strong>1 hora antes</strong>.
      </p>

      {/* Resumen */}
      <div style={{
        background:'white', border:'1px solid var(--border)',
        borderRadius:16, padding:'20px', marginBottom:24, textAlign:'left',
        boxShadow:'var(--shadow)',
      }}>
        {[
          { label:'Negocio',   val: business.name },
          { label:'Servicio',  val: booking.service.name },
          ...(booking.staffName ? [{ label:'Con', val: booking.staffName }] : []),
          { label:'Fecha',     val: `${booking.dateTime.day?.date}` },
          { label:'Hora',      val: booking.dateTime.time },
          { label:'Duración',  val: `${booking.service.duration_min} min` },
          { label:'Total',     val: `$${booking.service.price} MXN`, accent:true },
        ].map((r, i, arr) => (
          <div key={i} style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            paddingBottom: i < arr.length - 1 ? 10 : 0, marginBottom: i < arr.length - 1 ? 10 : 0,
            borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <span style={{ fontSize:13, color:'var(--muted)' }}>{r.label}</span>
            <span style={{ fontSize:14, fontWeight:700, color: r.accent ? 'var(--primary)' : 'var(--text)', fontFamily: r.accent ? 'Syne, sans-serif' : 'inherit' }}>{r.val}</span>
          </div>
        ))}
      </div>

      {/* Botón WhatsApp */}
      <a href={`https://wa.me/523349828421?text=${waMessage}`} target="_blank" rel="noreferrer"
        style={{
          display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          padding:'15px', borderRadius:14, textDecoration:'none',
          background:'linear-gradient(135deg, #25D366, #128C7E)',
          color:'white', fontFamily:'Syne, sans-serif', fontSize:16, fontWeight:700,
          boxShadow:'0 6px 24px rgba(37,211,102,0.3)', marginBottom:12,
        }}>
        <IconWA /> Abrir en WhatsApp
      </a>
      <p style={{ fontSize:12, color:'var(--muted)' }}>
        Agendado con <a href="https://agendamx.net" style={{ color:'var(--primary)', textDecoration:'none', fontWeight:600 }}>AgendaMX</a> · Reserva tu cita gratis
      </p>
    </div>
  )
}

// ─── Main Booking Page ─────────────────────────────────────────────
export default function BookingPage({ slug }) {
  const [step, setStep]         = useState(0)
  const [service, setService]   = useState(null)
  const [dateTime, setDateTime] = useState({})
  const [contact, setContact]   = useState({})
  const [staffMembers, setStaffMembers] = useState([])
  const [selectedStaff, setSelectedStaff] = useState(null) // null = "any available"

  const [business, setBusiness]     = useState(null)
  const [services, setServices]     = useState([])
  const [pageLoading, setPageLoading] = useState(true)
  const [pageError, setPageError]   = useState(null)

  const hasMultiStaff = staffMembers.length > 1
  const stepOffset = hasMultiStaff ? 1 : 0

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/businesses/public/${slug}`).then(r => { if (!r.ok) throw new Error('not found'); return r.json() }),
      fetch(`${API}/api/services/public/${slug}`).then(r => r.json()),
    ]).then(([bizData, svcData]) => {
      setBusiness(bizData.business)
      setServices(svcData.services)
    }).catch(() => setPageError('Negocio no encontrado'))
      .finally(() => setPageLoading(false))
    // Fetch staff members (non-blocking, best effort)
    fetch(`${API}/api/staff/public/${slug}`).then(r => r.json()).then(d => setStaffMembers(d.staff || [])).catch(() => {})
  }, [slug])

  const handleServiceNext = () => setStep(1)
  const handleDateTimeNext = (dt) => { setDateTime(dt); setStep(1 + stepOffset + 1) }
  const handleContactNext = (c)  => { setContact(c);   setStep(2 + stepOffset + 1) }

  const stepLabels = hasMultiStaff
    ? ['Servicio','Profesional','Fecha','Datos','¡Listo!']
    : ['Servicio','Fecha','Datos','¡Listo!']

  if (pageLoading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid var(--border)', borderTopColor:'var(--primary)', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }} />
        <p style={{ color:'var(--muted)', fontSize:14 }}>Cargando...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (pageError) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center', padding:'24px' }}>
        <p style={{ fontSize:48, marginBottom:16 }}>😕</p>
        <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:20, fontWeight:800, marginBottom:8 }}>Negocio no encontrado</h2>
        <p style={{ color:'var(--muted)', fontSize:14 }}>El enlace puede estar incorrecto o el negocio ya no está disponible.</p>
      </div>
    </div>
  )

  const initials = business.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
  const coverGradient = `linear-gradient(135deg, ${business.accent_color || '#FF5C3A'} 0%, #1A0A05 100%)`

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>

      {/* Header del negocio */}
      <div style={{
        background: coverGradient,
        padding:'28px 24px 32px',
        position:'relative', overflow:'hidden',
      }}>
        {/* Patrón decorativo */}
        <div style={{
          position:'absolute', top:-40, right:-40,
          width:180, height:180, borderRadius:'50%',
          border:'1px solid rgba(255,255,255,0.1)',
        }} />
        <div style={{
          position:'absolute', top:-10, right:-10,
          width:100, height:100, borderRadius:'50%',
          border:'1px solid rgba(255,255,255,0.15)',
        }} />

        <div style={{ position:'relative', zIndex:1 }}>
          {/* Logo del negocio */}
          <div style={{
            width:64, height:64, borderRadius:16,
            background:'rgba(255,255,255,0.15)',
            backdropFilter:'blur(10px)',
            border:'2px solid rgba(255,255,255,0.25)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:'Syne, sans-serif', fontSize:20, fontWeight:800,
            color:'white', marginBottom:14, letterSpacing:'-1px',
          }}>
            {initials}
          </div>

          <h1 className="fade-up" style={{ fontSize:22, fontWeight:800, color:'white', marginBottom:4 }}>
            {business.name}
          </h1>
          <p className="fade-up d1" style={{ color:'rgba(255,255,255,0.75)', fontSize:13, marginBottom:12 }}>
            {business.tagline || business.description || ''}
          </p>

          <div className="fade-up d2" style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            {business.address && (
              <span style={{ display:'flex', alignItems:'center', gap:4, color:'rgba(255,255,255,0.7)', fontSize:13 }}>
                <IconPin /> {business.address}
              </span>
            )}
            {business.city && (
              <span style={{ display:'flex', alignItems:'center', gap:4, color:'rgba(255,255,255,0.7)', fontSize:13 }}>
                <IconPin /> {business.city}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp floating button */}
      <a href={`https://wa.me/523349828421?text=${encodeURIComponent('Hola ' + slug)}`}
        target="_blank" rel="noreferrer"
        style={{
          position:'fixed', bottom:24, right:24, zIndex:100,
          width:56, height:56, borderRadius:'50%',
          background:'linear-gradient(135deg, #25D366, #128C7E)',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 20px rgba(37,211,102,0.4)',
          color:'white', textDecoration:'none',
          transition:'transform .2s',
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        title="Agendar por WhatsApp"
      >
        <IconWA />
      </a>

      {/* Booking card */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 16px 40px' }}>
        <div style={{
          width:'100%', maxWidth:440,
          background:'white', borderRadius:20,
          boxShadow:'var(--shadow-lg)',
          padding:'28px 24px',
          marginTop:-16, position:'relative',
          border:'1px solid var(--border)',
        }}>
          <StepIndicator step={step} steps={stepLabels} />

          {step === 0 && <Step1Services services={services} selected={service} onSelect={setService} onNext={handleServiceNext} />}

          {/* Staff selection step (only when multiple staff) */}
          {step === 1 && hasMultiStaff && (
            <div className="fade-up">
              <h2 style={{ fontSize:20, fontWeight:800, marginBottom:6 }}>Elige tu profesional</h2>
              <p style={{ color:'var(--muted)', fontSize:14, marginBottom:24 }}>Selecciona quién te atenderá</p>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:28 }}>
                {/* "Any available" option */}
                <div onClick={() => setSelectedStaff(null)}
                  style={{
                    display:'flex', alignItems:'center', gap:14,
                    padding:'16px 18px', borderRadius:14,
                    border:`2px solid ${selectedStaff === null ? 'var(--primary)' : 'var(--border)'}`,
                    background: selectedStaff === null ? 'var(--primary-light)' : 'white',
                    cursor:'pointer', transition:'all .18s',
                    boxShadow: selectedStaff === null ? '0 0 0 4px rgba(255,92,58,0.1)' : 'var(--shadow)',
                  }}
                  onMouseOver={e => selectedStaff !== null && (e.currentTarget.style.borderColor = '#E0E0EE', e.currentTarget.style.transform = 'translateY(-1px)')}
                  onMouseOut={e => selectedStaff !== null && (e.currentTarget.style.borderColor = 'var(--border)', e.currentTarget.style.transform = 'none')}
                >
                  <div style={{
                    width:44, height:44, borderRadius:'50%',
                    background: selectedStaff === null ? 'linear-gradient(135deg, #FF5C3A, #FF7A52)' : 'var(--border)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'white', fontSize:18, flexShrink:0,
                  }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <div style={{ flex:1 }}>
                    <span style={{ fontSize:15, fontWeight:600 }}>Cualquier disponible</span>
                    <div style={{ fontSize:13, color:'var(--muted)' }}>Te asignamos al mejor profesional</div>
                  </div>
                  <div style={{
                    width:22, height:22, borderRadius:'50%', flexShrink:0,
                    border:`2px solid ${selectedStaff === null ? 'var(--primary)' : 'var(--border)'}`,
                    background: selectedStaff === null ? 'var(--primary)' : 'white',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'white', transition:'all .18s',
                  }}>
                    {selectedStaff === null && <IconCheck />}
                  </div>
                </div>

                {/* Staff member cards */}
                {staffMembers.map(sm => {
                  const isSelected = selectedStaff?.id === sm.id
                  const smInitials = sm.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
                  return (
                    <div key={sm.id} onClick={() => setSelectedStaff(sm)}
                      style={{
                        display:'flex', alignItems:'center', gap:14,
                        padding:'16px 18px', borderRadius:14,
                        border:`2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--primary-light)' : 'white',
                        cursor:'pointer', transition:'all .18s',
                        boxShadow: isSelected ? '0 0 0 4px rgba(255,92,58,0.1)' : 'var(--shadow)',
                      }}
                      onMouseOver={e => !isSelected && (e.currentTarget.style.borderColor = '#E0E0EE', e.currentTarget.style.transform = 'translateY(-1px)')}
                      onMouseOut={e => !isSelected && (e.currentTarget.style.borderColor = 'var(--border)', e.currentTarget.style.transform = 'none')}
                    >
                      <div style={{
                        width:44, height:44, borderRadius:'50%',
                        background: isSelected ? 'linear-gradient(135deg, #FF5C3A, #FF7A52)' : 'linear-gradient(135deg, #7070A0, #9090C0)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color:'white', fontFamily:'Syne, sans-serif', fontSize:15, fontWeight:800, flexShrink:0,
                        letterSpacing:'-0.5px',
                      }}>
                        {smInitials}
                      </div>
                      <div style={{ flex:1 }}>
                        <span style={{ fontSize:15, fontWeight:600 }}>{sm.name}</span>
                        {sm.role && <div style={{ fontSize:13, color:'var(--muted)' }}>{sm.role}</div>}
                      </div>
                      <div style={{
                        width:22, height:22, borderRadius:'50%', flexShrink:0,
                        border:`2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--primary)' : 'white',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        color:'white', transition:'all .18s',
                      }}>
                        {isSelected && <IconCheck />}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setStep(0)} style={{
                  padding:'14px 20px', borderRadius:14, border:'2px solid var(--border)',
                  background:'white', cursor:'pointer', display:'flex', alignItems:'center', gap:6,
                  fontFamily:'DM Sans, sans-serif', fontSize:14, fontWeight:600, color:'var(--muted)',
                }}>
                  <IconBack />
                </button>
                <button onClick={() => setStep(2)}
                  style={{
                    flex:1, padding:'15px', borderRadius:14, border:'none',
                    background: 'linear-gradient(135deg, #FF5C3A, #FF7A52)',
                    color: 'white',
                    fontFamily:'Syne, sans-serif', fontSize:16, fontWeight:700,
                    cursor: 'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    boxShadow: '0 6px 24px rgba(255,92,58,0.3)',
                    transition:'all .2s',
                  }}>
                  Siguiente <IconArrow />
                </button>
              </div>
            </div>
          )}

          {step === (1 + stepOffset) && <Step2DateTime slug={slug} service={service} staffId={selectedStaff?.id} onNext={handleDateTimeNext} onBack={() => setStep(stepOffset > 0 ? 1 : 0)} />}
          {step === (2 + stepOffset) && <Step3Contact slug={slug} booking={{ service, dateTime, staffId: selectedStaff?.id, staffName: selectedStaff?.name }} onNext={handleContactNext} onBack={() => setStep(1 + stepOffset)} />}
          {step === (3 + stepOffset) && <Step4Confirmation business={business} booking={{ service, dateTime, contact, staffName: selectedStaff?.name }} />}
        </div>

        {/* Footer */}
        {step < (3 + stepOffset) && (
          <p style={{ marginTop:20, fontSize:12, color:'var(--muted)', textAlign:'center' }}>
            Powered by <a href="https://agendamx.net" style={{ color:'var(--primary)', textDecoration:'none', fontWeight:600 }}>AgendaMX</a> · Tu cita en 2 minutos 🚀
          </p>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }`}</style>
    </div>
  )
}
