const { Jugador, Equipo, Liga } = require('../models')
const { upload, uploadToCloudinary, deleteFromCloudinary } = require('../utils/upload')

async function puedeGestionar(equipoId, user) {
  const equipo = await Equipo.findById(equipoId).lean()
  if (!equipo) return { ok: false, equipo: null }
  if (user.rol === 'superadmin') return { ok: true, equipo }
  if (user.rol === 'admin_liga') {
    const liga = await Liga.findById(equipo.liga_id).lean()
    if (liga && liga.admin_id.toString() === user.id) return { ok: true, equipo }
  }
  if (user.rol === 'dueno_equipo' && equipo.dueno_id?.toString() === user.id) return { ok: true, equipo }
  return { ok: false, equipo }
}

// GET /api/jugadores?equipo_id=xxx
exports.getAll = async (req, res, next) => {
  try {
    const { equipo_id } = req.query
    if (!equipo_id) return res.status(400).json({ error: 'equipo_id requerido' })
    const { ok } = await puedeGestionar(equipo_id, req.user)
    if (!ok) return res.status(403).json({ error: 'Sin acceso' })
    const jugadores = await Jugador.find({ equipo_id }).lean()
    res.json(jugadores)
  } catch (err) { next(err) }
}

// POST /api/jugadores
exports.create = [
  upload.single('foto'),
  async (req, res, next) => {
    try {
      const { equipo_id, nombre, numero_camiseta, posicion } = req.body
      if (!equipo_id || !nombre) return res.status(400).json({ error: 'equipo_id y nombre requeridos' })

      const { ok, equipo } = await puedeGestionar(equipo_id, req.user)
      if (!ok) return res.status(403).json({ error: 'Sin acceso' })

      // Máximo 30 jugadores activos
      const activos = await Jugador.countDocuments({ equipo_id, activo: true })
      if (activos >= 30) return res.status(400).json({ error: 'Máximo 30 jugadores activos por equipo' })

      // Número de camiseta único por equipo
      if (numero_camiseta) {
        const duplicado = await Jugador.exists({ equipo_id, numero_camiseta: Number(numero_camiseta) })
        if (duplicado) return res.status(409).json({ error: `Número ${numero_camiseta} ya en uso` })
      }

      let fotoUrl = null
      if (req.file) fotoUrl = await uploadToCloudinary(req.file.buffer, 'jugadores')

      const jugador = await Jugador.create({
        equipo_id, nombre, numero_camiseta: numero_camiseta ? Number(numero_camiseta) : null,
        posicion, foto: fotoUrl,
      })
      res.status(201).json(jugador)
    } catch (err) { next(err) }
  },
]

// PUT /api/jugadores/:id
exports.update = [
  upload.single('foto'),
  async (req, res, next) => {
    try {
      const jugador = await Jugador.findById(req.params.id)
      if (!jugador) return res.status(404).json({ error: 'Jugador no encontrado' })

      const { ok } = await puedeGestionar(jugador.equipo_id, req.user)
      if (!ok) return res.status(403).json({ error: 'Sin acceso' })

      const { nombre, numero_camiseta, posicion, activo } = req.body
      if (nombre) jugador.nombre = nombre
      if (posicion) jugador.posicion = posicion
      if (activo !== undefined) jugador.activo = Boolean(activo)

      if (numero_camiseta && Number(numero_camiseta) !== jugador.numero_camiseta) {
        const dup = await Jugador.exists({ equipo_id: jugador.equipo_id, numero_camiseta: Number(numero_camiseta), _id: { $ne: jugador._id } })
        if (dup) return res.status(409).json({ error: `Número ${numero_camiseta} ya en uso` })
        jugador.numero_camiseta = Number(numero_camiseta)
      }

      if (req.file) {
        if (jugador.foto) await deleteFromCloudinary(jugador.foto)
        jugador.foto = await uploadToCloudinary(req.file.buffer, 'jugadores')
      }
      await jugador.save()
      res.json(jugador)
    } catch (err) { next(err) }
  },
]

// DELETE /api/jugadores/:id
exports.remove = async (req, res, next) => {
  try {
    const jugador = await Jugador.findById(req.params.id)
    if (!jugador) return res.status(404).json({ error: 'Jugador no encontrado' })
    const { ok } = await puedeGestionar(jugador.equipo_id, req.user)
    if (!ok) return res.status(403).json({ error: 'Sin acceso' })
    if (jugador.foto) await deleteFromCloudinary(jugador.foto)
    await jugador.deleteOne()
    res.json({ ok: true })
  } catch (err) { next(err) }
}
