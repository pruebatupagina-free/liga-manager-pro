const { Equipo, Liga, Usuario, Partido } = require('../models')
const bcrypt = require('bcryptjs')
const slugify = require('../utils/slugify')
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')
const calcularPagos = require('../utils/calcularPagos')

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

      if (req.user.rol !== 'superadmin' && req.plan) {
        const totalEquipos = await Equipo.countDocuments({ liga_id })
        if (totalEquipos >= req.plan.max_equipos) {
          return res.status(403).json({
            error: `Tu plan ${req.planNombre} permite máximo ${req.plan.max_equipos} equipos por liga. Actualiza tu plan para agregar más.`,
            codigo: 'LIMITE_EQUIPOS',
            plan: req.planNombre,
            limite: req.plan.max_equipos,
          })
        }
      }

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
      if (liga && req.body.dueno_id !== undefined) equipo.dueno_id = req.body.dueno_id || null

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

// POST /api/equipos/:id/cuenta — admin crea/actualiza credenciales del dueño
exports.crearCuenta = async (req, res, next) => {
  try {
    const equipo = await Equipo.findById(req.params.id)
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' })
    const liga = await verificarLiga(equipo.liga_id, req.user.id, req.user.rol)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'email y password requeridos' })

    if (equipo.dueno_id) {
      const hash = await bcrypt.hash(password, 12)
      await Usuario.findByIdAndUpdate(equipo.dueno_id, { email: email.toLowerCase(), password: hash })
      return res.json({ ok: true, actualizado: true })
    }

    const existe = await Usuario.findOne({ email: email.toLowerCase() })
    if (existe) return res.status(409).json({ error: 'Email ya en uso' })

    let username = `eq_${slugify(equipo.nombre)}`
    if (await Usuario.exists({ username })) username = `${username}_${Date.now().toString(36)}`

    const hash = await bcrypt.hash(password, 12)
    const user = await Usuario.create({
      nombre: equipo.nombre,
      email: email.toLowerCase(),
      password: hash,
      rol: 'dueno_equipo',
      username,
      licencia: { plan: 'basico', estado: 'activa', fecha_inicio: new Date() },
    })

    equipo.dueno_id = user._id
    await equipo.save()
    res.status(201).json({ ok: true, actualizado: false })
  } catch (err) { next(err) }
}

// GET /api/equipos/mi-equipo — dueño ve su propio equipo + cobros
exports.miEquipo = async (req, res, next) => {
  try {
    const equipo = await Equipo.findOne({ dueno_id: req.user.id }).lean()
    if (!equipo) return res.status(404).json({ error: 'No tienes un equipo asignado' })

    const liga = await Liga.findById(equipo.liga_id).lean()
    const partidos = await Partido.find({ liga_id: equipo.liga_id, estado: { $ne: 'cancelado' } }).lean()
    const cobros = liga ? calcularPagos(equipo, liga, partidos) : null

    if (cobros?.arbitrajes?.detalle?.length) {
      const rivalIds = cobros.arbitrajes.detalle.map(d => d.rival).filter(Boolean)
      const rivales = await Equipo.find({ _id: { $in: rivalIds } }).select('nombre').lean()
      const rivalMap = Object.fromEntries(rivales.map(e => [e._id.toString(), e.nombre]))
      cobros.arbitrajes.detalle = cobros.arbitrajes.detalle.map(d => ({
        ...d,
        rival_nombre: rivalMap[d.rival?.toString()] || 'Desconocido',
      }))
    }

    res.json({
      equipo,
      liga: liga ? { _id: liga._id, nombre: liga.nombre, slug: liga.slug, admin_username: liga.admin_username } : null,
      cobros,
    })
  } catch (err) { next(err) }
}

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
