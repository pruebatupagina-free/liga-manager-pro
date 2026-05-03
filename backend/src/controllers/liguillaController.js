const mongoose = require('mongoose')
const { Liga, Equipo, LiguillaGrupo, LiguillaPartido, Partido, Jornada } = require('../models')

async function verificarAdmin(ligaId, user) {
  const liga = await Liga.findById(ligaId).lean()
  if (!liga) return null
  if (user.rol === 'superadmin') return liga
  if (liga.admin_id.toString() === user.id) return liga
  return null
}

// DELETE /api/liguilla?liga_id=xxx — reset liguilla for regeneration
exports.reset = async (req, res, next) => {
  try {
    const { liga_id } = req.query
    if (!liga_id) return res.status(400).json({ error: 'liga_id requerido' })
    const liga = await verificarAdmin(liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })
    await LiguillaPartido.deleteMany({ liga_id })
    await LiguillaGrupo.deleteMany({ liga_id })
    res.json({ ok: true, mensaje: 'Liguilla reseteada' })
  } catch (err) { next(err) }
}

// GET /api/liguilla?liga_id=xxx
exports.getEstado = async (req, res, next) => {
  try {
    const { liga_id } = req.query
    if (!liga_id) return res.status(400).json({ error: 'liga_id requerido' })
    const liga = await verificarAdmin(liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    const grupos = await LiguillaGrupo.find({ liga_id })
      .populate('equipos', 'nombre logo')
      .populate('campeon_id', 'nombre logo')
      .lean()

    const partidos = await LiguillaPartido.find({ liga_id })
      .populate('equipo_local_id', 'nombre logo')
      .populate('equipo_visitante_id', 'nombre logo')
      .populate('ganador_id', 'nombre logo')
      .lean()

    res.json({ grupos, partidos })
  } catch (err) { next(err) }
}

// POST /api/liguilla/generar  { liga_id }
exports.generar = async (req, res, next) => {
  try {
    const { liga_id } = req.body
    if (!liga_id) return res.status(400).json({ error: 'liga_id requerido' })
    const liga = await verificarAdmin(liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    const liguilla = liga.configuracion?.liguilla
    const tieneLiguilla = liguilla?.activa || liga.configuracion?.tiene_liguilla
    if (!tieneLiguilla) return res.status(400).json({ error: 'Liguilla no está configurada para esta liga' })

    const existente = await LiguillaGrupo.findOne({ liga_id })
    if (existente) return res.status(409).json({ error: 'La liguilla ya fue generada' })

    const numClasificados = liguilla?.clasificados_por_grupo || 8
    const numGrupos = liguilla?.num_grupos || 3

    const jornadas = await Jornada.find({ liga_id }).lean()
    const jornadasFaseRegular = jornadas.filter(j => j.estado === 'jugada' || j.estado === 'finalizada')
    if (jornadasFaseRegular.length === 0) {
      return res.status(400).json({ error: 'No hay jornadas finalizadas para generar liguilla' })
    }

    const equiposAll = await Equipo.find({ liga_id, 'baja.activa': { $ne: true } }).lean()
    const partidos = await Partido.find({ liga_id, estado: { $in: ['jugado', 'wo'] } }).lean()

    const stats = {}
    equiposAll.forEach(e => { stats[e._id.toString()] = { equipo: e, Pts: 0, DG: 0, GF: 0 } })
    partidos.filter(p => !p.es_bye).forEach(p => {
      const lid = p.equipo_local_id?.toString()
      const vid = p.equipo_visitante_id?.toString()
      const gl = p.goles_local ?? 0
      const gv = p.goles_visitante ?? 0
      if (!stats[lid] || !stats[vid]) return
      stats[lid].GF += gl; stats[vid].GF += gv
      if (gl > gv) stats[lid].Pts += 3
      else if (gl < gv) stats[vid].Pts += 3
      else { stats[lid].Pts++; stats[vid].Pts++ }
      stats[lid].DG += (gl - gv); stats[vid].DG += (gv - gl)
    })

    const clasificados = Object.values(stats)
      .sort((a, b) => b.Pts - a.Pts || b.DG - a.DG || b.GF - a.GF)
      .slice(0, numClasificados * numGrupos)
      .map(s => s.equipo)

    if (clasificados.length < numClasificados * numGrupos) {
      return res.status(400).json({ error: `No hay suficientes equipos (${clasificados.length}/${numClasificados * numGrupos})` })
    }

    const gruposCreados = []
    for (let g = 0; g < numGrupos; g++) {
      const equiposGrupo = clasificados.slice(g * numClasificados, (g + 1) * numClasificados)
      const grupo = await LiguillaGrupo.create({
        liga_id,
        numero_grupo: g + 1,
        equipos: equiposGrupo.map(e => e._id),
      })

      const partidosGrupo = []
      for (let i = 0; i < equiposGrupo.length; i++) {
        for (let j = i + 1; j < equiposGrupo.length; j++) {
          partidosGrupo.push({
            grupo_id: grupo._id,
            liga_id,
            fase: 'grupos',
            equipo_local_id: equiposGrupo[i]._id,
            equipo_visitante_id: equiposGrupo[j]._id,
            estado: 'programado',
          })
        }
      }
      await LiguillaPartido.insertMany(partidosGrupo)
      gruposCreados.push(grupo)
    }

    res.status(201).json({ grupos: gruposCreados.length, mensaje: 'Liguilla generada exitosamente' })
  } catch (err) { next(err) }
}

// PUT /api/liguilla/partido/:id/resultado
exports.guardarResultado = async (req, res, next) => {
  try {
    const { goles_local, goles_visitante, penales_local, penales_visitante } = req.body
    const partido = await LiguillaPartido.findById(req.params.id)
    if (!partido) return res.status(404).json({ error: 'Partido no encontrado' })

    const liga = await verificarAdmin(partido.liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    partido.goles_local = Number(goles_local) || 0
    partido.goles_visitante = Number(goles_visitante) || 0
    partido.estado = 'jugado'

    // Determinar ganador (con penales si empate en eliminatoria)
    const esGrupo = partido.fase === 'grupos'
    if (!esGrupo && partido.goles_local === partido.goles_visitante) {
      if (penales_local === undefined || penales_visitante === undefined) {
        return res.status(400).json({ error: 'Partido empatado en eliminatoria requiere penales' })
      }
      partido.penales_local = Number(penales_local)
      partido.penales_visitante = Number(penales_visitante)
      partido.ganador_id = partido.penales_local > partido.penales_visitante
        ? partido.equipo_local_id
        : partido.equipo_visitante_id
    } else if (!esGrupo) {
      partido.ganador_id = partido.goles_local > partido.goles_visitante
        ? partido.equipo_local_id
        : partido.equipo_visitante_id
    }

    await partido.save()

    // Si fase de grupos terminó, generar cuartos
    if (esGrupo) {
      const grupo = await LiguillaGrupo.findById(partido.grupo_id)
      const todosJugados = await LiguillaPartido.countDocuments({
        grupo_id: partido.grupo_id,
        estado: { $ne: 'jugado' },
      })
      if (todosJugados === 0 && grupo) {
        await generarEliminatorias(partido.liga_id)
      }
    }

    // Si cuartos terminaron todos, generar semis
    if (partido.fase === 'cuartos') {
      const pendientesCuartos = await LiguillaPartido.countDocuments({
        liga_id: partido.liga_id, fase: 'cuartos', estado: { $ne: 'jugado' },
      })
      if (pendientesCuartos === 0) await generarSiguienteFase(partido.liga_id, 'cuartos', 'semis')
    }

    // Si semis terminaron todas, generar final
    if (partido.fase === 'semis') {
      const pendientesSemis = await LiguillaPartido.countDocuments({
        liga_id: partido.liga_id, fase: 'semis', estado: { $ne: 'jugado' },
      })
      if (pendientesSemis === 0) await generarSiguienteFase(partido.liga_id, 'semis', 'final')
    }

    res.json(partido)
  } catch (err) { next(err) }
}

async function generarEliminatorias(ligaId) {
  const grupos = await LiguillaGrupo.find({ liga_id: ligaId }).lean()
  const ya = await LiguillaPartido.findOne({ liga_id: ligaId, fase: 'cuartos' })
  if (ya) return

  // Calcular clasificados de cada grupo
  const clasificadosPorGrupo = []
  for (const grupo of grupos) {
    const stats = {}
    grupo.equipos.forEach(id => { stats[id.toString()] = { id, Pts: 0, DG: 0, GF: 0 } })

    const partidosGrupo = await LiguillaPartido.find({ grupo_id: grupo._id, fase: 'grupos' }).lean()
    partidosGrupo.forEach(p => {
      const lid = p.equipo_local_id?.toString()
      const vid = p.equipo_visitante_id?.toString()
      const gl = p.goles_local ?? 0; const gv = p.goles_visitante ?? 0
      if (!stats[lid] || !stats[vid]) return
      stats[lid].GF += gl; stats[vid].GF += gv
      stats[lid].DG += (gl - gv); stats[vid].DG += (gv - gl)
      if (gl > gv) stats[lid].Pts += 3
      else if (gl < gv) stats[vid].Pts += 3
      else { stats[lid].Pts++; stats[vid].Pts++ }
    })

    const sorted = Object.values(stats).sort((a, b) => b.Pts - a.Pts || b.DG - a.DG || b.GF - a.GF)
    clasificadosPorGrupo.push(sorted.map(s => s.id))
  }

  // Cruz: 1ro grupo A vs 2do grupo B, etc.
  const fase = grupos.length === 1 ? 'semis' : 'cuartos'
  const partidos = []
  for (let i = 0; i < grupos.length; i++) {
    const j = (i + 1) % grupos.length
    if (clasificadosPorGrupo[i]?.[0] && clasificadosPorGrupo[j]?.[1]) {
      partidos.push({ liga_id: ligaId, fase, equipo_local_id: clasificadosPorGrupo[i][0], equipo_visitante_id: clasificadosPorGrupo[j][1], estado: 'programado' })
    }
    if (clasificadosPorGrupo[j]?.[0] && clasificadosPorGrupo[i]?.[1]) {
      partidos.push({ liga_id: ligaId, fase, equipo_local_id: clasificadosPorGrupo[j][0], equipo_visitante_id: clasificadosPorGrupo[i][1], estado: 'programado' })
    }
  }
  if (partidos.length) await LiguillaPartido.insertMany(partidos)
}

// Genera la siguiente ronda eliminatoria: ganadores de faseActual pasan a faseNext
async function generarSiguienteFase(ligaId, faseActual, faseNext) {
  const ya = await LiguillaPartido.findOne({ liga_id: ligaId, fase: faseNext })
  if (ya) return

  const jugados = await LiguillaPartido.find({ liga_id: ligaId, fase: faseActual, estado: 'jugado' }).lean()
  const ganadores = jugados.map(p => p.ganador_id).filter(Boolean)

  const partidos = []
  for (let i = 0; i < ganadores.length - 1; i += 2) {
    partidos.push({
      liga_id: ligaId,
      fase: faseNext,
      equipo_local_id: ganadores[i],
      equipo_visitante_id: ganadores[i + 1],
      estado: 'programado',
    })
  }
  if (partidos.length) await LiguillaPartido.insertMany(partidos)
}
