const router = require('express').Router()
const auth = require('../middleware/auth')
const licencia = require('../middleware/licencia')
const ctrl = require('../controllers/postsController')

router.use(auth, licencia)
router.get('/', ctrl.getAll)
router.post('/', ctrl.create)
router.delete('/:id', ctrl.remove)
router.put('/:id/like', ctrl.toggleLike)

module.exports = router
