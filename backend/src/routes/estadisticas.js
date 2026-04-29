const router = require('express').Router()
const auth = require('../middleware/auth')
const licencia = require('../middleware/licencia')
const ctrl = require('../controllers/estadisticasController')

router.use(auth, licencia)
router.get('/tabla', ctrl.tabla)
router.get('/goleadores', ctrl.goleadores)
router.get('/rendimiento', ctrl.rendimiento)
router.get('/comparativa', ctrl.comparativa)
router.get('/mvp', ctrl.mvp)
router.get('/export/pdf', ctrl.exportPDF)
router.get('/export/excel', ctrl.exportExcel)

module.exports = router
