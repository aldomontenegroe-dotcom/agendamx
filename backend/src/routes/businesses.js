const router = require('express').Router()
const ctrl = require('../controllers/businessesController')
const { auth, ownerOnly } = require('../middleware/auth')

// Public
router.get('/public/:slug', ctrl.getPublic)

// Protected
router.get('/me', auth, ctrl.getMe)
router.put('/me', auth, ownerOnly, ctrl.updateMe)

module.exports = router
