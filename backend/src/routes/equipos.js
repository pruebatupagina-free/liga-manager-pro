const router = require('express').Router()
const auth = require('../middleware/auth')
const licencia = require('../middleware/licencia')
const roles = require('../middleware/roles')
const ctrl = require('../controllers/equiposController')

router.use(auth, licencia)
router.get('/mi-equipo', ctrl.miEquipo)
router.get('/', ctrl.getAll)
router.post('/', ctrl.create)
router.get('/:id', ctrl.getOne)
router.put('/:id', ctrl.update)
router.delete('/:id', ctrl.remove)
router.post('/:id/cuenta', roles('admin_liga', 'superadmin'), ctrl.crearCuenta)

module.exports = router
