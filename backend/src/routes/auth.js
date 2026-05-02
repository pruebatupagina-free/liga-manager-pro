const router = require('express').Router()
const auth = require('../middleware/auth')
const ctrl = require('../controllers/authController')

router.post('/login', ctrl.login)
router.post('/register', auth, ctrl.register)
router.post('/ping', auth, ctrl.ping)
router.get('/me', auth, ctrl.me)
router.post('/forgot-password', ctrl.forgotPassword)
router.post('/reset-password/:token', ctrl.resetPassword)

module.exports = router
