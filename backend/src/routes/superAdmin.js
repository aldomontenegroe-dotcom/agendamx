const router = require('express').Router()
const ctrl = require('../controllers/superAdminController')
const { auth } = require('../middleware/auth')
const { superAdminOnly } = require('../middleware/superAdmin')

router.use(auth, superAdminOnly)

router.get('/stats', ctrl.getStats)
router.get('/businesses', ctrl.listBusinesses)
router.patch('/businesses/:id/plan', ctrl.updateBusinessPlan)
router.patch('/businesses/:id/active', ctrl.toggleBusinessActive)

module.exports = router
