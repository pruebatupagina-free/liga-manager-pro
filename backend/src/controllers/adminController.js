const { Usuario, Liga } = require('../models')

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

// PUT /api/admin/usuarios/:id/licencia
exports.editarLicencia = async (req, res, next) => {
  try {
    const { estado, fecha_vencimiento, plan } = req.body
    const user = await Usuario.findById(req.params.id)
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    if (estado) user.licencia.estado = estado
    if (fecha_vencimiento) user.licencia.fecha_vencimiento = new Date(fecha_vencimiento)
    if (plan) user.licencia.plan = plan

    await user.save()
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
