const router = require('express').Router()
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const ctrl = require('../controllers/arbitroController')

// Authenticated route for logged-in arbitros — must come before /:token
router.get('/mis-partidos', auth, roles('arbitro'), ctrl.getMisPartidos)

// Public token-based routes (existing)
router.get('/:token', ctrl.getPartido)
router.put('/:token/resultado', ctrl.guardarResultado)

module.exports = router
