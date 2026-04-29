const router = require('express').Router()
const auth = require('../middleware/auth')
const licencia = require('../middleware/licencia')
const roles = require('../middleware/roles')
const ctrl = require('../controllers/liguillaController')

router.use(auth, licencia)
router.get('/', ctrl.getEstado)
router.post('/generar', roles('admin_liga', 'superadmin'), ctrl.generar)
router.put('/partido/:id/resultado', roles('admin_liga', 'superadmin'), ctrl.guardarResultado)

module.exports = router
