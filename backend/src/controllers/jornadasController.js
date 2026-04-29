const { Jornada, Partido, Equipo, Liga } = require('../models')
const { generarRoundRobin, asignarHorariosConFijos } = require('../utils/roundRobin')

async function verificarAdmin(ligaId, user) {
  const liga = await Liga.findById(ligaId)
  if (!liga) return null
  if (user.rol === 'superadmin') return liga
  if (liga.admin_id.toString() === user.id) return liga
  return null
}

// GET /api/jornadas?liga_id=xxx
exports.getAll = async (req, res, next) => {
  try {
    const { liga_id } = req.query
    if (!liga_id) return res.status(400).json({ error: 'liga_id requerido' })
    const liga = await verificarAdmin(liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })
    const jornadas = await Jornada.find({ liga_id }).sort('numero').lean()
    res.json(jornadas)
  } catch (err) { next(err) }
}

// POST /api/jornadas/generar
exports.generar = async (req, res, next) => {
  let jornada = null
  try {
    const { liga_id, fecha, notas } = req.body
    if (!liga_id) return res.status(400).json({ error: 'liga_id requerido' })
    const liga = await verificarAdmin(liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    const equipos = await Equipo.find({ liga_id, 'baja.activa': { $ne: true } }).lean()
    if (equipos.length < 2) return res.status(400).json({ error: 'Se necesitan al menos 2 equipos' })

    const ultimaJornada = await Jornada.findOne({ liga_id }).sort('-numero').lean()
    const numero = (ultimaJornada?.numero || 0) + 1

    const historialByes = {}
    equipos.forEach(e => { historialByes[e._id.toString()] = e.veces_bye || 0 })

    const todasLasRondas = generarRoundRobin(equipos)
    const idxRonda = (numero - 1) % todasLasRondas.length
    let partidosDeLaRonda = todasLasRondas[idxRonda]

    const partidoBye = partidosDeLaRonda.find(p => p.es_bye)
    if (partidoBye) {
      const candidatos = equipos.filter(e => {
        const nByes = historialByes[e._id.toString()] || 0
        const minByes = Math.min(...Object.values(historialByes))
        return nByes === minByes
      })
      if (candidatos.length > 0) {
        const elegido = candidatos[Math.floor(Math.random() * candidatos.length)]
        partidoBye.equipo_local_id = elegido._id
        partidoBye.equipo_bye_id = elegido._id
        await Equipo.findByIdAndUpdate(elegido._id, { $inc: { veces_bye: 1 } })
      }
    }

    const config = liga.configuracion
    partidosDeLaRonda = asignarHorariosConFijos(
      partidosDeLaRonda.filter(p => !p.es_bye || p.equipo_local_id),
      equipos,
      { hora_inicio: config.hora_inicio || '08:00', hora_fin: config.hora_fin || '20:00',
        duracion_partido: config.duracion_partido || 60, num_canchas: config.num_canchas || 1 }
    )

    jornada = await Jornada.create({ liga_id, numero, fecha, notas, estado: 'pendiente' })
    const jId = jornada._id

    const partidosData = partidosDeLaRonda.map(p => ({
      jornada_id: jId, liga_id,
      equipo_local_id: p.equipo_local_id,
      equipo_visitante_id: p.equipo_visitante_id || null,
      cancha: p.cancha || 1, hora: p.hora,
      es_bye: p.es_bye || false,
      arbitraje: {
        local: { monto: p.es_bye ? 0 : config.costo_arbitraje || 0, pagado: false },
        visitante: { monto: p.es_bye ? 0 : config.costo_arbitraje || 0, pagado: false },
      },
    }))

    const partidos = await Partido.insertMany(partidosData)
    res.status(201).json({ jornada, partidos })
  } catch (err) {
    if (jornada) await Jornada.findByIdAndDelete(jornada._id).catch(() => {})
    next(err)
  }
}

// GET /api/jornadas/:id
exports.getOne = async (req, res, next) => {
  try {
    const jornada = await Jornada.findById(req.params.id).lean()
    if (!jornada) return res.status(404).json({ error: 'Jornada no encontrada' })
    const liga = await verificarAdmin(jornada.liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })
    const partidos = await Partido.find({ jornada_id: jornada._id }).lean()
    res.json({ jornada, partidos })
  } catch (err) { next(err) }
}

// PUT /api/jornadas/:id
exports.update = async (req, res, next) => {
  try {
    const jornada = await Jornada.findById(req.params.id)
    if (!jornada) return res.status(404).json({ error: 'Jornada no encontrada' })
    const liga = await verificarAdmin(jornada.liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })
    const { notas, fecha, hora_inicio, estado } = req.body
    if (notas !== undefined) jornada.notas = notas
    if (fecha !== undefined) jornada.fecha = fecha
    if (hora_inicio !== undefined) jornada.hora_inicio = hora_inicio
    if (estado) jornada.estado = estado
    await jornada.save()
    res.json(jornada)
  } catch (err) { next(err) }
}

// DELETE /api/jornadas/:id
exports.remove = async (req, res, next) => {
  try {
    const jornada = await Jornada.findById(req.params.id)
    if (!jornada) return res.status(404).json({ error: 'Jornada no encontrada' })
    const liga = await verificarAdmin(jornada.liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })
    const noTodoPendiente = await Partido.exists({ jornada_id: jornada._id, estado: { $ne: 'pendiente' } })
    if (noTodoPendiente) return res.status(400).json({ error: 'No se puede eliminar: hay partidos jugados/cancelados' })
    await Partido.deleteMany({ jornada_id: jornada._id })
    await jornada.deleteOne()
    res.json({ ok: true })
  } catch (err) { next(err) }
}
