const router = require('express').Router()
const auth = require('../middleware/auth')
const licencia = require('../middleware/licencia')
const roles = require('../middleware/roles')
const ctrl = require('../controllers/partidosController')
const arbitroCtrl = require('../controllers/arbitroController')

router.use(auth, licencia)
router.get('/', ctrl.getAll)
router.post('/extra', roles('admin_liga', 'superadmin'), ctrl.agregarExtra)
router.put('/:id/resultado', roles('admin_liga', 'superadmin'), ctrl.guardarResultado)
router.put('/:id/estado', roles('admin_liga', 'superadmin'), ctrl.cambiarEstado)
router.post('/:id/generar-token', roles('admin_liga', 'superadmin'), arbitroCtrl.generarToken)
router.put('/:id/asignar-arbitro', roles('admin_liga', 'superadmin'), ctrl.asignarArbitro)

module.exports = router
