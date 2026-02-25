const db        = require('../config/db')
const TEMPLATES = require('../config/templates')

// GET /api/templates — lista pública para el picker
exports.list = (req, res) => {
  const safe = TEMPLATES.map(({ id, name, emoji, tagline, accentColor, seoCategory, description, services, hours }) => ({
    id, name, emoji, tagline, accentColor, seoCategory, description,
    servicesCount: services.length,
    servicesPreview: services.slice(0, 3).map(s => s.name),
    typicalHours: hours,
  }))
  res.json({ templates: safe })
}

// POST /api/templates/apply — aplica template al negocio del usuario autenticado
exports.apply = async (req, res) => {
  const { templateId } = req.body
  const { businessId } = req.user

  const template = TEMPLATES.find(t => t.id === templateId)
  if (!template) {
    return res.status(404).json({ error: 'Template no encontrado' })
  }

  const client = await db.pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Actualizar el negocio con categoría SEO y mensaje de bienvenida
    await client.query(
      `UPDATE businesses
       SET seo_category      = $1,
           welcome_message   = $2,
           template_id       = $3,
           accent_color      = $4,
           updated_at        = NOW()
       WHERE id = $5`,
      [template.seoCategory, template.welcomeMessage, template.id, template.accentColor, businessId]
    )

    // 2. Borrar servicios anteriores (si re-aplica un template)
    await client.query(
      'DELETE FROM services WHERE business_id = $1',
      [businessId]
    )

    // 3. Insertar los servicios del template
    for (let i = 0; i < template.services.length; i++) {
      const s = template.services[i]
      await client.query(
        `INSERT INTO services
           (business_id, name, duration_min, price, icon, is_popular, sort_order, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
        [businessId, s.name, s.duration, s.price, s.icon, s.popular || false, i]
      )
    }

    // 4. Actualizar horarios del template
    await client.query(
      'DELETE FROM business_hours WHERE business_id = $1',
      [businessId]
    )
    for (const h of template.hours) {
      await client.query(
        `INSERT INTO business_hours
           (business_id, day_of_week, opens_at, closes_at, is_open)
         VALUES ($1,$2,$3,$4,$5)`,
        [businessId, h.day, h.opens, h.closes, h.isOpen]
      )
    }

    await client.query('COMMIT')

    res.json({
      message: `Template "${template.name}" aplicado correctamente`,
      template: {
        id: template.id,
        name: template.name,
        servicesCreated: template.services.length,
      },
    })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('apply template error:', err)
    res.status(500).json({ error: 'Error al aplicar el template' })
  } finally {
    client.release()
  }
}
