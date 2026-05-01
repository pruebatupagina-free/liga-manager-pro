const crypto = require('crypto')
const { Liga, Inscripcion, Equipo, Jugador } = require('../models')
const slugify = require('../utils/slugify')

function checkOwner(liga, userId) {
  return liga.admin_id.toString() === userId
}

// POST /api/ligas/:id/inscripciones/token  (admin)
exports.generarToken = async (req, res, next) => {
  try {
    const liga = await Liga.findById(req.params.id)
    if (!liga) return res.status(404).json({ error: 'Liga no encontrada' })
    if (req.user.rol !== 'superadmin' && !checkOwner(liga, req.user.id)) {
      return res.status(403).json({ error: 'Sin acceso' })
    }
    liga.token_inscripcion = crypto.randomBytes(8).toString('hex')
    liga.inscripciones_abiertas = true
    await liga.save()
    res.json({ token: liga.token_inscripcion })
  } catch (err) { next(err) }
}

// PUT /api/ligas/:id/inscripciones/cerrar  (admin)
exports.cerrar = async (req, res, next) => {
  try {
    const liga = await Liga.findById(req.params.id)
    if (!liga) return res.status(404).json({ error: 'Liga no encontrada' })
    if (req.user.rol !== 'superadmin' && !checkOwner(liga, req.user.id)) {
      return res.status(403).json({ error: 'Sin acceso' })
    }
    liga.inscripciones_abiertas = false
    await liga.save()
    res.json({ ok: true })
  } catch (err) { next(err) }
}

// GET /api/inscripciones/:token  (público)
exports.getForm = async (req, res, next) => {
  try {
    const liga = await Liga.findOne({ token_inscripcion: req.params.token }).lean()
    if (!liga) return res.status(404).json({ error: 'Enlace inválido' })
    if (!liga.inscripciones_abiertas) return res.status(403).json({ error: 'Las inscripciones están cerradas' })
    res.json({
      liga: {
        _id: liga._id,
        nombre: liga.nombre,
        estado: liga.estado,
        configuracion: liga.configuracion,
        reglamento: liga.reglamento,
      },
    })
  } catch (err) { next(err) }
}

// POST /api/inscripciones/:token  (público)
exports.submit = async (req, res, next) => {
  try {
    const liga = await Liga.findOne({ token_inscripcion: req.params.token }).lean()
    if (!liga) return res.status(404).json({ error: 'Enlace inválido' })
    if (!liga.inscripciones_abiertas) return res.status(403).json({ error: 'Las inscripciones están cerradas' })

    const { nombre_equipo, color, nombre_capitan, whatsapp, jugadores = [] } = req.body
    if (!nombre_equipo?.trim()) return res.status(400).json({ error: 'Nombre del equipo requerido' })
    if (!nombre_capitan?.trim()) return res.status(400).json({ error: 'Nombre del capitán requerido' })
    if (!whatsapp?.trim()) return res.status(400).json({ error: 'WhatsApp requerido' })

    const inscripcion = await Inscripcion.create({
      liga_id: liga._id,
      nombre_equipo: nombre_equipo.trim(),
      color: color || '#22C55E',
      nombre_capitan: nombre_capitan.trim(),
      whatsapp: whatsapp.trim(),
      jugadores: jugadores.filter(j => j.nombre?.trim()).map(j => ({
        nombre: j.nombre.trim(),
        numero_camiseta: j.numero_camiseta || null,
        posicion: j.posicion || null,
      })),
    })

    res.status(201).json({ ok: true, id: inscripcion._id })
  } catch (err) { next(err) }
}

// GET /api/inscripciones?liga_id=xxx  (admin)
exports.list = async (req, res, next) => {
  try {
    const { liga_id } = req.query
    if (!liga_id) return res.status(400).json({ error: 'liga_id requerido' })
    const liga = await Liga.findById(liga_id).lean()
    if (!liga) return res.status(404).json({ error: 'Liga no encontrada' })
    if (req.user.rol !== 'superadmin' && !checkOwner(liga, req.user.id)) {
      return res.status(403).json({ error: 'Sin acceso' })
    }
    const inscripciones = await Inscripcion.find({ liga_id }).sort({ createdAt: -1 }).lean()
    res.json({ inscripciones, inscripciones_abiertas: liga.inscripciones_abiertas, token: liga.token_inscripcion })
  } catch (err) { next(err) }
}

// PUT /api/inscripciones/:id/aprobar  (admin)
exports.aprobar = async (req, res, next) => {
  try {
    const insc = await Inscripcion.findById(req.params.id).populate('liga_id').lean()
    if (!insc) return res.status(404).json({ error: 'Inscripción no encontrada' })
    if (req.user.rol !== 'superadmin' && !checkOwner(insc.liga_id, req.user.id)) {
      return res.status(403).json({ error: 'Sin acceso' })
    }
    if (insc.estado !== 'pendiente') return res.status(400).json({ error: 'Solo se pueden aprobar inscripciones pendientes' })

    let slug = slugify(insc.nombre_equipo)
    const exists = await Equipo.findOne({ liga_id: insc.liga_id._id, slug })
    if (exists) slug = `${slug}-${Date.now()}`

    const equipo = await Equipo.create({
      liga_id: insc.liga_id._id,
      nombre: insc.nombre_equipo,
      slug,
      color_principal: insc.color,
      whatsapp: insc.whatsapp,
    })

    if (insc.jugadores?.length) {
      await Jugador.insertMany(insc.jugadores.map(j => ({
        equipo_id: equipo._id,
        nombre: j.nombre,
        numero_camiseta: j.numero_camiseta,
        posicion: j.posicion,
      })))
    }

    await Inscripcion.findByIdAndUpdate(req.params.id, { estado: 'aprobada', equipo_id: equipo._id })
    res.json({ ok: true, equipo })
  } catch (err) { next(err) }
}

// PUT /api/inscripciones/:id/rechazar  (admin)
exports.rechazar = async (req, res, next) => {
  try {
    const insc = await Inscripcion.findById(req.params.id).populate('liga_id').lean()
    if (!insc) return res.status(404).json({ error: 'Inscripción no encontrada' })
    if (req.user.rol !== 'superadmin' && !checkOwner(insc.liga_id, req.user.id)) {
      return res.status(403).json({ error: 'Sin acceso' })
    }
    await Inscripcion.findByIdAndUpdate(req.params.id, {
      estado: 'rechazada',
      notas_admin: req.body.motivo || null,
    })
    res.json({ ok: true })
  } catch (err) { next(err) }
}
