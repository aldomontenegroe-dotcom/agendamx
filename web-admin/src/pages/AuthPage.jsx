import { useState, useEffect } from "react";

// ─── Hook auth ────────────────────────────────────────────────────────────────
function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("agendamx_token", data.token);
      return data;
    } catch (err) { setError(err.message); return null; }
    finally { setLoading(false); }
  };

  const register = async (form) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem("agendamx_token", data.token);
      return data;
    } catch (err) { setError(err.message); return null; }
    finally { setLoading(false); }
  };

  return { login, register, loading, error, setError };
}

// ─── Input Component ──────────────────────────────────────────────────────────
function Input({ label, type = "text", value, onChange, placeholder, icon, autoComplete }) {
  const [focused, setFocused] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const inputType = type === "password" ? (showPass ? "text" : "password") : type;

  return (
    <div>
      <label style={{ display:"block", fontSize:11, fontWeight:700, letterSpacing:"0.15em",
        textTransform:"uppercase", color:"rgba(251,191,36,0.6)", marginBottom:8 }}>
        {label}
      </label>
      <div style={{
        display:"flex", alignItems:"center", borderRadius:12,
        border: `1px solid ${focused ? "rgba(251,191,36,0.5)" : "rgba(255,255,255,0.08)"}`,
        background: focused ? "rgba(251,191,36,0.04)" : "rgba(255,255,255,0.02)",
        boxShadow: focused ? "0 0 24px rgba(251,191,36,0.08)" : "none",
        transition: "all 0.25s ease",
      }}>
        {icon && (
          <span style={{ paddingLeft:16, fontSize:16, opacity: focused ? 1 : 0.25, transition:"opacity 0.25s" }}>
            {icon}
          </span>
        )}
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex:1, background:"transparent", border:"none", outline:"none",
            padding:"14px 16px", color:"white", fontSize:14,
          }}
        />
        {type === "password" && (
          <button type="button" onClick={() => setShowPass(!showPass)}
            style={{ paddingRight:16, color:"rgba(255,255,255,0.25)", background:"none", border:"none", cursor:"pointer", fontSize:14,
              transition:"color 0.2s" }}
            onMouseEnter={e => e.target.style.color="rgba(251,191,36,0.8)"}
            onMouseLeave={e => e.target.style.color="rgba(255,255,255,0.25)"}>
            {showPass ? "🙈" : "👁️"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Brand Panel (left side) ──────────────────────────────────────────────────
function BrandPanel() {
  return (
    <div style={{
      width:"45%", minHeight:"100vh", position:"relative", overflow:"hidden",
      background:"linear-gradient(145deg, #1c0a00 0%, #1a1208 40%, #0f0f0f 100%)",
      display:"flex", flexDirection:"column", justifyContent:"space-between", padding:48,
    }}>
      {/* Glow effects */}
      <div style={{ position:"absolute", top:"-20%", left:"-10%", width:400, height:400,
        borderRadius:"50%", background:"radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)",
        pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"-10%", right:"-10%", width:300, height:300,
        borderRadius:"50%", background:"radial-gradient(circle, rgba(217,119,6,0.08) 0%, transparent 70%)",
        pointerEvents:"none" }} />
      {/* Grid */}
      <div style={{ position:"absolute", inset:0, opacity:0.04,
        backgroundImage:"linear-gradient(rgba(251,191,36,1) 1px, transparent 1px), linear-gradient(90deg, rgba(251,191,36,1) 1px, transparent 1px)",
        backgroundSize:"48px 48px" }} />

      {/* Logo */}
      <div style={{ position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{
            width:44, height:44, borderRadius:12,
            background:"linear-gradient(135deg, #fbbf24, #f97316)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22, boxShadow:"0 0 32px rgba(251,191,36,0.35)"
          }}>📅</div>
          <div style={{ fontSize:22, fontWeight:900, letterSpacing:"-0.5px" }}>
            <span style={{ color:"white" }}>agenda</span>
            <span style={{ color:"#fbbf24" }}>mx</span>
          </div>
        </div>
      </div>

      {/* Hero copy */}
      <div style={{ position:"relative", zIndex:1 }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:"0.3em",
          textTransform:"uppercase", color:"rgba(251,191,36,0.5)", marginBottom:16 }}>
          Para negocios mexicanos
        </p>
        <h1 style={{ fontSize:44, fontWeight:900, lineHeight:1.08, letterSpacing:"-1px",
          color:"white", marginBottom:16 }}>
          Tu negocio,<br />
          <span style={{ background:"linear-gradient(90deg, #fbbf24, #f97316)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            siempre al día.
          </span>
        </h1>
        <p style={{ fontSize:15, color:"rgba(255,255,255,0.35)", lineHeight:1.7, maxWidth:340 }}>
          Citas por WhatsApp, recordatorios automáticos y cobro adelantado — todo en un lugar.
        </p>

        {/* Stats */}
        <div style={{ marginTop:40, display:"flex", flexDirection:"column", gap:16 }}>
          {[
            { value:"2 min", label:"para configurar tu negocio" },
            { value:"100%", label:"gratis para empezar" },
            { value:"WhatsApp", label:"nativo desde el día 1" },
          ].map((stat, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ width:2, height:32, background:"linear-gradient(to bottom, #fbbf24, transparent)", borderRadius:2 }} />
              <div>
                <span style={{ color:"#fbbf24", fontWeight:900, fontSize:17 }}>{stat.value}</span>
                <span style={{ color:"rgba(255,255,255,0.35)", fontSize:13, marginLeft:8 }}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ position:"relative", zIndex:1 }}>
        <p style={{ fontSize:11, color:"rgba(255,255,255,0.15)" }}>
          © 2025 AgendaMX · PopServices · Querétaro, México
        </p>
      </div>
    </div>
  );
}

// ─── Login Form ───────────────────────────────────────────────────────────────
function LoginForm({ onSwitch, auth }) {
  const [form, setForm] = useState({ email:"", password:"" });
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await auth.login(form.email, form.password);
    if (data) window.location.href = "/dashboard";
  };

  return (
    <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:20 }}>
      <Input label="Correo electrónico" type="email" value={form.email}
        onChange={set("email")} placeholder="tu@negocio.com" icon="✉️" autoComplete="email" />
      <Input label="Contraseña" type="password" value={form.password}
        onChange={set("password")} placeholder="••••••••" icon="🔒" autoComplete="current-password" />

      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button type="button" style={{ fontSize:12, color:"rgba(251,191,36,0.5)", background:"none",
          border:"none", cursor:"pointer", transition:"color 0.2s" }}
          onMouseEnter={e => e.target.style.color="#fbbf24"}
          onMouseLeave={e => e.target.style.color="rgba(251,191,36,0.5)"}>
          ¿Olvidaste tu contraseña?
        </button>
      </div>

      {auth.error && (
        <div style={{ borderRadius:12, border:"1px solid rgba(239,68,68,0.2)",
          background:"rgba(239,68,68,0.08)", padding:"12px 16px", fontSize:13, color:"#f87171" }}>
          ⚠️ {auth.error}
        </div>
      )}

      <button type="submit" disabled={auth.loading} style={{
        width:"100%", padding:"16px", borderRadius:12, border:"none", cursor:"pointer",
        background:"linear-gradient(90deg, #f59e0b, #f97316)", color:"#1a0a00",
        fontWeight:800, fontSize:14, letterSpacing:"0.03em",
        boxShadow:"0 4px 32px rgba(251,191,36,0.3)",
        transition:"all 0.2s", opacity: auth.loading ? 0.5 : 1,
      }}
        onMouseEnter={e => { if(!auth.loading) { e.target.style.boxShadow="0 4px 48px rgba(251,191,36,0.5)"; e.target.style.transform="translateY(-1px)"; }}}
        onMouseLeave={e => { e.target.style.boxShadow="0 4px 32px rgba(251,191,36,0.3)"; e.target.style.transform="translateY(0)"; }}>
        {auth.loading ? "Entrando..." : "Entrar al panel →"}
      </button>

      <p style={{ textAlign:"center", fontSize:13, color:"rgba(255,255,255,0.25)" }}>
        ¿No tienes cuenta?{" "}
        <button type="button" onClick={onSwitch} style={{
          color:"#fbbf24", fontWeight:700, background:"none", border:"none", cursor:"pointer" }}>
          Regístrate gratis
        </button>
      </p>
    </form>
  );
}

// ─── Register Form ────────────────────────────────────────────────────────────
function RegisterForm({ onSwitch, auth }) {
  const [form, setForm] = useState({ businessName:"", ownerName:"", email:"", phone:"", password:"" });
  const [step, setStep] = useState(1);
  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await auth.register(form);
    if (data) window.location.href = "/dashboard";
  };

  const btnStyle = {
    padding:"16px", borderRadius:12, border:"none", cursor:"pointer",
    background:"linear-gradient(90deg, #f59e0b, #f97316)", color:"#1a0a00",
    fontWeight:800, fontSize:14, boxShadow:"0 4px 32px rgba(251,191,36,0.3)",
    transition:"all 0.2s",
  };

  return (
    <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleSubmit}
      style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* Steps */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        {[1,2].map(s => (
          <div key={s} style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{
              width:28, height:28, borderRadius:"50%", display:"flex",
              alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800,
              background: s === step ? "linear-gradient(135deg,#fbbf24,#f97316)" : s < step ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.05)",
              color: s === step ? "#1a0a00" : s < step ? "#fbbf24" : "rgba(255,255,255,0.25)",
              boxShadow: s === step ? "0 0 16px rgba(251,191,36,0.4)" : "none",
              transition:"all 0.3s"
            }}>{s < step ? "✓" : s}</div>
            <span style={{ fontSize:12, color: s === step ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.2)" }}>
              {s === 1 ? "Tu negocio" : "Tu cuenta"}
            </span>
            {s < 2 && <div style={{ width:32, height:1, background: step > 1 ? "rgba(251,191,36,0.3)" : "rgba(255,255,255,0.08)" }} />}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <>
          <Input label="Nombre del negocio" value={form.businessName} onChange={set("businessName")} placeholder="Ej: Barbería Don Carlos" icon="🏪" />
          <Input label="Tu nombre" value={form.ownerName} onChange={set("ownerName")} placeholder="Ej: Carlos Ramírez" icon="👤" />
          <Input label="WhatsApp del negocio" type="tel" value={form.phone} onChange={set("phone")} placeholder="442 123 4567" icon="📱" />
          <button type="submit" disabled={!form.businessName || !form.ownerName}
            style={{ ...btnStyle, opacity: (!form.businessName || !form.ownerName) ? 0.3 : 1 }}>
            Continuar →
          </button>
        </>
      ) : (
        <>
          <Input label="Correo electrónico" type="email" value={form.email} onChange={set("email")} placeholder="tu@negocio.com" icon="✉️" autoComplete="email" />
          <Input label="Contraseña" type="password" value={form.password} onChange={set("password")} placeholder="Mínimo 8 caracteres" icon="🔒" autoComplete="new-password" />

          {auth.error && (
            <div style={{ borderRadius:12, border:"1px solid rgba(239,68,68,0.2)",
              background:"rgba(239,68,68,0.08)", padding:"12px 16px", fontSize:13, color:"#f87171" }}>
              ⚠️ {auth.error}
            </div>
          )}

          <div style={{ display:"flex", gap:12 }}>
            <button type="button" onClick={() => { setStep(1); auth.setError(null); }} style={{
              flex:1, padding:"16px", borderRadius:12,
              border:"1px solid rgba(255,255,255,0.1)", background:"transparent",
              color:"rgba(255,255,255,0.4)", cursor:"pointer", fontWeight:600, fontSize:14,
              transition:"all 0.2s"
            }}>← Atrás</button>
            <button type="submit" disabled={auth.loading || !form.email || !form.password}
              style={{ ...btnStyle, flex:2, opacity: (auth.loading || !form.email || !form.password) ? 0.3 : 1 }}>
              {auth.loading ? "Creando cuenta..." : "Crear cuenta gratis 🎉"}
            </button>
          </div>
        </>
      )}

      <p style={{ textAlign:"center", fontSize:13, color:"rgba(255,255,255,0.25)" }}>
        ¿Ya tienes cuenta?{" "}
        <button type="button" onClick={onSwitch} style={{
          color:"#fbbf24", fontWeight:700, background:"none", border:"none", cursor:"pointer" }}>
          Inicia sesión
        </button>
      </p>
    </form>
  );
}

// ─── Main AuthPage ────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [mounted, setMounted] = useState(false);
  const auth = useAuth();

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  const switchMode = () => { auth.setError(null); setMode(m => m === "login" ? "register" : "login"); };

  return (
    <div style={{ minHeight:"100vh", background:"#0c0c0c", display:"flex", fontFamily:"system-ui, sans-serif" }}>

      {/* Left brand panel — hidden on mobile */}
      <div style={{ display: window.innerWidth > 1024 ? "block" : "none" }}>
        <BrandPanel />
      </div>

      {/* Right form panel */}
      <div style={{
        flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        padding:32, position:"relative",
        background:"radial-gradient(ellipse at 50% 0%, rgba(251,191,36,0.03) 0%, transparent 60%)"
      }}>

        {/* Mobile logo */}
        <div style={{ position:"absolute", top:24, left:24, display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8,
            background:"linear-gradient(135deg,#fbbf24,#f97316)", display:"flex",
            alignItems:"center", justifyContent:"center", fontSize:16 }}>📅</div>
          <span style={{ fontWeight:900, fontSize:17 }}>
            <span style={{ color:"white" }}>agenda</span>
            <span style={{ color:"#fbbf24" }}>mx</span>
          </span>
        </div>

        {/* Form card */}
        <div style={{
          width:"100%", maxWidth:420, position:"relative", zIndex:1,
          opacity: mounted ? 1 : 0, transform: mounted ? "translateY(0)" : "translateY(16px)",
          transition:"all 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          <div style={{ marginBottom:32 }}>
            <h2 style={{ color:"white", fontWeight:900, fontSize:26, letterSpacing:"-0.5px", margin:0 }}>
              {mode === "login" ? "Bienvenido de vuelta" : "Empieza hoy"}
            </h2>
            <p style={{ color:"rgba(255,255,255,0.3)", fontSize:14, marginTop:6 }}>
              {mode === "login"
                ? "Entra a tu panel de administración"
                : "Crea tu cuenta gratis, sin tarjeta de crédito"}
            </p>
          </div>

          {/* Divider */}
          <div style={{ height:1, marginBottom:32,
            background:"linear-gradient(90deg, transparent, rgba(251,191,36,0.2), transparent)" }} />

          {mode === "login"
            ? <LoginForm onSwitch={switchMode} auth={auth} />
            : <RegisterForm onSwitch={switchMode} auth={auth} />}
        </div>

        {/* Footer */}
        <p style={{ position:"absolute", bottom:24, fontSize:11, color:"rgba(255,255,255,0.12)" }}>
          🔒 Datos seguros · Cancelación en cualquier momento
        </p>
      </div>
    </div>
  );
}
