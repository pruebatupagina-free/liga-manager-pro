const router = require('express').Router()
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const ctrl = require('../controllers/arbitrosController')

router.use(auth, roles('superadmin', 'admin_liga'))

router.get('/', ctrl.listar)
router.post('/', ctrl.crear)
router.put('/:id', ctrl.editar)
router.delete('/:id', roles('superadmin'), ctrl.eliminar)

module.exports = router
