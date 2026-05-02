const router = require('express').Router()
const auth = require('../middleware/auth')
const roles = require('../middleware/roles')
const { upload, uploadToCloudinary } = require('../utils/upload')
const ctrl = require('../controllers/productosController')

// Middleware to handle image upload + Cloudinary
async function handleUpload(req, res, next) {
  try {
    if (req.file) {
      req.file.path = await uploadToCloudinary(req.file.buffer, 'productos')
    }
    next()
  } catch (err) { next(err) }
}

// Public-ish: browseable by any authenticated user
router.get('/marketplace', auth, ctrl.marketplace)

// Vendor only
router.get('/mis-productos', auth, roles('vendedor'), ctrl.misProductos)
router.post('/', auth, roles('vendedor'), upload.single('imagen'), handleUpload, ctrl.crear)
router.put('/:id', auth, roles('vendedor'), upload.single('imagen'), handleUpload, ctrl.editar)
router.delete('/:id', auth, roles('vendedor'), ctrl.eliminar)

module.exports = router
