const { Usuario } = require('../models')

module.exports = async (req, res, next) => {
  try {
    if (req.user.rol === 'superadmin') return next()
    const usuario = await Usuario.findById(req.user.id).lean()
    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' })
    const estado = usuario.licencia?.estado
    if (estado === 'vencida' || estado === 'suspendida') {
      return res.status(403).json({ error: 'Licencia inactiva', estado })
    }
    next()
  } catch (err) {
    next(err)
  }
}
