const { Usuario, Liga } = require('../models')
const bcrypt = require('bcryptjs')

// GET /api/admin/usuarios
exports.listarUsuarios = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query
    const query = search
      ? { $or: [{ email: new RegExp(search, 'i') }, { username: new RegExp(search, 'i') }] }
      : {}
    const [usuarios, total] = await Promise.all([
      Usuario.find(query)
        .select('-password_hash')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      Usuario.countDocuments(query),
    ])
    res.json({ usuarios, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
}

// GET /api/admin/usuarios/:id
exports.getUsuario = async (req, res, next) => {
  try {
    const user = await Usuario.findById(req.params.id).select('-password_hash').lean()
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
    const ligas = await Liga.find({ admin_id: req.params.id }).select('nombre slug').lean()
    res.json({ usuario: user, ligas })
  } catch (err) { next(err) }
}

// PUT /api/admin/usuarios/:id
exports.editarUsuario = async (req, res, next) => {
  try {
    const { nombre, email, username, telefono } = req.body
    const user = await Usuario.findById(req.params.id).lean()
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const update = {}
    if (email && email.toLowerCase() !== user.email) {
      const existe = await Usuario.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } })
      if (existe) return res.status(409).json({ error: 'Email ya en uso' })
      update.email = email.toLowerCase()
    }
    if (username && username.toLowerCase() !== user.username) {
      const existe = await Usuario.findOne({ username: username.toLowerCase(), _id: { $ne: user._id } })
      if (existe) return res.status(409).json({ error: 'Username ya en uso' })
      update.username = username.toLowerCase()
    }
    if (nombre) update.nombre = nombre
    if (telefono !== undefined) update.telefono = telefono

    const updated = await Usuario.findByIdAndUpdate(user._id, { $set: update }, { new: true, select: '-password -__v' }).lean()
    res.json(updated)
  } catch (err) { next(err) }
}

// PUT /api/admin/usuarios/:id/licencia
exports.editarLicencia = async (req, res, next) => {
  try {
    const { estado, fecha_vencimiento, plan } = req.body
    const update = {}
    if (estado) update['licencia.estado'] = estado
    if (fecha_vencimiento) update['licencia.fecha_vencimiento'] = new Date(fecha_vencimiento)
    if (plan) update['licencia.plan'] = plan

    const user = await Usuario.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, select: 'licencia' }).lean()
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json({ licencia: user.licencia })
  } catch (err) { next(err) }
}

// PUT /api/admin/usuarios/:id/rol
exports.editarRol = async (req, res, next) => {
  try {
    const { rol } = req.body
    if (!['admin_liga', 'dueno_equipo'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' })
    }
    const user = await Usuario.findByIdAndUpdate(
      req.params.id,
      { rol },
      { new: true, select: '-password_hash' }
    ).lean()
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json(user)
  } catch (err) { next(err) }
}

// DELETE /api/admin/usuarios/:id
exports.eliminarUsuario = async (req, res, next) => {
  try {
    const user = await Usuario.findById(req.params.id)
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
    if (user.rol === 'superadmin') return res.status(403).json({ error: 'No se puede eliminar un superadmin' })
    await user.deleteOne()
    res.json({ mensaje: 'Usuario eliminado' })
  } catch (err) { next(err) }
}

// GET /api/admin/ligas
exports.listarLigas = async (req, res, next) => {
  try {
    const ligas = await Liga.find({})
      .populate('admin_id', 'username email')
      .sort('-createdAt')
      .lean()
    res.json(ligas)
  } catch (err) { next(err) }
}

// GET /api/admin/vendedores
exports.listarVendedores = async (req, res, next) => {
  try {
    const vendedores = await Usuario.find({ rol: 'vendedor' })
      .select('-password')
      .sort('-createdAt')
      .lean()
    res.json({ vendedores })
  } catch (err) { next(err) }
}

// POST /api/admin/vendedores
exports.crearVendedor = async (req, res, next) => {
  try {
    const { nombre, email, password, negocio, ligas_asignadas } = req.body
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'nombre, email y password requeridos' })
    }
    const existe = await Usuario.findOne({ email: email.toLowerCase() })
    if (existe) return res.status(409).json({ error: 'Email ya en uso' })

    const hash = await bcrypt.hash(password, 10)
    const vendedor = await Usuario.create({
      nombre,
      email: email.toLowerCase(),
      password: hash,
      rol: 'vendedor',
      negocio: negocio || {},
      ligas_asignadas: ligas_asignadas || [],
    })
    const { password: _p, ...safe } = vendedor.toObject()
    res.status(201).json(safe)
  } catch (err) { next(err) }
}

// PUT /api/admin/vendedores/:id
exports.editarVendedor = async (req, res, next) => {
  try {
    const { nombre, email, password, negocio } = req.body
    const vendedor = await Usuario.findOne({ _id: req.params.id, rol: 'vendedor' })
    if (!vendedor) return res.status(404).json({ error: 'Vendedor no encontrado' })

    const update = {}
    if (nombre) update.nombre = nombre
    if (email && email.toLowerCase() !== vendedor.email) {
      const existe = await Usuario.findOne({ email: email.toLowerCase(), _id: { $ne: vendedor._id } })
      if (existe) return res.status(409).json({ error: 'Email ya en uso' })
      update.email = email.toLowerCase()
    }
    if (password) update.password = await bcrypt.hash(password, 10)
    if (negocio) {
      const base = vendedor.negocio?.toObject?.() || vendedor.negocio || {}
      const merged = { ...base, ...negocio }
      Object.entries(merged).forEach(([k, v]) => { update[`negocio.${k}`] = v })
    }

    const updated = await Usuario.findByIdAndUpdate(vendedor._id, { $set: update }, { new: true, select: '-password -__v' }).lean()
    res.json(updated)
  } catch (err) { next(err) }
}

// PUT /api/admin/vendedores/:id/ligas
exports.asignarLigas = async (req, res, next) => {
  try {
    const { ligas_asignadas } = req.body
    if (!Array.isArray(ligas_asignadas)) {
      return res.status(400).json({ error: 'ligas_asignadas debe ser un array' })
    }
    const vendedor = await Usuario.findOneAndUpdate(
      { _id: req.params.id, rol: 'vendedor' },
      { ligas_asignadas },
      { new: true, select: '-password' }
    ).lean()
    if (!vendedor) return res.status(404).json({ error: 'Vendedor no encontrado' })
    res.json(vendedor)
  } catch (err) { next(err) }
}
