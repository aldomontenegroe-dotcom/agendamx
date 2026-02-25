const router = require('express').Router()
const ctrl   = require('../controllers/servicesController')
const { auth, ownerOnly } = require('../middleware/auth')

router.get('/',                   auth, ctrl.list)
router.post('/',                  auth, ownerOnly, ctrl.create)
router.put('/:id',                auth, ownerOnly, ctrl.update)
router.delete('/:id',             auth, ownerOnly, ctrl.remove)
router.get('/public/:slug',       ctrl.listPublic)

module.exports = router
