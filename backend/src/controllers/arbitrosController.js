const bcrypt = require('bcryptjs')
const { Usuario, Liga } = require('../models')

async function getLigasDelAdmin(userId) {
  const ligas = await Liga.find({ admin_id: userId }).select('_id').lean()
  return ligas.map(l => l._id.toString())
}

// GET /api/arbitros?liga_id=xxx
exports.listar = async (req, res, next) => {
  try {
    const { liga_id } = req.query
    let ligaIds

    if (req.user.rol === 'superadmin') {
      ligaIds = liga_id ? [liga_id] : null
    } else {
      const propias = await getLigasDelAdmin(req.user.id)
      ligaIds = liga_id && propias.includes(liga_id) ? [liga_id] : propias
    }

    const query = { rol: 'arbitro' }
    if (ligaIds) query.ligas_asignadas = { $in: ligaIds }

    const arbitros = await Usuario.find(query)
      .select('-password')
      .populate('ligas_asignadas', 'nombre slug')
      .sort('nombre')
      .lean()

    res.json({ arbitros })
  } catch (err) { next(err) }
}

// POST /api/arbitros
exports.crear = async (req, res, next) => {
  try {
    const { nombre, email, password, telefono, ligas_asignadas } = req.body
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'nombre, email y password requeridos' })
    }

    const existe = await Usuario.findOne({ email: email.toLowerCase() })
    if (existe) return res.status(409).json({ error: 'Email ya en uso' })

    let ligasFinal = []
    if (req.user.rol === 'superadmin') {
      ligasFinal = ligas_asignadas || []
    } else {
      const propias = await getLigasDelAdmin(req.user.id)
      ligasFinal = ligas_asignadas?.length
        ? ligas_asignadas.filter(id => propias.includes(id.toString()))
        : propias
    }

    const hash = await bcrypt.hash(password, 10)
    const arbitro = await Usuario.create({
      nombre,
      email: email.toLowerCase(),
      password: hash,
      rol: 'arbitro',
      telefono: telefono || null,
      ligas_asignadas: ligasFinal,
    })

    const populated = await Usuario.findById(arbitro._id)
      .select('-password')
      .populate('ligas_asignadas', 'nombre slug')
      .lean()

    res.status(201).json(populated)
  } catch (err) { next(err) }
}

// PUT /api/arbitros/:id
exports.editar = async (req, res, next) => {
  try {
    const arbitro = await Usuario.findOne({ _id: req.params.id, rol: 'arbitro' })
    if (!arbitro) return res.status(404).json({ error: 'Árbitro no encontrado' })

    if (req.user.rol !== 'superadmin') {
      const propias = await getLigasDelAdmin(req.user.id)
      const arbitroLigas = arbitro.ligas_asignadas.map(l => l.toString())
      if (!arbitroLigas.some(id => propias.includes(id))) {
        return res.status(403).json({ error: 'Sin acceso a este árbitro' })
      }
    }

    const { nombre, email, password, telefono } = req.body
    if (nombre) arbitro.nombre = nombre
    if (email && email !== arbitro.email) {
      const existe = await Usuario.findOne({ email: email.toLowerCase(), _id: { $ne: arbitro._id } })
      if (existe) return res.status(409).json({ error: 'Email ya en uso' })
      arbitro.email = email.toLowerCase()
    }
    if (password) arbitro.password = await bcrypt.hash(password, 10)
    if (telefono !== undefined) arbitro.telefono = telefono

    await arbitro.save()

    const populated = await Usuario.findById(arbitro._id)
      .select('-password')
      .populate('ligas_asignadas', 'nombre slug')
      .lean()

    res.json(populated)
  } catch (err) { next(err) }
}

// DELETE /api/arbitros/:id  (superadmin only)
exports.eliminar = async (req, res, next) => {
  try {
    const arbitro = await Usuario.findOne({ _id: req.params.id, rol: 'arbitro' })
    if (!arbitro) return res.status(404).json({ error: 'Árbitro no encontrado' })
    await arbitro.deleteOne()
    res.json({ mensaje: 'Árbitro eliminado' })
  } catch (err) { next(err) }
}
