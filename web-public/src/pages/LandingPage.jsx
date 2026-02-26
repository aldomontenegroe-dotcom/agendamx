import { useState, useEffect } from 'react';

export default function LandingPage({ onLogin, onRegister }) {
  const [scrolled, setScrolled] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [hoveredPlan, setHoveredPlan] = useState(null);
  const [hoveredStep, setHoveredStep] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const colors = {
    primary: '#FF5C3A',
    accent: '#00C48C',
    text: '#0A0A14',
    muted: '#8888A0',
    bg: '#FAFAFA',
    border: '#EBEBF0',
    white: '#FFFFFF',
  };

  const gradientCTA = 'linear-gradient(135deg, #FF5C3A, #FF7A52)';

  const features = [
    {
      icon: '🤖',
      title: 'Bot de WhatsApp',
      desc: 'Tus clientes agendan directo por WhatsApp. El bot contesta precios, horarios y confirma citas automáticamente.',
    },
    {
      icon: '📱',
      title: 'Página de reservas',
      desc: 'Cada negocio tiene su página única. Comparte el link y recibe citas 24/7.',
    },
    {
      icon: '📊',
      title: 'Panel admin',
      desc: 'Ve tus citas, clientes, ingresos y servicios. Todo en un solo lugar.',
    },
    {
      icon: '🔔',
      title: 'Recordatorios',
      desc: 'Recordatorio automático 24h y 1h antes. Reduce no-shows hasta 80%.',
    },
  ];

  const steps = [
    { num: '1', title: 'Registra tu negocio', desc: '2 minutos' },
    { num: '2', title: 'Comparte tu link', desc: 'con tus clientes' },
    { num: '3', title: 'Recibe citas automáticas', desc: 'por WhatsApp y web' },
  ];

  const plans = [
    {
      name: 'Gratis',
      price: '$0',
      period: '/mes',
      highlight: false,
      features: [
        '10 citas/mes',
        '1 servicio',
        'Bot WhatsApp',
        'Página de reservas',
      ],
    },
    {
      name: 'Starter',
      price: '$299',
      period: '/mes',
      highlight: true,
      features: [
        '100 citas/mes',
        'Servicios ilimitados',
        'Panel completo',
        'Recordatorios',
      ],
    },
    {
      name: 'Pro',
      price: '$599',
      period: '/mes',
      highlight: false,
      features: [
        'Citas ilimitadas',
        'Todo lo anterior',
        'Soporte prioritario',
        'Analytics avanzado',
      ],
    },
  ];

  const sectionStyle = {
    maxWidth: 1120,
    margin: '0 auto',
    padding: '80px 24px',
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: colors.text, background: colors.bg, minHeight: '100vh' }}>

      {/* Navbar */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: 64,
        background: scrolled ? 'rgba(250,250,250,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${colors.border}` : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <div style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: '-0.5px',
          cursor: 'default',
        }}>
          agenda<span style={{ color: colors.primary }}>MX</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={onLogin}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: colors.text,
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: 8,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = colors.border}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            Iniciar sesión
          </button>
          <button
            onClick={onRegister}
            style={{
              background: gradientCTA,
              border: 'none',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 600,
              color: colors.white,
              cursor: 'pointer',
              padding: '10px 20px',
              borderRadius: 10,
              boxShadow: '0 2px 8px rgba(255,92,58,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,92,58,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(255,92,58,0.3)';
            }}
          >
            Empezar gratis
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        ...sectionStyle,
        paddingTop: 140,
        paddingBottom: 100,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(255,92,58,0.08)',
          color: colors.primary,
          fontSize: 13,
          fontWeight: 600,
          padding: '6px 16px',
          borderRadius: 20,
          marginBottom: 24,
          letterSpacing: '0.3px',
        }}>
          La plataforma #1 de citas en México
        </div>
        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(36px, 5.5vw, 64px)',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-1.5px',
          margin: '0 0 24px 0',
          maxWidth: 720,
        }}>
          Agenda citas por WhatsApp.{' '}
          <span style={{
            background: 'linear-gradient(135deg, #FF5C3A, #FF7A52)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Automático.
          </span>
        </h1>
        <p style={{
          fontSize: 'clamp(16px, 2vw, 20px)',
          color: colors.muted,
          lineHeight: 1.6,
          maxWidth: 540,
          margin: '0 0 40px 0',
        }}>
          Tu negocio recibe citas 24/7 por WhatsApp, página web y panel admin. Sin esfuerzo.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={onRegister}
            style={{
              background: gradientCTA,
              border: 'none',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 17,
              fontWeight: 600,
              color: colors.white,
              cursor: 'pointer',
              padding: '16px 36px',
              borderRadius: 14,
              boxShadow: '0 4px 20px rgba(255,92,58,0.35)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(255,92,58,0.45)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,92,58,0.35)';
            }}
          >
            Crear mi negocio gratis
          </button>
          <button
            style={{
              background: 'none',
              border: 'none',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 16,
              fontWeight: 500,
              color: colors.muted,
              cursor: 'pointer',
              padding: '16px 12px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = colors.text}
            onMouseLeave={e => e.currentTarget.style.color = colors.muted}
          >
            Ver demo →
          </button>
        </div>

        {/* Trust badges */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          marginTop: 56,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          {['WhatsApp Business API', 'SSL Seguro', 'Soporte en español'].map((badge) => (
            <div key={badge} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: colors.muted,
            }}>
              <span style={{ color: colors.accent, fontSize: 14 }}>✓</span>
              {badge}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ ...sectionStyle, paddingTop: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 700,
            letterSpacing: '-0.8px',
            margin: '0 0 12px 0',
          }}>
            Todo lo que necesitas
          </h2>
          <p style={{ fontSize: 17, color: colors.muted, margin: 0 }}>
            Una sola plataforma para gestionar tu negocio completo.
          </p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 20,
        }}>
          {features.map((f, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredFeature(i)}
              onMouseLeave={() => setHoveredFeature(null)}
              style={{
                background: colors.white,
                borderRadius: 16,
                padding: 32,
                border: `1px solid ${hoveredFeature === i ? 'rgba(255,92,58,0.2)' : colors.border}`,
                boxShadow: hoveredFeature === i
                  ? '0 8px 30px rgba(0,0,0,0.08)'
                  : '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'all 0.3s ease',
                transform: hoveredFeature === i ? 'translateY(-4px)' : 'translateY(0)',
                cursor: 'default',
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 18,
                fontWeight: 700,
                margin: '0 0 10px 0',
                letterSpacing: '-0.3px',
              }}>
                {f.title}
              </h3>
              <p style={{
                fontSize: 14,
                color: colors.muted,
                lineHeight: 1.65,
                margin: 0,
              }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ ...sectionStyle }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 700,
            letterSpacing: '-0.8px',
            margin: '0 0 12px 0',
          }}>
            Listo en 3 pasos
          </h2>
          <p style={{ fontSize: 17, color: colors.muted, margin: 0 }}>
            Empieza a recibir citas en menos de 5 minutos.
          </p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 24,
          maxWidth: 800,
          margin: '0 auto',
        }}>
          {steps.map((s, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredStep(i)}
              onMouseLeave={() => setHoveredStep(null)}
              style={{
                textAlign: 'center',
                padding: 32,
                borderRadius: 16,
                background: hoveredStep === i ? colors.white : 'transparent',
                boxShadow: hoveredStep === i ? '0 8px 30px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: i === 0
                  ? 'linear-gradient(135deg, #FF5C3A, #FF7A52)'
                  : i === 1
                    ? 'linear-gradient(135deg, #00C48C, #00E5A0)'
                    : 'linear-gradient(135deg, #6C5CE7, #A29BFE)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Syne', sans-serif",
                fontSize: 22,
                fontWeight: 800,
                color: colors.white,
                margin: '0 auto 20px',
              }}>
                {s.num}
              </div>
              <h3 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 17,
                fontWeight: 700,
                margin: '0 0 6px 0',
                letterSpacing: '-0.3px',
              }}>
                {s.title}
              </h3>
              <p style={{ fontSize: 14, color: colors.muted, margin: 0 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ ...sectionStyle }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 700,
            letterSpacing: '-0.8px',
            margin: '0 0 12px 0',
          }}>
            Precios simples
          </h2>
          <p style={{ fontSize: 17, color: colors.muted, margin: 0 }}>
            Sin contratos. Cancela cuando quieras.
          </p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          maxWidth: 920,
          margin: '0 auto',
        }}>
          {plans.map((plan, i) => {
            const isHovered = hoveredPlan === i;
            const isHighlight = plan.highlight;
            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredPlan(i)}
                onMouseLeave={() => setHoveredPlan(null)}
                style={{
                  background: colors.white,
                  borderRadius: 16,
                  padding: 36,
                  border: isHighlight
                    ? '2px solid #FF5C3A'
                    : `1px solid ${colors.border}`,
                  boxShadow: isHighlight
                    ? '0 8px 40px rgba(255,92,58,0.15)'
                    : isHovered
                      ? '0 8px 30px rgba(0,0,0,0.08)'
                      : '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'all 0.3s ease',
                  transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {isHighlight && (
                  <div style={{
                    position: 'absolute',
                    top: -13,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: gradientCTA,
                    color: colors.white,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 16px',
                    borderRadius: 20,
                    letterSpacing: '0.3px',
                  }}>
                    Más popular
                  </div>
                )}
                <h3 style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  margin: '0 0 4px 0',
                  letterSpacing: '-0.3px',
                }}>
                  {plan.name}
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 2,
                  margin: '12px 0 24px 0',
                }}>
                  <span style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 42,
                    fontWeight: 800,
                    letterSpacing: '-1px',
                  }}>
                    {plan.price}
                  </span>
                  <span style={{ fontSize: 15, color: colors.muted }}>
                    {plan.period}
                  </span>
                </div>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 28px 0',
                  flex: 1,
                }}>
                  {plan.features.map((feat, j) => (
                    <li key={j} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 14,
                      color: colors.text,
                      padding: '7px 0',
                    }}>
                      <span style={{
                        color: colors.accent,
                        fontSize: 15,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}>
                        ✓
                      </span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onRegister}
                  style={{
                    width: '100%',
                    padding: '14px 0',
                    borderRadius: 12,
                    border: isHighlight ? 'none' : `1px solid ${colors.border}`,
                    background: isHighlight ? gradientCTA : colors.white,
                    color: isHighlight ? colors.white : colors.text,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isHighlight ? '0 4px 16px rgba(255,92,58,0.3)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (isHighlight) {
                      e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,92,58,0.4)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    } else {
                      e.currentTarget.style.background = colors.bg;
                      e.currentTarget.style.borderColor = colors.muted;
                    }
                  }}
                  onMouseLeave={e => {
                    if (isHighlight) {
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,92,58,0.3)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    } else {
                      e.currentTarget.style.background = colors.white;
                      e.currentTarget.style.borderColor = colors.border;
                    }
                  }}
                >
                  Empezar
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ ...sectionStyle, paddingBottom: 40 }}>
        <div style={{
          background: 'linear-gradient(135deg, #0A0A14 0%, #1A1A2E 100%)',
          borderRadius: 20,
          padding: 'clamp(40px, 6vw, 64px)',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(24px, 3.5vw, 36px)',
            fontWeight: 700,
            color: colors.white,
            letterSpacing: '-0.8px',
            margin: '0 0 12px 0',
          }}>
            Empieza a recibir citas hoy
          </h2>
          <p style={{
            fontSize: 16,
            color: 'rgba(255,255,255,0.55)',
            margin: '0 0 32px 0',
          }}>
            Gratis. Sin tarjeta de crédito. Listo en 2 minutos.
          </p>
          <button
            onClick={onRegister}
            style={{
              background: gradientCTA,
              border: 'none',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 17,
              fontWeight: 600,
              color: colors.white,
              cursor: 'pointer',
              padding: '16px 40px',
              borderRadius: 14,
              boxShadow: '0 4px 24px rgba(255,92,58,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,92,58,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(255,92,58,0.4)';
            }}
          >
            Crear mi negocio gratis
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '32px 24px 40px',
        borderTop: `1px solid ${colors.border}`,
      }}>
        <p style={{
          fontSize: 14,
          color: colors.muted,
          margin: 0,
        }}>
          © 2026 AgendaMX. Hecho en México 🇲🇽
        </p>
      </footer>
    </div>
  );
}
