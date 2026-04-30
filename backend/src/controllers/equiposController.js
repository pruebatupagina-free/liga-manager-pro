const { Equipo, Liga } = require('../models')
const slugify = require('../utils/slugify')
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')

async function verificarLiga(ligaId, userId, rol) {
  const liga = await Liga.findById(ligaId).lean()
  if (!liga) return null
  if (rol !== 'superadmin' && liga.admin_id.toString() !== userId) return null
  return liga
}

// GET /api/equipos?liga_id=xxx
exports.getAll = async (req, res, next) => {
  try {
    const { liga_id } = req.query
    if (!liga_id) return res.status(400).json({ error: 'liga_id requerido' })
    const liga = await verificarLiga(liga_id, req.user.id, req.user.rol)
    if (!liga) return res.status(403).json({ error: 'Sin acceso a esta liga' })
    const equipos = await Equipo.find({ liga_id }).lean()
    res.json(equipos)
  } catch (err) { next(err) }
}

// POST /api/equipos
exports.create = [
  upload.single('logo'),
  async (req, res, next) => {
    try {
      const { liga_id, nombre, dia_juego, hora_fija, telefono, whatsapp, color_principal, tiene_hora_fija } = req.body
      if (!liga_id || !nombre) return res.status(400).json({ error: 'liga_id y nombre requeridos' })
      const liga = await verificarLiga(liga_id, req.user.id, req.user.rol)
      if (!liga) return res.status(403).json({ error: 'Sin acceso a esta liga' })

      const slug = slugify(nombre)
      let logoUrl = null
      if (req.file) logoUrl = await uploadToCloudinary(req.file.buffer, 'logos')

      const equipo = await Equipo.create({
        liga_id, nombre, slug, color_principal: color_principal || '#000000',
        logo: logoUrl, dia_juego, hora_fija: (tiene_hora_fija === true || tiene_hora_fija === 'true') ? hora_fija : null,
        tiene_hora_fija: tiene_hora_fija === true || tiene_hora_fija === 'true', telefono, whatsapp,
      })
      res.status(201).json(equipo)
    } catch (err) { next(err) }
  },
]

// GET /api/equipos/:id
exports.getOne = async (req, res, next) => {
  try {
    const equipo = await Equipo.findById(req.params.id).lean()
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' })
    const liga = await verificarLiga(equipo.liga_id, req.user.id, req.user.rol)
    if (!liga && req.user.rol !== 'dueno_equipo') return res.status(403).json({ error: 'Sin acceso' })
    res.json(equipo)
  } catch (err) { next(err) }
}

// PUT /api/equipos/:id
exports.update = [
  upload.single('logo'),
  async (req, res, next) => {
    try {
      const equipo = await Equipo.findById(req.params.id)
      if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' })
      const liga = await verificarLiga(equipo.liga_id, req.user.id, req.user.rol)
      const esDueno = req.user.rol === 'dueno_equipo' && equipo.dueno_id?.toString() === req.user.id
      if (!liga && !esDueno) return res.status(403).json({ error: 'Sin acceso' })

      const campos = ['nombre', 'dia_juego', 'hora_fija', 'telefono', 'whatsapp', 'color_principal']
      campos.forEach(c => { if (req.body[c] !== undefined) equipo[c] = req.body[c] })
      if (req.body.tiene_hora_fija !== undefined) equipo.tiene_hora_fija = req.body.tiene_hora_fija === true || req.body.tiene_hora_fija === 'true'

      if (req.body.baja !== undefined) {
        const { activa, motivo, conservar_partidos } = JSON.parse(req.body.baja)
        equipo.baja = { activa, motivo, conservar_partidos, fecha: activa ? new Date() : null }
      }

      if (req.file) {
        if (equipo.logo) await deleteFromCloudinary(equipo.logo)
        equipo.logo = await uploadToCloudinary(req.file.buffer, 'logos')
      }
      await equipo.save()
      res.json(equipo)
    } catch (err) { next(err) }
  },
]

// DELETE /api/equipos/:id
exports.remove = async (req, res, next) => {
  try {
    const equipo = await Equipo.findById(req.params.id)
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' })
    const liga = await verificarLiga(equipo.liga_id, req.user.id, req.user.rol)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })
    if (equipo.logo) await deleteFromCloudinary(equipo.logo)
    await equipo.deleteOne()
    res.json({ ok: true })
  } catch (err) { next(err) }
}
