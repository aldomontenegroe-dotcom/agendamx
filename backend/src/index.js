require('dotenv').config()
const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const rateLimit  = require('express-rate-limit')

const app  = express()
const PORT = process.env.PORT || 4000

// ─── Middleware ────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGINS?.split(',') || '*' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))

// ─── Rutas ────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', app: 'AgendaMX API', v: '0.1.0' }))
app.use('/api/auth',         require('./routes/auth'))
app.use('/api/services',     require('./routes/services'))
app.use('/api/appointments', require('./routes/appointments'))
app.use('/api/whatsapp',     require('./routes/whatsapp'))
app.use('/api/templates',    require('./routes/templates'))

// ─── Error handlers ───────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Error interno del servidor' })
})

app.listen(PORT, () => console.log(`🚀 AgendaMX API en puerto ${PORT}`))
