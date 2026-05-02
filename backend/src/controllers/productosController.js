const { Producto, Usuario } = require('../models')
const upload = require('../utils/upload')

// GET /api/productos/marketplace?liga_id=xxx
// Returns all active products from vendors assigned to this liga
exports.marketplace = async (req, res, next) => {
  try {
    const { liga_id } = req.query
    if (!liga_id) return res.status(400).json({ error: 'liga_id requerido' })

    const vendedores = await Usuario.find({
      rol: 'vendedor',
      ligas_asignadas: liga_id,
    }).select('_id nombre negocio').lean()

    const vendedorIds = vendedores.map(v => v._id)
    const productos = await Producto.find({ vendedor_id: { $in: vendedorIds }, activo: true })
      .sort('-createdAt')
      .lean()

    const vendedorMap = {}
    vendedores.forEach(v => { vendedorMap[v._id] = v })

    const result = productos.map(p => ({
      ...p,
      vendedor: vendedorMap[p.vendedor_id] || null,
    }))

    res.json({ productos: result, vendedores })
  } catch (err) { next(err) }
}

// GET /api/productos/mis-productos  (vendedor propio)
exports.misProductos = async (req, res, next) => {
  try {
    const productos = await Producto.find({ vendedor_id: req.user.id })
      .sort('-createdAt')
      .lean()
    res.json({ productos })
  } catch (err) { next(err) }
}

// POST /api/productos
exports.crear = async (req, res, next) => {
  try {
    const { nombre, descripcion, precio, categoria } = req.body
    if (!nombre || precio === undefined) {
      return res.status(400).json({ error: 'nombre y precio requeridos' })
    }
    const producto = await Producto.create({
      vendedor_id: req.user.id,
      nombre,
      descripcion: descripcion || null,
      precio: Number(precio),
      categoria: categoria || null,
      imagen: req.file?.path || null,
    })
    res.status(201).json(producto)
  } catch (err) { next(err) }
}

// PUT /api/productos/:id
exports.editar = async (req, res, next) => {
  try {
    const producto = await Producto.findOne({ _id: req.params.id, vendedor_id: req.user.id })
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' })

    const { nombre, descripcion, precio, categoria, activo } = req.body
    if (nombre) producto.nombre = nombre
    if (descripcion !== undefined) producto.descripcion = descripcion
    if (precio !== undefined) producto.precio = Number(precio)
    if (categoria !== undefined) producto.categoria = categoria
    if (activo !== undefined) producto.activo = activo === true || activo === 'true'
    if (req.file?.path) producto.imagen = req.file.path

    await producto.save()
    res.json(producto)
  } catch (err) { next(err) }
}

// DELETE /api/productos/:id
exports.eliminar = async (req, res, next) => {
  try {
    const producto = await Producto.findOne({ _id: req.params.id, vendedor_id: req.user.id })
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' })
    await producto.deleteOne()
    res.json({ mensaje: 'Producto eliminado' })
  } catch (err) { next(err) }
}
