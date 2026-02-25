const router = require('express').Router()
const ctrl   = require('../controllers/templatesController')
const { auth } = require('../middleware/auth')

router.get('/',       ctrl.list)          // Público — para el picker
router.post('/apply', auth, ctrl.apply)   // Privado — aplica al negocio

module.exports = router
