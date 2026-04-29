const router = require('express').Router()
const auth = require('../middleware/auth')
const licencia = require('../middleware/licencia')
const roles = require('../middleware/roles')
const ctrl = require('../controllers/whatsappController')

router.use(auth, licencia, roles('admin_liga', 'superadmin'))
router.post('/enviar', ctrl.enviar)
router.post('/jornada', ctrl.jornada)
router.post('/bye', ctrl.bye)
router.post('/cobro', ctrl.cobro)

module.exports = router
