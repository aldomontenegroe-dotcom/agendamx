-- ================================================================
-- AgendaMX - Schema Principal
-- ================================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── TENANTS (Negocios) ──────────────────────────────────────────
CREATE TABLE businesses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          VARCHAR(100) UNIQUE NOT NULL,  -- agendamx.com/barberia-don-carlos
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  phone         VARCHAR(20),
  whatsapp      VARCHAR(20),
  email         VARCHAR(200),
  address       TEXT,
  city          VARCHAR(100),
  state         VARCHAR(100),
  timezone      VARCHAR(50) DEFAULT 'America/Mexico_City',
  logo_url      TEXT,
  cover_url     TEXT,
  plan          VARCHAR(20) DEFAULT 'free',  -- free | starter | pro | business
  plan_expires_at TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT true,
  template_id       VARCHAR(50),
  seo_category      VARCHAR(200),
  welcome_message   TEXT,
  accent_color      VARCHAR(7) DEFAULT '#FF5C3A',
  settings      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── USUARIOS (Dueños y staff) ───────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name          VARCHAR(200) NOT NULL,
  email         VARCHAR(200) UNIQUE NOT NULL,
  phone         VARCHAR(20),
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) DEFAULT 'owner',  -- owner | staff | admin
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SERVICIOS ───────────────────────────────────────────────────
CREATE TABLE services (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  duration_min  INTEGER NOT NULL DEFAULT 60,  -- duración en minutos
  price         DECIMAL(10,2),
  currency      VARCHAR(3) DEFAULT 'MXN',
  color         VARCHAR(7) DEFAULT '#3B82F6',  -- para el calendario
  icon          VARCHAR(10),
  is_popular    BOOLEAN DEFAULT false,
  is_active     BOOLEAN DEFAULT true,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── HORARIOS DE NEGOCIO ─────────────────────────────────────────
CREATE TABLE business_hours (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID REFERENCES businesses(id) ON DELETE CASCADE,
  day_of_week   INTEGER NOT NULL,  -- 0=Domingo, 1=Lunes, ... 6=Sábado
  opens_at      TIME,
  closes_at     TIME,
  is_open       BOOLEAN DEFAULT true
);

-- ─── CLIENTES ────────────────────────────────────────────────────
CREATE TABLE clients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name          VARCHAR(200) NOT NULL,
  phone         VARCHAR(20),
  email         VARCHAR(200),
  notes         TEXT,
  total_visits  INTEGER DEFAULT 0,
  last_visit_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CITAS ───────────────────────────────────────────────────────
CREATE TABLE appointments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID REFERENCES businesses(id) ON DELETE CASCADE,
  service_id    UUID REFERENCES services(id),
  client_id     UUID REFERENCES clients(id),
  staff_id      UUID REFERENCES users(id),
  
  starts_at     TIMESTAMPTZ NOT NULL,
  ends_at       TIMESTAMPTZ NOT NULL,
  
  status        VARCHAR(20) DEFAULT 'pending',
  -- pending | confirmed | completed | cancelled | no_show
  
  price         DECIMAL(10,2),
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  -- unpaid | paid | refunded
  
  client_name   VARCHAR(200),   -- copia para referencia rápida
  client_phone  VARCHAR(20),
  client_notes  TEXT,
  staff_notes   TEXT,
  
  reminder_24h_sent BOOLEAN DEFAULT false,
  reminder_1h_sent  BOOLEAN DEFAULT false,
  followup_sent     BOOLEAN DEFAULT false,
  
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── BLOQUEOS DE HORARIO ─────────────────────────────────────────
CREATE TABLE blocked_times (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id   UUID REFERENCES businesses(id) ON DELETE CASCADE,
  staff_id      UUID REFERENCES users(id),
  starts_at     TIMESTAMPTZ NOT NULL,
  ends_at       TIMESTAMPTZ NOT NULL,
  reason        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ÍNDICES ─────────────────────────────────────────────────────
CREATE INDEX idx_appointments_business_date ON appointments(business_id, starts_at);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_status ON appointments(business_id, status);
CREATE INDEX idx_services_business ON services(business_id, is_active);
CREATE INDEX idx_clients_business ON clients(business_id);
CREATE INDEX idx_businesses_slug ON businesses(slug);
