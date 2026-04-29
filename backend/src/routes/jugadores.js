const router = require('express').Router()
const auth = require('../middleware/auth')
const licencia = require('../middleware/licencia')
const ctrl = require('../controllers/jugadoresController')

router.use(auth, licencia)
router.get('/', ctrl.getAll)
router.post('/', ctrl.create)
router.put('/:id', ctrl.update)
router.delete('/:id', ctrl.remove)

module.exports = router
