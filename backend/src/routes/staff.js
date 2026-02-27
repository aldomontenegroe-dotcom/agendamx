const router = require('express').Router()
const ctrl = require('../controllers/staffController')
const { auth, ownerOnly } = require('../middleware/auth')

// Public route first (no auth)
router.get('/public/:slug', ctrl.listPublic)

// Protected routes
router.get('/',       auth, ctrl.list)
router.post('/',      auth, ownerOnly, ctrl.create)
router.put('/:id',    auth, ownerOnly, ctrl.update)
router.delete('/:id', auth, ownerOnly, ctrl.remove)

module.exports = router
