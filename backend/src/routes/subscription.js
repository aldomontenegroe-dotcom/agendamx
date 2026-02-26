const router = require('express').Router()
const ctrl = require('../controllers/subscriptionController')
const { auth, ownerOnly } = require('../middleware/auth')

router.get('/plans', ctrl.getPlans)
router.post('/checkout', auth, ctrl.createCheckout)
router.post('/webhook', ctrl.webhook)
router.get('/status', auth, ctrl.getStatus)
router.post('/cancel', auth, ownerOnly, ctrl.cancel)
router.post('/portal', auth, ownerOnly, ctrl.createPortal)

module.exports = router
