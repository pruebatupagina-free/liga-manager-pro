const router = require('express').Router()
const auth = require('../middleware/auth')
const licencia = require('../middleware/licencia')
const roles = require('../middleware/roles')
const ctrl = require('../controllers/inscripcionesController')

// Públicas (sin auth)
router.get('/:token', ctrl.getForm)
router.post('/:token', ctrl.submit)

// Privadas (admin)
router.get('/', auth, licencia, ctrl.list)
router.put('/:id/aprobar', auth, licencia, roles('admin_liga', 'superadmin'), ctrl.aprobar)
router.put('/:id/rechazar', auth, licencia, roles('admin_liga', 'superadmin'), ctrl.rechazar)

module.exports = router
