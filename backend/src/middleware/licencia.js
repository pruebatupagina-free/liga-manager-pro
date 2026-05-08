const { Usuario } = require('../models')
const PLANES = require('../config/planes')

module.exports = async (req, res, next) => {
  try {
    if (['superadmin', 'dueno_equipo', 'vendedor', 'arbitro'].includes(req.user.rol)) return next()
    const usuario = await Usuario.findById(req.user.id).lean()
    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' })
    const estado = usuario.licencia?.estado
    if (estado === 'vencida' || estado === 'suspendida') {
      return res.status(403).json({ error: 'Licencia inactiva', estado })
    }
    const planNombre = usuario.licencia?.plan || 'basico'
    req.plan = PLANES[planNombre] || PLANES.basico
    req.planNombre = planNombre
    next()
  } catch (err) {
    next(err)
  }
}
