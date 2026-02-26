const router = require('express').Router()
const ctrl = require('../controllers/statsController')
const { auth } = require('../middleware/auth')

router.get('/dashboard', auth, ctrl.dashboard)
router.get('/revenue', auth, ctrl.revenue)

module.exports = router
