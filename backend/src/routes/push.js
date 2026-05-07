const router = require('express').Router()
const auth = require('../middleware/auth')
const ctrl = require('../controllers/pushController')

router.get('/vapid-public-key', ctrl.vapidPublicKey)
router.post('/subscribe', auth, ctrl.subscribe)
router.delete('/unsubscribe', auth, ctrl.unsubscribe)

module.exports = router
