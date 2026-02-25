const router = require('express').Router()
const ctrl   = require('../controllers/whatsappController')

// Meta llama GET para verificar el webhook
router.get('/webhook',  ctrl.verify)

// Meta llama POST con cada mensaje entrante
router.post('/webhook', ctrl.receive)

module.exports = router
