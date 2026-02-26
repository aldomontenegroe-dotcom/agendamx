const router = require('express').Router()
const ctrl = require('../controllers/businessHoursController')
const { auth, ownerOnly } = require('../middleware/auth')

router.get('/', auth, ctrl.list)
router.put('/', auth, ownerOnly, ctrl.update)

module.exports = router
