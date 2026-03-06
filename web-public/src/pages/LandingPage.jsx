import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  MessageSquare,
  CalendarDays,
  LayoutDashboard,
  BellRing,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage({ onLogin, onRegister }) {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);

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
      icon: <MessageSquare size={32} color={colors.primary} />,
      title: 'Bot de WhatsApp',
      desc: 'Tus clientes agendan directo por WhatsApp. El bot contesta precios, horarios y confirma citas automáticamente.',
    },
    {
      icon: <CalendarDays size={32} color={colors.accent} />,
      title: 'Página de reservas',
      desc: 'Cada negocio tiene su página única. Comparte el link y recibe citas 24/7.',
    },
    {
      icon: <LayoutDashboard size={32} color="#6C5CE7" />,
      title: 'Panel admin',
      desc: 'Ve tus citas, clientes, ingresos y servicios. Todo en un solo lugar.',
    },
    {
      icon: <BellRing size={32} color="#FFB020" />,
      title: 'Recordatorios',
      desc: 'Recordatorio automático 24h y 1h antes. Reduce no-shows hasta 80%.',
    },
  ];

  const steps = [
    { num: '1', title: 'Registra tu negocio', desc: 'En sólo 2 minutos' },
    { num: '2', title: 'Comparte tu link', desc: 'En tus redes sociales' },
    { num: '3', title: 'Recibe citas automáticas', desc: 'Por WhatsApp y web' },
  ];

  const plans = [
    {
      name: 'Gratis',
      price: '$0',
      period: '/mes',
      highlight: false,
      features: [
        '20 citas/mes',
        '3 servicios',
        '1 profesional',
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
        '200 citas/mes',
        'Servicios ilimitados',
        'Hasta 3 profesionales',
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
        'Profesionales ilimitados',
        'Soporte prioritario',
        'Analytics avanzado',
      ],
    },
  ];

  const sectionStyle = {
    maxWidth: 1120,
    margin: '0 auto',
    padding: '100px 24px',
    position: 'relative',
    zIndex: 1,
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: colors.text, background: colors.bg, minHeight: '100vh', overflow: 'hidden' }}>

      {/* Dynamic Background */}
      <div className="mesh-bg" />

      {/* Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          height: 72,
          background: scrolled ? 'rgba(255,255,255,0.7)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? `1px solid rgba(255,255,255,0.4)` : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.03)' : 'none',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: '-1px',
          cursor: 'pointer',
        }}>
          agenda<span className="text-gradient">MX</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={onLogin}
            style={{
              background: 'transparent',
              border: 'none',
              fontFamily: "'Inter', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color: colors.text,
              cursor: 'pointer',
              padding: '10px 16px',
              borderRadius: 12,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Iniciar sesión
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRegister}
            style={{
              background: gradientCTA,
              border: 'none',
              fontFamily: "'Inter', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color: colors.white,
              cursor: 'pointer',
              padding: '10px 24px',
              borderRadius: 12,
              boxShadow: '0 4px 14px rgba(255,92,58,0.4)',
            }}
          >
            Empezar gratis
          </motion.button>
        </div>
      </motion.nav>

      <main>
        {/* Hero */}
        <section style={{
          ...sectionStyle,
          paddingTop: 160,
          paddingBottom: 100,
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth > 900 ? '1.2fr 0.8fr' : '1fr',
            gap: 48,
            alignItems: 'center',
          }}>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.8)',
                color: colors.primary,
                fontSize: 14,
                fontWeight: 600,
                padding: '8px 20px',
                borderRadius: 30,
                marginBottom: 32,
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              }}>
                <span style={{ position: 'relative', display: 'flex', height: 8, width: 8 }}>
                  <span style={{ animate: 'ping', position: 'absolute', height: '100%', width: '100%', borderRadius: '50%', background: colors.primary, opacity: 0.4 }}></span>
                  <span style={{ position: 'relative', borderRadius: '50%', height: 8, width: 8, background: colors.primary }}></span>
                </span>
                La plataforma de reservas premium
              </motion.div>

              <motion.h1 variants={itemVariants} style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(44px, 5.5vw, 68px)',
                fontWeight: 800,
                lineHeight: 1.05,
                letterSpacing: '-2px',
                margin: '0 0 24px 0',
              }}>
                Agenda citas por WhatsApp.{' '}
                <span className="text-gradient">Automático.</span>
              </motion.h1>

              <motion.p variants={itemVariants} style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(18px, 2vw, 22px)',
                color: colors.muted,
                lineHeight: 1.5,
                maxWidth: 560,
                margin: '0 0 48px 0',
              }}>
                Tu negocio recibe citas 24/7 por WhatsApp, página web y panel admin. Sin esfuerzo, diseña una experiencia espectacular.
              </motion.p>

              <motion.div variants={itemVariants} style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onRegister}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: gradientCTA,
                    border: 'none',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 18,
                    fontWeight: 600,
                    color: colors.white,
                    cursor: 'pointer',
                    padding: '18px 40px',
                    borderRadius: 16,
                    boxShadow: '0 8px 30px rgba(255,92,58,0.3)',
                  }}
                >
                  Crear mi negocio <ArrowRight size={20} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,0,0,0.03)' }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: 'transparent',
                    border: `2px solid ${colors.border}`,
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 18,
                    fontWeight: 600,
                    color: colors.text,
                    cursor: 'pointer',
                    padding: '16px 36px',
                    borderRadius: 16,
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = colors.text}
                  onMouseLeave={e => e.currentTarget.style.borderColor = colors.border}
                >
                  Ver demo
                </motion.button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50, rotate: 5 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.4 }}
              style={{
                display: 'flex',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              {/* Mockup decoration */}
              <div style={{
                position: 'absolute',
                inset: '-10%',
                background: 'radial-gradient(circle at center, rgba(255,92,58,0.2) 0%, transparent 60%)',
                filter: 'blur(40px)',
                zIndex: -1
              }}></div>
              <img
                src="/mockup.png"
                alt="Demo de WhatsApp interactivo para agendar citas"
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  maxHeight: '650px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))'
                }}
              />
            </motion.div>

          </div>


          {/* Floating Abstract Elements */}
          <motion.div
            style={{ y: y1, position: 'absolute', right: '5%', top: '20%', zIndex: -1, opacity: 0.6 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
          >
            <div style={{ width: 300, height: 300, background: 'radial-gradient(circle, rgba(255,92,58,0.15) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(40px)' }} />
          </motion.div>

          <motion.div
            style={{ y: y2, position: 'absolute', left: '0%', bottom: '0%', zIndex: -1, opacity: 0.5 }}
          >
            <div style={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(0,196,140,0.1) 0%, rgba(255,255,255,0) 70%)', filter: 'blur(50px)' }} />
          </motion.div>
        </section>

        {/* Features */}
        <section style={{ ...sectionStyle, paddingTop: 40 }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: 64 }}
          >
            <h2 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 800,
              letterSpacing: '-1px',
              margin: '0 0 16px 0',
            }}>
              Todo lo que necesitas
            </h2>
            <p style={{ fontSize: 20, color: colors.muted, margin: 0, maxWidth: 600, marginInline: 'auto' }}>
              Una experiencia premium para gestionar tu negocio.
            </p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 24,
          }}>
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass"
                style={{
                  borderRadius: 24,
                  padding: 40,
                  cursor: 'default',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  background: 'rgba(255,255,255,0.5)',
                  width: 64, height: 64,
                  borderRadius: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 24,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                }}>
                  {f.icon}
                </div>
                <h3 style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  margin: '0 0 12px 0',
                  letterSpacing: '-0.5px',
                }}>
                  {f.title}
                </h3>
                <p style={{
                  fontSize: 16,
                  color: colors.muted,
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section style={{ ...sectionStyle, paddingTop: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 'clamp(32px, 5vw, 48px)',
                fontWeight: 800,
                letterSpacing: '-1px',
                margin: '0 0 16px 0',
              }}
            >
              Listo en 3 pasos
            </motion.h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 32,
            maxWidth: 900,
            margin: '0 auto',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute',
              top: 40,
              left: 0,
              right: 0,
              height: 2,
              background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.accent} 100%)`,
              opacity: 0.2,
              zIndex: -1,
              display: window.innerWidth > 768 ? 'block' : 'none'
            }} />

            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', delay: i * 0.2 }}
                style={{
                  textAlign: 'center',
                  padding: 32,
                  borderRadius: 24,
                  background: 'rgba(255,255,255,0.4)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.6)',
                }}
              >
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: colors.white,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 32,
                  fontWeight: 800,
                  color: i === 0 ? colors.primary : i === 1 ? colors.accent : '#6C5CE7',
                  margin: '0 auto 24px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                  position: 'relative',
                }}>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i }}
                    style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: `2px solid ${i === 0 ? colors.primary : i === 1 ? colors.accent : '#6C5CE7'}`, opacity: 0.2 }}
                  />
                  {s.num}
                </div>
                <h3 style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 20,
                  fontWeight: 700,
                  margin: '0 0 8px 0',
                }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: 16, color: colors.muted, margin: 0 }}>
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section style={{ ...sectionStyle, paddingTop: 80 }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 800,
              letterSpacing: '-1px',
              margin: '0 0 16px 0',
            }}>
              Precios simples
            </h2>
            <p style={{ fontSize: 20, color: colors.muted, margin: 0 }}>
              Sin contratos. Cancela cuando quieras.
            </p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 32,
            maxWidth: 1000,
            margin: '0 auto',
          }}>
            {plans.map((plan, i) => {
              const isHighlight = plan.highlight;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  whileHover={{ y: -10 }}
                  className={isHighlight ? "" : "glass"}
                  style={{
                    background: isHighlight ? colors.white : 'rgba(255,255,255,0.5)',
                    borderRadius: 32,
                    padding: 40,
                    border: isHighlight ? 'none' : `1px solid rgba(255,255,255,0.8)`,
                    boxShadow: isHighlight ? '0 20px 60px rgba(0,0,0,0.08)' : 'none',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}
                >
                  {isHighlight && (
                    <div style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0,
                      height: 6,
                      background: gradientCTA,
                    }} />
                  )}
                  {isHighlight && (
                    <div style={{
                      display: 'inline-block',
                      alignSelf: 'flex-start',
                      background: 'rgba(255,92,58,0.1)',
                      color: colors.primary,
                      fontSize: 13,
                      fontWeight: 700,
                      padding: '6px 16px',
                      borderRadius: 20,
                      marginBottom: 20,
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase'
                    }}>
                      Más popular
                    </div>
                  )}
                  <h3 style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 24,
                    fontWeight: 700,
                    margin: isHighlight ? '0 0 8px 0' : '0 0 8px 0',
                  }}>
                    {plan.name}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 4,
                    margin: '16px 0 32px 0',
                  }}>
                    <span style={{
                      fontFamily: "'Syne', sans-serif",
                      fontSize: 48,
                      fontWeight: 800,
                      letterSpacing: '-2px',
                      color: isHighlight ? colors.primary : colors.text
                    }}>
                      {plan.price}
                    </span>
                    <span style={{ fontSize: 16, color: colors.muted, fontWeight: 500 }}>
                      {plan.period}
                    </span>
                  </div>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 40px 0',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16
                  }}>
                    {plan.features.map((feat, j) => (
                      <li key={j} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        fontSize: 16,
                        color: colors.text,
                        fontWeight: 500
                      }}>
                        <CheckCircle2 size={20} color={isHighlight ? colors.primary : colors.accent} />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onRegister}
                    style={{
                      width: '100%',
                      padding: '16px 0',
                      borderRadius: 16,
                      border: 'none',
                      background: isHighlight ? gradientCTA : 'rgba(0,0,0,0.04)',
                      color: isHighlight ? colors.white : colors.text,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 16,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: isHighlight ? '0 8px 24px rgba(255,92,58,0.3)' : 'none',
                    }}
                  >
                    Empezar ahora
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section style={{ ...sectionStyle, paddingTop: 60, paddingBottom: 100 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            style={{
              background: 'linear-gradient(135deg, #0A0A14 0%, #16162A 100%)',
              borderRadius: 40,
              padding: '80px 40px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
            {/* Decorative glowing orbs */}
            <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: 400, height: 400, background: 'rgba(255,92,58,0.15)', filter: 'blur(80px)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-50%', right: '-10%', width: 400, height: 400, background: 'rgba(0,196,140,0.15)', filter: 'blur(80px)', borderRadius: '50%' }} />

            <div style={{ position: 'relative', zIndex: 10 }}>
              <h2 style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 'clamp(32px, 5vw, 48px)',
                fontWeight: 800,
                color: colors.white,
                letterSpacing: '-1px',
                margin: '0 0 24px 0',
              }}>
                Únete al futuro de las reservas
              </h2>
              <p style={{
                fontSize: 20,
                color: 'rgba(255,255,255,0.7)',
                margin: '0 auto 48px auto',
                maxWidth: 600
              }}>
                Miles de negocios ya están ahorrando horas de trabajo. Pruébalo gratis hoy, sin compromisos.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onRegister}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 12,
                  background: gradientCTA,
                  border: 'none',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: colors.white,
                  cursor: 'pointer',
                  padding: '20px 48px',
                  borderRadius: 20,
                  boxShadow: '0 10px 40px rgba(255,92,58,0.4)',
                }}
              >
                Comenzar gratis <ArrowRight size={20} />
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer style={{
          textAlign: 'center',
          padding: '40px 24px',
          borderTop: `1px solid rgba(0,0,0,0.05)`,
          background: colors.white
        }}>
          <p style={{
            fontSize: 15,
            color: colors.muted,
            fontWeight: 500,
            margin: '0 0 12px 0',
          }}>
            © 2026 AgendaMX. Hecho en México 🇲🇽
          </p>
          <a href="https://www.popservices.net" target="_blank" rel="noreferrer"
            style={{
              fontSize: 14,
              color: colors.primary,
              fontWeight: 600,
              textDecoration: 'none',
              transition: 'opacity 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.7'}
            onMouseOut={e => e.currentTarget.style.opacity = '1'}
          >
            by popservices
          </a>
        </footer>
      </main>
    </div>
  );
}
