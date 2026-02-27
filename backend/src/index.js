require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const rateLimit  = require('express-rate-limit')

// ─── Validaciones de arranque ────────────────────────────────────
if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL no configurada')
  process.exit(1)
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'cambia_esto_por_un_secret_muy_largo') {
  console.error('FATAL: JWT_SECRET no configurada o usa valor por defecto')
  process.exit(1)
}

const app  = express()
const PORT = process.env.PORT || 4000

// ─── Middleware ────────────────────────────────────────────────────
app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || '*' }))
// Stripe webhook needs raw body — must be before express.json()
app.use('/api/subscription/webhook', express.raw({ type: 'application/json' }))

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))

// ─── Rutas ────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', app: 'AgendaMX API', v: '0.1.0' }))
app.use('/api/auth',         require('./routes/auth'))
app.use('/api/services',     require('./routes/services'))
app.use('/api/appointments', require('./routes/appointments'))
app.use('/api/whatsapp',     require('./routes/whatsapp'))
app.use('/api/templates',    require('./routes/templates'))
app.use('/api/businesses',     require('./routes/businesses'))
app.use('/api/business-hours', require('./routes/businessHours'))
app.use('/api/clients',        require('./routes/clients'))
app.use('/api/stats',          require('./routes/stats'))
app.use('/api/staff',          require('./routes/staff'))
app.use('/api/subscription', require('./routes/subscription'))

// ─── Error handlers ───────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Error interno del servidor' })
})

app.listen(PORT, () => console.log(`🚀 AgendaMX API en puerto ${PORT}`))
