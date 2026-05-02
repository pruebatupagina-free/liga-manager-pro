const bcrypt = require('bcryptjs')
const { Usuario, Liga } = require('../models')

// Helper: get liga IDs the caller manages
async function getLigasDelAdmin(userId) {
  const ligas = await Liga.find({ admin_id: userId }).select('_id').lean()
  return ligas.map(l => l._id.toString())
}

// GET /api/vendedores?liga_id=xxx
exports.listar = async (req, res, next) => {
  try {
    const { liga_id } = req.query
    let ligaIds

    if (req.user.rol === 'superadmin') {
      ligaIds = liga_id ? [liga_id] : null
    } else {
      // admin_liga: only their ligas
      const propias = await getLigasDelAdmin(req.user.id)
      ligaIds = liga_id && propias.includes(liga_id) ? [liga_id] : propias
    }

    const query = { rol: 'vendedor' }
    if (ligaIds) query.ligas_asignadas = { $in: ligaIds }

    const vendedores = await Usuario.find(query)
      .select('-password')
      .populate('ligas_asignadas', 'nombre slug')
      .sort('-createdAt')
      .lean()

    res.json({ vendedores })
  } catch (err) { next(err) }
}

// POST /api/vendedores
exports.crear = async (req, res, next) => {
  try {
    const { nombre, email, password, negocio, ligas_asignadas } = req.body
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'nombre, email y password requeridos' })
    }

    const existe = await Usuario.findOne({ email: email.toLowerCase() })
    if (existe) return res.status(409).json({ error: 'Email ya en uso' })

    let ligasFinal = []

    if (req.user.rol === 'superadmin') {
      ligasFinal = ligas_asignadas || []
    } else {
      // admin_liga: can only assign their own ligas
      const propias = await getLigasDelAdmin(req.user.id)
      if (ligas_asignadas?.length) {
        ligasFinal = ligas_asignadas.filter(id => propias.includes(id.toString()))
      } else {
        ligasFinal = propias
      }
    }

    const hash = await bcrypt.hash(password, 10)
    const vendedor = await Usuario.create({
      nombre,
      email: email.toLowerCase(),
      password: hash,
      rol: 'vendedor',
      negocio: negocio || {},
      ligas_asignadas: ligasFinal,
    })

    const populated = await Usuario.findById(vendedor._id)
      .select('-password')
      .populate('ligas_asignadas', 'nombre slug')
      .lean()

    res.status(201).json(populated)
  } catch (err) { next(err) }
}

// PUT /api/vendedores/:id
exports.editar = async (req, res, next) => {
  try {
    const vendedor = await Usuario.findOne({ _id: req.params.id, rol: 'vendedor' })
    if (!vendedor) return res.status(404).json({ error: 'Vendedor no encontrado' })

    // admin_liga can only edit vendors assigned to their ligas
    if (req.user.rol !== 'superadmin') {
      const propias = await getLigasDelAdmin(req.user.id)
      const vendorLigas = vendedor.ligas_asignadas.map(l => l.toString())
      const hasAccess = vendorLigas.some(id => propias.includes(id))
      if (!hasAccess) return res.status(403).json({ error: 'Sin acceso a este vendedor' })
    }

    const { nombre, email, password, negocio } = req.body
    if (nombre) vendedor.nombre = nombre
    if (email && email !== vendedor.email) {
      const existe = await Usuario.findOne({ email: email.toLowerCase(), _id: { $ne: vendedor._id } })
      if (existe) return res.status(409).json({ error: 'Email ya en uso' })
      vendedor.email = email.toLowerCase()
    }
    if (password) vendedor.password = await bcrypt.hash(password, 10)
    if (negocio) vendedor.negocio = { ...vendedor.negocio?.toObject?.() || vendedor.negocio, ...negocio }

    await vendedor.save()

    const populated = await Usuario.findById(vendedor._id)
      .select('-password')
      .populate('ligas_asignadas', 'nombre slug')
      .lean()

    res.json(populated)
  } catch (err) { next(err) }
}

// PUT /api/vendedores/:id/ligas  (superadmin only - full control)
exports.asignarLigas = async (req, res, next) => {
  try {
    const { ligas_asignadas } = req.body
    if (!Array.isArray(ligas_asignadas)) {
      return res.status(400).json({ error: 'ligas_asignadas debe ser un array' })
    }

    // admin_liga can only add/remove from their own ligas
    let finalLigas = ligas_asignadas
    if (req.user.rol !== 'superadmin') {
      const propias = await getLigasDelAdmin(req.user.id)
      const vendedor = await Usuario.findOne({ _id: req.params.id, rol: 'vendedor' }).lean()
      if (!vendedor) return res.status(404).json({ error: 'Vendedor no encontrado' })

      // Keep ligas from other admins untouched, only toggle their own
      const otrasLigas = vendedor.ligas_asignadas
        .map(l => l.toString())
        .filter(id => !propias.includes(id))
      const susLigasNuevas = ligas_asignadas.filter(id => propias.includes(id.toString()))
      finalLigas = [...otrasLigas, ...susLigasNuevas]
    }

    const vendedor = await Usuario.findOneAndUpdate(
      { _id: req.params.id, rol: 'vendedor' },
      { ligas_asignadas: finalLigas },
      { new: true, select: '-password' }
    ).populate('ligas_asignadas', 'nombre slug').lean()

    if (!vendedor) return res.status(404).json({ error: 'Vendedor no encontrado' })
    res.json(vendedor)
  } catch (err) { next(err) }
}

// DELETE /api/vendedores/:id  (superadmin only)
exports.eliminar = async (req, res, next) => {
  try {
    const vendedor = await Usuario.findOne({ _id: req.params.id, rol: 'vendedor' })
    if (!vendedor) return res.status(404).json({ error: 'Vendedor no encontrado' })
    await vendedor.deleteOne()
    res.json({ mensaje: 'Vendedor eliminado' })
  } catch (err) { next(err) }
}
