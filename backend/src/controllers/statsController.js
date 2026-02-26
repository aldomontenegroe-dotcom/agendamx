const db = require('../config/db')

// GET /api/stats/dashboard (auth required)
// Returns today's KPIs for the dashboard
exports.dashboard = async (req, res) => {
  const { businessId } = req.user
  const today = new Date().toISOString().split('T')[0]
  try {
    // Today's appointments
    const appts = await db.query(
      `SELECT status, price FROM appointments
       WHERE business_id = $1
       AND DATE(starts_at AT TIME ZONE COALESCE((SELECT timezone FROM businesses WHERE id = $1), 'America/Mexico_City')) = $2`,
      [businessId, today]
    )
    const rows = appts.rows
    const totalAppointments = rows.length
    const totalRevenue = rows.filter(r => r.status !== 'cancelled').reduce((s, r) => s + Number(r.price || 0), 0)
    const pendingCount = rows.filter(r => r.status === 'pending').length
    const confirmedCount = rows.filter(r => r.status === 'confirmed').length

    // New clients this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const newClients = await db.query(
      'SELECT COUNT(*) FROM clients WHERE business_id = $1 AND created_at >= $2',
      [businessId, weekAgo.toISOString()]
    )

    res.json({
      todayAppointments: totalAppointments,
      todayRevenue: totalRevenue,
      pendingCount,
      confirmedCount,
      newClientsThisWeek: parseInt(newClients.rows[0].count),
    })
  } catch (err) {
    console.error('dashboard stats error:', err)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
}

// GET /api/stats/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD (auth required)
exports.revenue = async (req, res) => {
  const { businessId } = req.user
  const { from, to } = req.query
  if (!from || !to) {
    return res.status(400).json({ error: 'Parámetros from y to requeridos' })
  }
  try {
    const tz = `COALESCE((SELECT timezone FROM businesses WHERE id = $1), 'America/Mexico_City')`

    // Total revenue & counts
    const totals = await db.query(
      `SELECT
         COUNT(*) as total_appointments,
         COUNT(*) FILTER (WHERE status = 'completed') as completed,
         COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
         COALESCE(SUM(price) FILTER (WHERE status NOT IN ('cancelled')), 0) as total_revenue
       FROM appointments
       WHERE business_id = $1
         AND DATE(starts_at AT TIME ZONE ${tz}) >= $2
         AND DATE(starts_at AT TIME ZONE ${tz}) <= $3`,
      [businessId, from, to]
    )

    // Daily revenue
    const daily = await db.query(
      `SELECT
         DATE(starts_at AT TIME ZONE ${tz}) as date,
         COUNT(*) as count,
         COALESCE(SUM(price) FILTER (WHERE status NOT IN ('cancelled')), 0) as revenue
       FROM appointments
       WHERE business_id = $1
         AND DATE(starts_at AT TIME ZONE ${tz}) >= $2
         AND DATE(starts_at AT TIME ZONE ${tz}) <= $3
       GROUP BY DATE(starts_at AT TIME ZONE ${tz})
       ORDER BY date`,
      [businessId, from, to]
    )

    // Top services
    const topServices = await db.query(
      `SELECT s.name, COUNT(*) as count,
              COALESCE(SUM(a.price) FILTER (WHERE a.status NOT IN ('cancelled')), 0) as revenue
       FROM appointments a
       JOIN services s ON s.id = a.service_id
       WHERE a.business_id = $1
         AND DATE(a.starts_at AT TIME ZONE ${tz}) >= $2
         AND DATE(a.starts_at AT TIME ZONE ${tz}) <= $3
       GROUP BY s.name
       ORDER BY count DESC
       LIMIT 5`,
      [businessId, from, to]
    )

    // New clients in period
    const newClients = await db.query(
      'SELECT COUNT(*) FROM clients WHERE business_id = $1 AND created_at >= $2 AND created_at <= ($3::date + interval \'1 day\')',
      [businessId, from, to]
    )

    const t = totals.rows[0]
    res.json({
      totalRevenue: Number(t.total_revenue),
      totalAppointments: Number(t.total_appointments),
      completedAppointments: Number(t.completed),
      cancelledAppointments: Number(t.cancelled),
      newClients: parseInt(newClients.rows[0].count),
      topServices: topServices.rows.map(r => ({ name: r.name, count: Number(r.count), revenue: Number(r.revenue) })),
      dailyRevenue: daily.rows.map(r => ({ date: r.date, count: Number(r.count), revenue: Number(r.revenue) })),
    })
  } catch (err) {
    console.error('revenue stats error:', err)
    res.status(500).json({ error: 'Error al obtener estadísticas de ingresos' })
  }
}
