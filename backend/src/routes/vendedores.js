const router = require('express').Router()
const auth = require('../middleware/auth')
const licencia = require('../middleware/licencia')
const roles = require('../middleware/roles')
const ctrl = require('../controllers/vendedoresController')

router.use(auth, licencia, roles('superadmin', 'admin_liga'))

router.get('/', ctrl.listar)
router.post('/', ctrl.crear)
router.put('/:id', ctrl.editar)
router.put('/:id/ligas', ctrl.asignarLigas)
router.delete('/:id', roles('superadmin'), ctrl.eliminar)

module.exports = router
