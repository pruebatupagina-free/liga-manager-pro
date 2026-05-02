const router = require('express').Router()
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const ctrl = require('../controllers/mensajesController')

router.use(auth, roles('dueno_equipo', 'vendedor'))

router.get('/conversaciones', ctrl.conversaciones)
router.get('/:conversacion_id', ctrl.getMensajes)
router.post('/', ctrl.enviar)

module.exports = router
