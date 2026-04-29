const router = require('express').Router()
const auth = require('../middleware/auth')
const licencia = require('../middleware/licencia')
const ctrl = require('../controllers/equiposController')

router.use(auth, licencia)
router.get('/', ctrl.getAll)
router.post('/', ctrl.create)
router.get('/:id', ctrl.getOne)
router.put('/:id', ctrl.update)
router.delete('/:id', ctrl.remove)

module.exports = router
