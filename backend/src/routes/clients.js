const router = require('express').Router()
const ctrl = require('../controllers/clientsController')
const { auth } = require('../middleware/auth')

router.get('/', auth, ctrl.list)
router.get('/:id', auth, ctrl.getOne)
router.get('/:id/events', auth, ctrl.getEvents)
router.put('/:id', auth, ctrl.update)

module.exports = router
