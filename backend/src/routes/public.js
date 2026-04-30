const router = require('express').Router()
const ctrl = require('../controllers/publicController')

// Rutas públicas — sin autenticación
router.get('/:username', ctrl.perfil)
router.get('/:username/:ligaSlug', ctrl.liga)
router.get('/:username/:ligaSlug/tabla', ctrl.tabla)
router.get('/:username/:ligaSlug/goleadores', ctrl.goleadores)
router.get('/:username/:ligaSlug/proximos', ctrl.proximos)
router.get('/:username/:ligaSlug/resultados', ctrl.resultados)
router.get('/:username/:ligaSlug/jornada/:numero', ctrl.jornadaDetalle)
router.get('/:username/:ligaSlug/tarjetas', ctrl.tarjetas)
router.get('/:username/:ligaSlug/mvps', ctrl.mvps)
router.get('/:username/:ligaSlug/sanciones', ctrl.sanciones)
router.get('/:username/:ligaSlug/equipo/:equipoSlug', ctrl.equipo)

module.exports = router
