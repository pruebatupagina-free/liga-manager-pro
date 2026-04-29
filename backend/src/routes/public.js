const router = require('express').Router()
const ctrl = require('../controllers/publicController')

// Rutas públicas — sin autenticación
router.get('/:username', ctrl.perfil)
router.get('/:username/:ligaSlug', ctrl.liga)
router.get('/:username/:ligaSlug/tabla', ctrl.tabla)
router.get('/:username/:ligaSlug/goleadores', ctrl.goleadores)
router.get('/:username/:ligaSlug/equipo/:equipoSlug', ctrl.equipo)

module.exports = router
