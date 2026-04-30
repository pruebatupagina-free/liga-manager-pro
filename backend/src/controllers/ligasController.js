const { Liga, Jornada } = require('../models')
const slugify = require('../utils/slugify')

function checkOwner(liga, userId) {
  return liga && liga.admin_id.toString() === userId
}

// GET /api/ligas
exports.getAll = async (req, res, next) => {
  try {
    const filter = req.user.rol === 'superadmin' ? {} : { admin_id: req.user.id }
    const ligas = await Liga.find(filter).lean()
    res.json(ligas)
  } catch (err) { next(err) }
}

// POST /api/ligas
exports.create = async (req, res, next) => {
  try {
    const { nombre, configuracion } = req.body
    if (!nombre) return res.status(400).json({ error: 'nombre requerido' })
    const year = new Date().getFullYear()
    let slug = `${slugify(nombre)}-${year}`
    const exists = await Liga.findOne({ slug })
    if (exists) slug = `${slug}-${Date.now()}`
    const liga = await Liga.create({ admin_id: req.user.id, nombre, slug, configuracion: configuracion || {} })
    res.status(201).json(liga)
  } catch (err) { next(err) }
}

// GET /api/ligas/:id
exports.getOne = async (req, res, next) => {
  try {
    const liga = await Liga.findById(req.params.id).lean()
    if (!liga) return res.status(404).json({ error: 'Liga no encontrada' })
    if (req.user.rol !== 'superadmin' && !checkOwner(liga, req.user.id)) {
      return res.status(403).json({ error: 'Sin acceso' })
    }
    res.json(liga)
  } catch (err) { next(err) }
}

// PUT /api/ligas/:id
exports.update = async (req, res, next) => {
  try {
    const liga = await Liga.findById(req.params.id)
    if (!liga) return res.status(404).json({ error: 'Liga no encontrada' })
    if (req.user.rol !== 'superadmin' && !checkOwner(liga, req.user.id)) {
      return res.status(403).json({ error: 'Sin acceso' })
    }
    const { nombre, estado, configuracion, reglamento, galeria } = req.body
    if (nombre) liga.nombre = nombre
    if (estado) liga.estado = estado
    if (configuracion) liga.configuracion = { ...liga.configuracion.toObject(), ...configuracion }
    if (reglamento !== undefined) liga.reglamento = reglamento
    if (galeria) liga.galeria = galeria
    await liga.save()
    res.json(liga)
  } catch (err) { next(err) }
}

// DELETE /api/ligas/:id
exports.remove = async (req, res, next) => {
  try {
    const liga = await Liga.findById(req.params.id)
    if (!liga) return res.status(404).json({ error: 'Liga no encontrada' })
    if (req.user.rol !== 'superadmin' && !checkOwner(liga, req.user.id)) {
      return res.status(403).json({ error: 'Sin acceso' })
    }
    const tieneJornadas = await Jornada.exists({ liga_id: liga._id })
    if (tieneJornadas) return res.status(400).json({ error: 'No se puede eliminar una liga con jornadas' })
    await liga.deleteOne()
    res.json({ ok: true })
  } catch (err) { next(err) }
}
