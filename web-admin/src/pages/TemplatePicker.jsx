import { useState } from 'react'

const TEMPLATES = [
  {
    id: 'barberia',
    name: 'Barbería',
    emoji: '✂️',
    tagline: 'Cortes y afeitados',
    accent: '#FF5C3A',
    bg: 'linear-gradient(135deg,#2D1810,#1A0A05)',
    services: ['Corte clásico $150','Corte + Barba $220','Afeitado $120'],
    hours: 'Lun–Vie 9–20h, Sáb 9–18h',
  },
  {
    id: 'salon-belleza',
    name: 'Salón de Belleza',
    emoji: '💅',
    tagline: 'Cabello, uñas y más',
    accent: '#D946EF',
    bg: 'linear-gradient(135deg,#2D0A38,#160520)',
    services: ['Tinte completo $500','Uñas acrílicas $350','Keratina $900'],
    hours: 'Lun–Vie 9–19h, Sáb 9–17h',
  },
  {
    id: 'veterinaria',
    name: 'Veterinaria',
    emoji: '🐾',
    tagline: 'Salud de tus mascotas',
    accent: '#10B981',
    bg: 'linear-gradient(135deg,#042D1C,#011A10)',
    services: ['Consulta $300','Baño + Corte $350','Vacunación $250'],
    hours: 'Lun–Sáb 9–19h, Dom 10–13h',
  },
  {
    id: 'spa-masaje',
    name: 'Spa & Masajes',
    emoji: '🧖',
    tagline: 'Relajación y bienestar',
    accent: '#8B5CF6',
    bg: 'linear-gradient(135deg,#1E0A3C,#100520)',
    services: ['Masaje 60min $500','Facial $450','Piedras calientes $700'],
    hours: 'Lun–Vie 10–20h, Dom 11–16h',
  },
  {
    id: 'dentista',
    name: 'Dentista',
    emoji: '🦷',
    tagline: 'Salud y estética dental',
    accent: '#0EA5E9',
    bg: 'linear-gradient(135deg,#031929,#010D14)',
    services: ['Consulta $300','Limpieza $500','Blanqueamiento $1,500'],
    hours: 'Lun–Vie 9–19h, Sáb 9–14h',
  },
  {
    id: 'psicologo',
    name: 'Psicólogo',
    emoji: '🧠',
    tagline: 'Salud mental y terapia',
    accent: '#6366F1',
    bg: 'linear-gradient(135deg,#0D1129,#060812)',
    services: ['1ª consulta $600','Sesión individual $700','Pareja $900'],
    hours: 'Lun–Vie 9–19h',
  },
  {
    id: 'nutriologo',
    name: 'Nutriólogo',
    emoji: '🥗',
    tagline: 'Nutrición y salud integral',
    accent: '#22C55E',
    bg: 'linear-gradient(135deg,#042A10,#021508)',
    services: ['Consulta inicial $500','Seguimiento $350','Plan nutricional $700'],
    hours: 'Lun–Vie 8–18h, Sáb 9–13h',
  },
  {
    id: 'fotografo',
    name: 'Fotógrafo',
    emoji: '📸',
    tagline: 'Fotografía profesional',
    accent: '#F59E0B',
    bg: 'linear-gradient(135deg,#1C1508,#0D0B04)',
    services: ['Retrato 1hr $1,200','Familiar $2,000','XV años $4,500'],
    hours: 'Lun–Sáb 9–18h, Dom 10–15h',
  },
  {
    id: 'tatuador',
    name: 'Tatuador',
    emoji: '🎨',
    tagline: 'Arte corporal y piercing',
    accent: '#A855F7',
    bg: 'linear-gradient(135deg,#160A24,#0A0412)',
    services: ['Consulta gratis','Tatoo pequeño $800','Tatoo mediano $1,800'],
    hours: 'Mar–Dom 12–21h',
  },
  {
    id: 'yoga-fitness',
    name: 'Yoga / Fitness',
    emoji: '🧘',
    tagline: 'Clases y entrenamiento',
    accent: '#F97316',
    bg: 'linear-gradient(135deg,#1C0C04,#0E0602)',
    services: ['Clase grupal $150','Clase privada $450','Pack 8 clases $900'],
    hours: 'Lun–Vie 6–21h, Sáb 7–14h',
  },
  {
    id: 'tutor',
    name: 'Tutor / Maestro',
    emoji: '📚',
    tagline: 'Clases y asesorías',
    accent: '#3B82F6',
    bg: 'linear-gradient(135deg,#061528,#030912)',
    services: ['Clase 1 hora $250','Asesoría examen $300','Pack 8 clases $1,700'],
    hours: 'Lun–Vie 7–21h, Sáb 9–15h',
  },
  {
    id: 'medico',
    name: 'Médico / Clínica',
    emoji: '🩺',
    tagline: 'Consultas médicas',
    accent: '#06B6D4',
    bg: 'linear-gradient(135deg,#031E26,#010F14)',
    services: ['Consulta general $400','Urgencia $500','Online $350'],
    hours: 'Lun–Vie 8–18h, Sáb 9–13h',
  },
]

export default function TemplatePicker({ onSelect }) {
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState(null)
  const [confirming, setConfirming] = useState(false)

  const handlePick = (t) => {
    setSelected(t)
    setConfirming(true)
  }

  const handleConfirm = () => {
    onSelect(selected)
  }

  if (confirming && selected) {
    return <ConfirmScreen t={selected} onConfirm={handleConfirm} onBack={() => setConfirming(false)} />
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#08080F',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Mesh background */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 }}>
        <div style={{ position:'absolute', top:'-20%', left:'-10%', width:'60%', height:'60%',
          background:'radial-gradient(ellipse,rgba(255,92,58,.08) 0%,transparent 70%)',
          animation:'drift1 14s ease-in-out infinite alternate' }} />
        <div style={{ position:'absolute', bottom:'-20%', right:'-10%', width:'55%', height:'55%',
          background:'radial-gradient(ellipse,rgba(0,229,160,.05) 0%,transparent 70%)',
          animation:'drift2 17s ease-in-out infinite alternate' }} />
      </div>

      <div style={{ position:'relative', zIndex:1, maxWidth:1100, margin:'0 auto', padding:'52px 24px 80px' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(255,92,58,.1)', border:'1px solid rgba(255,92,58,.2)',
            borderRadius:100, padding:'6px 18px', marginBottom:24 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#FF5C3A', display:'inline-block', boxShadow:'0 0 8px #FF5C3A' }} />
            <span style={{ fontSize:12, color:'#FF8C6A', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase' }}>
              Paso 1 de 2
            </span>
          </div>
          <h1 style={{ fontFamily:"'Syne', sans-serif", fontSize:'clamp(28px,5vw,44px)', fontWeight:800,
            color:'#F0F0FF', marginBottom:12, lineHeight:1.15 }}>
            ¿Cuál es tu tipo de negocio?
          </h1>
          <p style={{ color:'#7070A0', fontSize:16, maxWidth:480, margin:'0 auto' }}>
            Configuramos tu cuenta con servicios y horarios listos para usar. Siempre puedes personalizar después.
          </p>
        </div>

        {/* Grid de templates */}
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))',
          gap:16,
        }}>
          {TEMPLATES.map((t, i) => (
            <TemplateCard
              key={t.id}
              t={t}
              index={i}
              isHovered={hovered === t.id}
              onHover={() => setHovered(t.id)}
              onLeave={() => setHovered(null)}
              onClick={() => handlePick(t)}
            />
          ))}
        </div>

        <p style={{ textAlign:'center', marginTop:36, fontSize:13, color:'#404060' }}>
          ¿No encuentras tu giro?{' '}
          <span style={{ color:'#FF5C3A', cursor:'pointer', fontWeight:600 }}
            onClick={() => onSelect({ id:'custom', name:'Otro', emoji:'⚡', accent:'#FF5C3A', services:[], hours:'' })}>
            Continúa con configuración personalizada →
          </span>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes drift1 { from{transform:translate(0,0)} to{transform:translate(4%,6%)} }
        @keyframes drift2 { from{transform:translate(0,0)} to{transform:translate(-4%,-5%)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { from{background-position:-200% center} to{background-position:200% center} }
      `}</style>
    </div>
  )
}

// ─── Tarjeta individual ───────────────────────────────────────────
function TemplateCard({ t, index, isHovered, onHover, onLeave, onClick }) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        position:'relative', overflow:'hidden',
        borderRadius:20, cursor:'pointer',
        border: isHovered
          ? `2px solid ${t.accent}`
          : '2px solid rgba(255,255,255,.07)',
        background: isHovered ? t.bg : '#0E0E1A',
        transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered ? `0 20px 50px ${t.accent}28` : '0 2px 12px rgba(0,0,0,.4)',
        transition:'all .22s cubic-bezier(.34,1.56,.64,1)',
        animation:`fadeUp .5s ease ${index * 0.04}s both`,
        padding:'24px',
      }}
    >
      {/* Glow top border */}
      {isHovered && (
        <div style={{ position:'absolute', top:0, left:'10%', right:'10%', height:2,
          background:`linear-gradient(90deg,transparent,${t.accent},transparent)`,
          borderRadius:2 }} />
      )}

      {/* Emoji + nombre */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{
          width:52, height:52, borderRadius:14, fontSize:24,
          display:'flex', alignItems:'center', justifyContent:'center',
          background: isHovered ? `${t.accent}22` : 'rgba(255,255,255,.04)',
          border: `1.5px solid ${isHovered ? t.accent + '55' : 'rgba(255,255,255,.08)'}`,
          transition:'all .22s',
        }}>
          {t.emoji}
        </div>

        {/* Flecha hover */}
        <div style={{
          width:32, height:32, borderRadius:8,
          background: isHovered ? t.accent : 'rgba(255,255,255,.04)',
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'all .22s', opacity: isHovered ? 1 : 0.3,
          fontSize:15,
        }}>
          →
        </div>
      </div>

      <h3 style={{
        fontFamily:"'Syne', sans-serif", fontSize:17, fontWeight:800,
        color: isHovered ? '#FFFFFF' : '#C0C0E0', marginBottom:4, transition:'color .2s',
      }}>
        {t.name}
      </h3>
      <p style={{ fontSize:13, color:'#5050708', marginBottom:16, color: isHovered ? '#A0A0C0' : '#505070' }}>
        {t.tagline}
      </p>

      {/* Servicios preview */}
      <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:16 }}>
        {t.services.map((s, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:4, height:4, borderRadius:'50%', background: isHovered ? t.accent : '#303050', flexShrink:0, transition:'background .2s' }} />
            <span style={{ fontSize:12, color: isHovered ? '#8080A8' : '#383858', transition:'color .2s' }}>
              {s}
            </span>
          </div>
        ))}
      </div>

      {/* Horario */}
      <div style={{
        padding:'8px 10px', borderRadius:8,
        background:'rgba(255,255,255,.03)',
        border:'1px solid rgba(255,255,255,.05)',
      }}>
        <span style={{ fontSize:11, color:'#404060' }}>🕐 </span>
        <span style={{ fontSize:11, color: isHovered ? '#6060808' : '#404060', color: isHovered ? '#606080' : '#404060' }}>
          {t.hours}
        </span>
      </div>

      {/* Accent bottom line */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:3,
        background: `linear-gradient(90deg,transparent,${t.accent},transparent)`,
        opacity: isHovered ? 0.8 : 0,
        transition:'opacity .22s',
      }} />
    </div>
  )
}

// ─── Pantalla de confirmación ─────────────────────────────────────
function ConfirmScreen({ t, onConfirm, onBack }) {
  return (
    <div style={{ minHeight:'100vh', background:'#08080F', display:'flex', alignItems:'center',
      justifyContent:'center', padding:24, fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ maxWidth:520, width:'100%', animation:'fadeUp .4s ease both' }}>

        {/* Card */}
        <div style={{
          background:'#0E0E1A', borderRadius:24,
          border:`2px solid ${t.accent}44`,
          padding:'40px', boxShadow:`0 24px 80px ${t.accent}18`,
          position:'relative', overflow:'hidden',
        }}>
          {/* BG glow */}
          <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200,
            borderRadius:'50%', background:`${t.accent}0C`, filter:'blur(40px)', pointerEvents:'none' }} />

          {/* Icono grande */}
          <div style={{ textAlign:'center', marginBottom:28 }}>
            <div style={{
              width:88, height:88, borderRadius:24, fontSize:40,
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              background:`${t.accent}18`, border:`2px solid ${t.accent}44`,
              marginBottom:16,
            }}>{t.emoji}</div>
            <h2 style={{ fontFamily:"'Syne', sans-serif", fontSize:26, fontWeight:800, color:'#F0F0FF', marginBottom:6 }}>
              {t.name}
            </h2>
            <p style={{ color:'#6060808', color:'#606080', fontSize:14 }}>{t.tagline}</p>
          </div>

          {/* Lo que se configura */}
          <div style={{ background:'rgba(255,255,255,.03)', borderRadius:14,
            border:'1px solid rgba(255,255,255,.07)', padding:'20px', marginBottom:24 }}>
            <p style={{ fontSize:12, fontWeight:700, color:'#5050708', color:'#505070',
              textTransform:'uppercase', letterSpacing:'.08em', marginBottom:14 }}>
              Se configurará automáticamente
            </p>
            {[
              { icon:'✅', text:`${t.services?.length || 0} servicios con precios sugeridos` },
              { icon:'🕐', text:`Horarios típicos: ${t.hours}` },
              { icon:'💬', text:'Mensaje de bienvenida personalizado' },
              { icon:'🔍', text:`SEO: ${t.name} en tu ciudad` },
            ].map((item, i) => (
              <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom: i < 3 ? 10 : 0 }}>
                <span style={{ fontSize:15, flexShrink:0 }}>{item.icon}</span>
                <span style={{ fontSize:14, color:'#A0A0C0' }}>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Nota */}
          <p style={{ fontSize:13, color:'#404060', textAlign:'center', marginBottom:24, lineHeight:1.6 }}>
            Puedes modificar cualquier servicio, precio u horario después desde tu panel.
          </p>

          {/* Botones */}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onBack} style={{
              padding:'14px 20px', borderRadius:14, border:'2px solid rgba(255,255,255,.1)',
              background:'transparent', color:'#6060808', color:'#606080', cursor:'pointer',
              fontFamily:"'DM Sans', sans-serif", fontSize:14, fontWeight:600,
            }}>
              ← Cambiar
            </button>
            <button onClick={onConfirm} style={{
              flex:1, padding:'15px', borderRadius:14, border:'none',
              background:`linear-gradient(135deg,${t.accent},${t.accent}CC)`,
              color:'white', fontFamily:"'Syne', sans-serif", fontSize:16, fontWeight:700,
              cursor:'pointer', boxShadow:`0 8px 28px ${t.accent}44`,
              transition:'transform .15s, box-shadow .15s',
            }}
            onMouseOver={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow=`0 12px 36px ${t.accent}55` }}
            onMouseOut={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=`0 8px 28px ${t.accent}44` }}
            >
              Continuar con {t.name} →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}
