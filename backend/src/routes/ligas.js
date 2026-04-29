const router = require('express').Router()
const auth = require('../middleware/auth')
const licencia = require('../middleware/licencia')
const roles = require('../middleware/roles')
const ctrl = require('../controllers/ligasController')

router.use(auth, licencia)
router.get('/', ctrl.getAll)
router.post('/', roles('admin_liga', 'superadmin'), ctrl.create)
router.get('/:id', ctrl.getOne)
router.put('/:id', roles('admin_liga', 'superadmin'), ctrl.update)
router.delete('/:id', roles('admin_liga', 'superadmin'), ctrl.remove)

module.exports = router
