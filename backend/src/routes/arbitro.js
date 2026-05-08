const router = require('express').Router()
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const ctrl = require('../controllers/arbitroController')

// Authenticated route for logged-in arbitros — must come before /:token
router.get('/mis-partidos', auth, roles('arbitro'), ctrl.getMisPartidos)

// Public live polling (no auth — token is the access control)
router.get('/:token/live', ctrl.getLive)

// Token-based routes
router.get('/:token', ctrl.getPartido)
router.put('/:token/resultado', ctrl.guardarResultado)
router.put('/:token/iniciar', ctrl.iniciarPartido)
router.post('/:token/gol', ctrl.addGol)
router.delete('/:token/gol/:golId', ctrl.removeGol)
router.post('/:token/tarjeta', ctrl.addTarjeta)
router.delete('/:token/tarjeta/:tarjetaId', ctrl.removeTarjeta)
router.put('/:token/finalizar', ctrl.finalizarPartido)

module.exports = router
