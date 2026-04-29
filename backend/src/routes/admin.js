const router = require('express').Router()
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const ctrl = require('../controllers/adminController')

router.use(auth, roles('superadmin'))
router.get('/usuarios', ctrl.listarUsuarios)
router.get('/usuarios/:id', ctrl.getUsuario)
router.put('/usuarios/:id/licencia', ctrl.editarLicencia)
router.put('/usuarios/:id/rol', ctrl.editarRol)
router.delete('/usuarios/:id', ctrl.eliminarUsuario)
router.get('/ligas', ctrl.listarLigas)

module.exports = router
