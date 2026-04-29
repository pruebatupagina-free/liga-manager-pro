const router = require('express').Router()
const auth = require('../middleware/auth')
const licencia = require('../middleware/licencia')
const roles = require('../middleware/roles')
const ctrl = require('../controllers/cobrosController')

router.use(auth, licencia, roles('admin_liga', 'superadmin'))
router.get('/', ctrl.getEstado)
router.get('/export/pdf', ctrl.exportPDF)
router.get('/export/excel', ctrl.exportExcel)
router.put('/arbitraje/:partido_id', ctrl.marcarArbitraje)
router.put('/:equipo_id', ctrl.actualizarPago)

module.exports = router
