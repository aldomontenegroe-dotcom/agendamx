-- ================================================================
-- FASE 1: Pagos Online
-- ================================================================

-- Columnas de pago en appointments
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30),
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
  ADD COLUMN IF NOT EXISTS payment_intent_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Configuración de pagos en businesses
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS accept_payments BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(20) DEFAULT 'full',
  ADD COLUMN IF NOT EXISTS deposit_percentage INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS mercadopago_access_token TEXT,
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id VARCHAR(255);

-- Índice para lookups de pago
CREATE INDEX IF NOT EXISTS idx_appointments_payment ON appointments(payment_intent_id) WHERE payment_intent_id IS NOT NULL;
