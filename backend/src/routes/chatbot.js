const router = require('express').Router()
const auth = require('../middleware/auth')
const licencia = require('../middleware/licencia')
const ctrl = require('../controllers/chatbotController')

router.use(auth, licencia)
router.post('/mensaje', ctrl.mensaje)

module.exports = router
