const { Partido, Gol, Tarjeta, Jugador, Jornada, Liga } = require('../models')
const calcularMVP = require('../utils/calcularMVP')

async function verificarAdmin(ligaId, user) {
  const liga = await Liga.findById(ligaId).lean()
  if (!liga) return false
  return user.rol === 'superadmin' || liga.admin_id.toString() === user.id
}

// GET /api/partidos?jornada_id=xxx  OR  ?liga_id=xxx
exports.getAll = async (req, res, next) => {
  try {
    const { jornada_id, liga_id } = req.query
    if (!jornada_id && !liga_id) return res.status(400).json({ error: 'jornada_id o liga_id requerido' })
    const filter = jornada_id ? { jornada_id } : { liga_id }
    const partidos = await Partido.find(filter)
      .populate('equipo_local_id', 'nombre logo color_principal')
      .populate('equipo_visitante_id', 'nombre logo color_principal')
      .lean()
    res.json(partidos)
  } catch (err) { next(err) }
}

// PUT /api/partidos/:id/resultado
exports.guardarResultado = async (req, res, next) => {
  try {
    const partido = await Partido.findById(req.params.id)
    if (!partido) return res.status(404).json({ error: 'Partido no encontrado' })
    const ok = await verificarAdmin(partido.liga_id, req.user)
    if (!ok) return res.status(403).json({ error: 'Sin acceso' })
    if (partido.es_bye) return res.status(400).json({ error: 'No se puede registrar resultado de un BYE' })

    const { goles_local, goles_visitante, goles = [], tarjetas = [], arbitraje, notas } = req.body

    // Limpiar goles y tarjetas anteriores
    await Gol.deleteMany({ partido_id: partido._id })
    await Tarjeta.deleteMany({ partido_id: partido._id })

    // Insertar nuevos goles
    if (goles.length) await Gol.insertMany(goles.map(g => ({ ...g, partido_id: partido._id })))
    // Insertar nuevas tarjetas
    if (tarjetas.length) await Tarjeta.insertMany(tarjetas.map(t => ({ ...t, partido_id: partido._id })))

    // Calcular MVP
    const golDocs = await Gol.find({ partido_id: partido._id }).lean()
    const jugLocal = await Jugador.find({ equipo_id: partido.equipo_local_id }).select('_id').lean()
    const jugVisit = await Jugador.find({ equipo_id: partido.equipo_visitante_id }).select('_id').lean()
    const mvpId = calcularMVP(
      { ...partido.toObject(), goles_local, goles_visitante },
      golDocs,
      jugLocal.map(j => j._id),
      jugVisit.map(j => j._id)
    )

    partido.goles_local = goles_local
    partido.goles_visitante = goles_visitante
    partido.estado = 'jugado'
    partido.mvp_jugador_id = mvpId || null
    if (arbitraje) partido.arbitraje = arbitraje
    if (notas !== undefined) partido.notas = notas
    await partido.save()
    res.json(partido)
  } catch (err) { next(err) }
}

// PUT /api/partidos/:id/estado
exports.cambiarEstado = async (req, res, next) => {
  try {
    const partido = await Partido.findById(req.params.id)
    if (!partido) return res.status(404).json({ error: 'Partido no encontrado' })
    const ok = await verificarAdmin(partido.liga_id, req.user)
    if (!ok) return res.status(403).json({ error: 'Sin acceso' })

    const { estado, notas } = req.body
    const estadosValidos = ['cancelado', 'wo', 'reprogramado', 'pendiente']
    if (!estadosValidos.includes(estado)) return res.status(400).json({ error: 'Estado inválido' })

    if (estado === 'wo') {
      const { equipo_presente } = req.body
      if (!equipo_presente) return res.status(400).json({ error: 'equipo_presente requerido para WO' })
      const esLocal = equipo_presente.toString() === partido.equipo_local_id.toString()
      partido.goles_local = esLocal ? 3 : 0
      partido.goles_visitante = esLocal ? 0 : 3
    }

    partido.estado = estado
    if (notas !== undefined) partido.notas = notas
    await partido.save()
    res.json(partido)
  } catch (err) { next(err) }
}

// POST /api/partidos/extra
exports.agregarExtra = async (req, res, next) => {
  try {
    const { jornada_id, equipo_local_id, equipo_visitante_id, hora, cancha } = req.body
    if (!jornada_id || !equipo_local_id || !equipo_visitante_id) {
      return res.status(400).json({ error: 'jornada_id, equipo_local_id y equipo_visitante_id requeridos' })
    }
    const jornada = await Jornada.findById(jornada_id).lean()
    if (!jornada) return res.status(404).json({ error: 'Jornada no encontrada' })
    const ok = await verificarAdmin(jornada.liga_id, req.user)
    if (!ok) return res.status(403).json({ error: 'Sin acceso' })

    const partido = await Partido.create({
      jornada_id, liga_id: jornada.liga_id,
      equipo_local_id, equipo_visitante_id,
      hora, cancha: cancha || 1, tipo: 'extra',
    })
    res.status(201).json(partido)
  } catch (err) { next(err) }
}
