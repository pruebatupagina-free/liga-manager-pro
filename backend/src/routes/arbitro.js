const router = require('express').Router()
const ctrl = require('../controllers/arbitroController')

router.get('/:token', ctrl.getPartido)
router.put('/:token/resultado', ctrl.guardarResultado)

module.exports = router
