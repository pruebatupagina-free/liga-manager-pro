const { Liga, Jornada, Equipo, Jugador, Partido, Gol, Tarjeta, Sancion, LiguillaGrupo, LiguillaPartido, Inscripcion, Usuario } = require('../models')
const bcrypt = require('bcryptjs')
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

// POST /api/ligas/:id/clonar
exports.clonar = async (req, res, next) => {
  try {
    const liga = await Liga.findById(req.params.id).lean()
    if (!liga) return res.status(404).json({ error: 'Liga no encontrada' })
    if (req.user.rol !== 'superadmin' && liga.admin_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Sin acceso' })
    }
    const year = new Date().getFullYear()
    const baseName = `${liga.nombre} (copia)`
    let slug = `${slugify(baseName)}-${year}`
    const exists = await Liga.findOne({ slug })
    if (exists) slug = `${slug}-${Date.now()}`
    const nueva = await Liga.create({
      admin_id: liga.admin_id,
      nombre: baseName,
      slug,
      configuracion: liga.configuracion,
      reglamento: liga.reglamento || '',
    })
    res.status(201).json(nueva)
  } catch (err) { next(err) }
}

// POST /api/ligas/:id/galeria  — body: { imagen: 'data:image/jpeg;base64,...' }
exports.galeriaAdd = async (req, res, next) => {
  try {
    const liga = await Liga.findById(req.params.id)
    if (!liga) return res.status(404).json({ error: 'Liga no encontrada' })
    if (req.user.rol !== 'superadmin' && liga.admin_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Sin acceso' })
    }
    const { imagen } = req.body
    if (!imagen || !imagen.startsWith('data:image')) return res.status(400).json({ error: 'imagen requerida (base64)' })
    if (liga.galeria.length >= 20) return res.status(400).json({ error: 'Máximo 20 fotos por galería' })
    liga.galeria.push(imagen)
    await liga.save()
    res.json({ galeria_count: liga.galeria.length })
  } catch (err) { next(err) }
}

// DELETE /api/ligas/:id/galeria/:idx
exports.galeriaDelete = async (req, res, next) => {
  try {
    const liga = await Liga.findById(req.params.id)
    if (!liga) return res.status(404).json({ error: 'Liga no encontrada' })
    if (req.user.rol !== 'superadmin' && liga.admin_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Sin acceso' })
    }
    const idx = Number(req.params.idx)
    if (isNaN(idx) || idx < 0 || idx >= liga.galeria.length) {
      return res.status(400).json({ error: 'Índice inválido' })
    }
    liga.galeria.splice(idx, 1)
    await liga.save()
    res.json({ galeria_count: liga.galeria.length })
  } catch (err) { next(err) }
}

// GET /api/ligas/:id/galeria
exports.galeriaGet = async (req, res, next) => {
  try {
    const liga = await Liga.findById(req.params.id).select('galeria admin_id').lean()
    if (!liga) return res.status(404).json({ error: 'Liga no encontrada' })
    if (req.user.rol !== 'superadmin' && liga.admin_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Sin acceso' })
    }
    res.json({ galeria: liga.galeria || [] })
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
    if (tieneJornadas) {
      const { password } = req.body
      if (!password) return res.status(400).json({ error: 'Esta liga tiene jornadas. Confirma con tu contraseña para eliminarla.' })
      const user = await Usuario.findById(req.user.id).select('+password')
      const ok = await bcrypt.compare(password, user.password)
      if (!ok) return res.status(401).json({ error: 'Contraseña incorrecta' })

      // Borrado en cascada
      const ligaId = liga._id
      const equipos = await Equipo.find({ liga_id: ligaId }).select('_id')
      const equipoIds = equipos.map(e => e._id)
      const partidos = await Partido.find({ liga_id: ligaId }).select('_id')
      const partidoIds = partidos.map(p => p._id)

      await Gol.deleteMany({ partido_id: { $in: partidoIds } })
      await Tarjeta.deleteMany({ partido_id: { $in: partidoIds } })
      await Sancion.deleteMany({ equipo_id: { $in: equipoIds } })
      await Partido.deleteMany({ liga_id: ligaId })
      await Jornada.deleteMany({ liga_id: ligaId })
      await LiguillaGrupo.deleteMany({ liga_id: ligaId })
      await LiguillaPartido.deleteMany({ liga_id: ligaId })
      await Inscripcion.deleteMany({ liga_id: ligaId })
      await Jugador.deleteMany({ equipo_id: { $in: equipoIds } })
      await Equipo.deleteMany({ liga_id: ligaId })
    }

    await liga.deleteOne()
    res.json({ ok: true })
  } catch (err) { next(err) }
}
