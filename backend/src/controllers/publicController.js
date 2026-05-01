const { Usuario, Liga, Equipo, Jugador, Partido, Gol, Jornada, Tarjeta, Sancion } = require('../models')

// GET /api/public/:username
exports.perfil = async (req, res, next) => {
  try {
    const user = await Usuario.findOne({ username: req.params.username }).select('username nombre').lean()
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const ligas = await Liga.find({ admin_id: user._id })
      .select('nombre slug estado configuracion.deporte')
      .lean()

    res.json({ admin: user, ligas })
  } catch (err) { next(err) }
}

// GET /api/public/:username/hub
exports.hub = async (req, res, next) => {
  try {
    const admin = await Usuario.findOne({ username: req.params.username }).select('username nombre').lean()
    if (!admin) return res.status(404).json({ error: 'Usuario no encontrado' })

    const ligas = await Liga.find({ admin_id: admin._id })
      .select('nombre slug estado configuracion.deporte')
      .lean()

    if (!ligas.length) return res.json({ admin, ligas: [], proximos: [], fechas_resultado: [] })

    const ligaIds = ligas.map(l => l._id)
    const ligaMap = Object.fromEntries(ligas.map(l => [l._id.toString(), { nombre: l.nombre, slug: l.slug }]))

    const today = new Date(); today.setHours(0, 0, 0, 0)

    const todasJornadas = await Jornada.find({
      liga_id: { $in: ligaIds },
      fecha: { $ne: null },
    }).select('_id liga_id numero fecha estado').lean()

    const jornadaMap = Object.fromEntries(todasJornadas.map(j => [j._id.toString(), j]))

    // Próximos: jornadas con fecha futura y no finalizadas
    const jornadaProximaIds = todasJornadas
      .filter(j => new Date(j.fecha) >= today && j.estado !== 'finalizada')
      .map(j => j._id)

    const proximosRaw = jornadaProximaIds.length
      ? await Partido.find({
          jornada_id: { $in: jornadaProximaIds },
          estado: { $in: ['pendiente', 'reprogramado'] },
          es_bye: { $ne: true },
        })
          .populate('equipo_local_id', 'nombre logo color_principal slug')
          .populate('equipo_visitante_id', 'nombre logo color_principal slug')
          .sort({ hora: 1 })
          .lean()
      : []

    const proximosMap = {}
    for (const p of proximosRaw) {
      const j = jornadaMap[p.jornada_id?.toString()]
      if (!j?.fecha) continue
      const key = new Date(j.fecha).toISOString().split('T')[0]
      if (!proximosMap[key]) proximosMap[key] = { fecha: j.fecha, partidos: [] }
      proximosMap[key].partidos.push({ ...p, jornada_numero: j.numero, liga: ligaMap[j.liga_id?.toString()] })
    }
    const proximos = Object.values(proximosMap)
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .slice(0, 12)

    // Fechas con resultados (últimas 20 jornadas finalizadas)
    const jornadasConResultado = todasJornadas
      .filter(j => j.estado === 'finalizada' || new Date(j.fecha) < today)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

    const fechasSet = []
    const seen = new Set()
    for (const j of jornadasConResultado) {
      const key = new Date(j.fecha).toISOString().split('T')[0]
      if (!seen.has(key)) { seen.add(key); fechasSet.push(key) }
      if (fechasSet.length >= 15) break
    }

    res.json({ admin, ligas, proximos, fechas_resultado: fechasSet })
  } catch (err) { next(err) }
}

// GET /api/public/:username/resultados/:fecha  (fecha = YYYY-MM-DD)
exports.resultadosFecha = async (req, res, next) => {
  try {
    const admin = await Usuario.findOne({ username: req.params.username }).select('_id').lean()
    if (!admin) return res.status(404).json({ error: 'Usuario no encontrado' })

    const ligasRaw = await Liga.find({ admin_id: admin._id }).select('_id nombre slug').lean()
    const ligaIds = ligasRaw.map(l => l._id)
    const ligaMap = Object.fromEntries(ligasRaw.map(l => [l._id.toString(), { nombre: l.nombre, slug: l.slug }]))

    const fecha = new Date(req.params.fecha)
    const fechaFin = new Date(fecha)
    fechaFin.setDate(fechaFin.getDate() + 1)

    const jornadas = await Jornada.find({
      liga_id: { $in: ligaIds },
      fecha: { $gte: fecha, $lt: fechaFin },
    }).lean()

    if (!jornadas.length) return res.json({ partidos: [] })

    const jornadaIds = jornadas.map(j => j._id)
    const jornadaMap = Object.fromEntries(jornadas.map(j => [j._id.toString(), j]))

    const partidos = await Partido.find({
      jornada_id: { $in: jornadaIds },
      estado: { $in: ['jugado', 'wo'] },
      es_bye: { $ne: true },
    })
      .populate('equipo_local_id', 'nombre logo color_principal slug')
      .populate('equipo_visitante_id', 'nombre logo color_principal slug')
      .populate('mvp_jugador_id', 'nombre foto')
      .sort({ hora: 1 })
      .lean()

    const partidoIds = partidos.map(p => p._id)
    const goles = await Gol.find({ partido_id: { $in: partidoIds }, tipo: { $ne: 'autogol' } })
      .populate('jugador_id', 'nombre')
      .populate('equipo_id', '_id')
      .lean()

    const golesMap = {}
    goles.forEach(g => {
      const pid = g.partido_id.toString()
      if (!golesMap[pid]) golesMap[pid] = []
      golesMap[pid].push(g)
    })

    const result = partidos.map(p => {
      const j = jornadaMap[p.jornada_id?.toString()]
      return { ...p, jornada_numero: j?.numero, liga: ligaMap[j?.liga_id?.toString()], goles: golesMap[p._id.toString()] || [] }
    })

    res.json({ partidos: result })
  } catch (err) { next(err) }
}

// GET /api/public/:username/:ligaSlug
exports.liga = async (req, res, next) => {
  try {
    const admin = await Usuario.findOne({ username: req.params.username }).lean()
    if (!admin) return res.status(404).json({ error: 'Usuario no encontrado' })

    const liga = await Liga.findOne({ admin_id: admin._id, slug: req.params.ligaSlug }).lean()
    if (!liga) return res.status(404).json({ error: 'Liga no encontrada' })

    const [equipos, jornadas, hasSalonFama] = await Promise.all([
      Equipo.find({ liga_id: liga._id, 'baja.activa': { $ne: true } }).select('nombre logo slug color_principal').lean(),
      Jornada.find({ liga_id: liga._id }).sort('numero').select('numero estado fecha').lean(),
      Liga.exists({ admin_id: admin._id, estado: 'finalizada' }),
    ])

    const { galeria: _g, ...ligaSin } = liga
    res.json({ liga: { ...ligaSin, galeria_count: (liga.galeria || []).length }, equipos, jornadas, admin: { username: admin.username, nombre: admin.nombre }, hasSalonFama: !!hasSalonFama })
  } catch (err) { next(err) }
}

async function loadLigaPublic(req) {
  const admin = await Usuario.findOne({ username: req.params.username }).lean()
  if (!admin) return null
  const liga = await Liga.findOne({ admin_id: admin._id, slug: req.params.ligaSlug }).lean()
  return liga
}

async function loadCtx(req) {
  const admin = await Usuario.findOne({ username: req.params.username }).lean()
  if (!admin) return null
  const liga = await Liga.findOne({ admin_id: admin._id, slug: req.params.ligaSlug }).lean()
  if (!liga) return null
  return { admin, liga }
}

// GET /api/public/:username/:ligaSlug/tabla
exports.tabla = async (req, res, next) => {
  try {
    const liga = await loadLigaPublic(req)
    if (!liga) return res.status(404).json({ error: 'No encontrado' })

    const { calcularTabla } = require('./estadisticasController')
    const [equipos, partidos] = await Promise.all([
      Equipo.find({ liga_id: liga._id }).lean(),
      Partido.find({ liga_id: liga._id, estado: { $in: ['jugado', 'wo'] } }).lean(),
    ])

    const tabla = calcularTabla(liga, equipos, partidos)
    res.json(tabla)
  } catch (err) { next(err) }
}

// GET /api/public/:username/:ligaSlug/estadisticas-defensivas
exports.estadisticasDefensivas = async (req, res, next) => {
  try {
    const liga = await loadLigaPublic(req)
    if (!liga) return res.status(404).json({ error: 'No encontrado' })

    const [equipos, partidos] = await Promise.all([
      Equipo.find({ liga_id: liga._id }).select('_id nombre').lean(),
      Partido.find({ liga_id: liga._id, estado: { $in: ['jugado', 'wo'] }, es_bye: { $ne: true } })
        .select('equipo_local_id equipo_visitante_id goles_local goles_visitante estado createdAt')
        .sort({ createdAt: -1 })
        .lean(),
    ])

    const result = equipos.map(e => {
      const eid = e._id.toString()
      const propios = partidos.filter(p =>
        p.equipo_local_id?.toString() === eid || p.equipo_visitante_id?.toString() === eid
      )
      const racha = propios.slice(0, 5).map(p => {
        if (p.estado === 'wo') return 'D'
        const esLocal = p.equipo_local_id?.toString() === eid
        const gf = esLocal ? (p.goles_local ?? 0) : (p.goles_visitante ?? 0)
        const gc = esLocal ? (p.goles_visitante ?? 0) : (p.goles_local ?? 0)
        if (gf > gc) return 'V'
        if (gf === gc) return 'E'
        return 'D'
      }).reverse()
      return { equipo_id: eid, racha }
    })

    res.json(result)
  } catch (err) { next(err) }
}

// GET /api/public/:username/:ligaSlug/goleadores
exports.goleadores = async (req, res, next) => {
  try {
    const liga = await loadLigaPublic(req)
    if (!liga) return res.status(404).json({ error: 'No encontrado' })

    const goles = await Gol.find({ tipo: { $ne: 'autogol' } })
      .populate({ path: 'partido_id', match: { liga_id: liga._id }, select: 'liga_id' })
      .populate('jugador_id', 'nombre foto equipo_id')
      .populate('equipo_id', 'nombre logo color_principal')
      .lean()

    const ranking = {}
    goles.filter(g => g.partido_id).forEach(g => {
      const id = g.jugador_id?._id?.toString()
      if (!id) return
      if (!ranking[id]) ranking[id] = { jugador: g.jugador_id, equipo: g.equipo_id, goles: 0 }
      ranking[id].goles++
    })

    res.json(Object.values(ranking).sort((a, b) => b.goles - a.goles))
  } catch (err) { next(err) }
}

// GET /api/public/:username/:ligaSlug/proximos
exports.proximos = async (req, res, next) => {
  try {
    const liga = await loadLigaPublic(req)
    if (!liga) return res.status(404).json({ error: 'No encontrado' })

    const partidos = await Partido.find({
      liga_id: liga._id,
      estado: { $in: ['pendiente', 'reprogramado'] },
      es_bye: { $ne: true },
    })
      .populate('equipo_local_id', 'nombre logo color_principal slug')
      .populate('equipo_visitante_id', 'nombre logo color_principal slug')
      .populate('jornada_id', 'numero fecha')
      .sort({ 'jornada_id.fecha': 1, hora: 1 })
      .limit(20)
      .lean()

    res.json(partidos)
  } catch (err) { next(err) }
}

// GET /api/public/:username/:ligaSlug/resultados
exports.resultados = async (req, res, next) => {
  try {
    const liga = await loadLigaPublic(req)
    if (!liga) return res.status(404).json({ error: 'No encontrado' })

    const partidos = await Partido.find({
      liga_id: liga._id,
      estado: { $in: ['jugado', 'wo'] },
      es_bye: { $ne: true },
    })
      .populate('equipo_local_id', 'nombre logo color_principal slug')
      .populate('equipo_visitante_id', 'nombre logo color_principal slug')
      .populate('jornada_id', 'numero fecha')
      .populate('mvp_jugador_id', 'nombre foto')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    res.json(partidos)
  } catch (err) { next(err) }
}

// GET /api/public/:username/:ligaSlug/jornada/:numero
exports.jornadaDetalle = async (req, res, next) => {
  try {
    const liga = await loadLigaPublic(req)
    if (!liga) return res.status(404).json({ error: 'No encontrado' })

    const jornada = await Jornada.findOne({ liga_id: liga._id, numero: Number(req.params.numero) }).lean()
    if (!jornada) return res.status(404).json({ error: 'Jornada no encontrada' })

    const partidos = await Partido.find({ jornada_id: jornada._id })
      .populate('equipo_local_id', 'nombre logo color_principal slug')
      .populate('equipo_visitante_id', 'nombre logo color_principal slug')
      .populate('mvp_jugador_id', 'nombre foto')
      .sort({ hora: 1, cancha: 1 })
      .lean()

    const partidoIds = partidos.map(p => p._id)
    const [goles, tarjetas] = await Promise.all([
      Gol.find({ partido_id: { $in: partidoIds } })
        .populate('jugador_id', 'nombre')
        .populate('equipo_id', 'nombre')
        .lean(),
      Tarjeta.find({ partido_id: { $in: partidoIds } })
        .populate('jugador_id', 'nombre')
        .populate('equipo_id', 'nombre')
        .lean(),
    ])

    const partidosConDetalle = partidos.map(p => ({
      ...p,
      goles: goles.filter(g => g.partido_id?.toString() === p._id.toString()),
      tarjetas: tarjetas.filter(t => t.partido_id?.toString() === p._id.toString()),
    }))

    res.json({ jornada, partidos: partidosConDetalle })
  } catch (err) { next(err) }
}

// GET /api/public/:username/:ligaSlug/concentrado/:numero — alias optimizado de jornadaDetalle
exports.concentrado = exports.jornadaDetalle

// GET /api/public/:username/:ligaSlug/tarjetas
exports.tarjetas = async (req, res, next) => {
  try {
    const liga = await loadLigaPublic(req)
    if (!liga) return res.status(404).json({ error: 'No encontrado' })

    const tarjetas = await Tarjeta.find()
      .populate({ path: 'partido_id', match: { liga_id: liga._id }, select: 'liga_id' })
      .populate('jugador_id', 'nombre foto')
      .populate('equipo_id', 'nombre logo color_principal')
      .lean()

    const filtradas = tarjetas.filter(t => t.partido_id)
    const ranking = {}
    filtradas.forEach(t => {
      const id = t.jugador_id?._id?.toString()
      if (!id) return
      if (!ranking[id]) ranking[id] = { jugador: t.jugador_id, equipo: t.equipo_id, amarillas: 0, rojas: 0 }
      if (t.tipo === 'amarilla') ranking[id].amarillas++
      else ranking[id].rojas++
    })

    res.json(Object.values(ranking).sort((a, b) => (b.rojas * 3 + b.amarillas) - (a.rojas * 3 + a.amarillas)))
  } catch (err) { next(err) }
}

// GET /api/public/:username/:ligaSlug/mvps
exports.mvps = async (req, res, next) => {
  try {
    const liga = await loadLigaPublic(req)
    if (!liga) return res.status(404).json({ error: 'No encontrado' })

    const partidos = await Partido.find({
      liga_id: liga._id,
      estado: 'jugado',
      mvp_jugador_id: { $ne: null },
    })
      .populate('mvp_jugador_id', 'nombre foto equipo_id')
      .populate('mvp_equipo_id', 'nombre logo color_principal')
      .lean()

    const ranking = {}
    partidos.forEach(p => {
      const id = p.mvp_jugador_id?._id?.toString()
      if (!id) return
      if (!ranking[id]) ranking[id] = { jugador: p.mvp_jugador_id, equipo: p.mvp_equipo_id, mvps: 0 }
      ranking[id].mvps++
    })

    res.json(Object.values(ranking).sort((a, b) => b.mvps - a.mvps))
  } catch (err) { next(err) }
}

// GET /api/public/:username/:ligaSlug/sanciones
exports.sanciones = async (req, res, next) => {
  try {
    const liga = await loadLigaPublic(req)
    if (!liga) return res.status(404).json({ error: 'No encontrado' })

    const sanciones = await Sancion.find({ liga_id: liga._id, activa: true })
      .populate({
        path: 'jugador_id',
        select: 'nombre foto equipo_id',
        populate: { path: 'equipo_id', select: 'nombre logo color_principal' },
      })
      .lean()

    res.json(sanciones)
  } catch (err) { next(err) }
}

// GET /api/public/:username/:ligaSlug/salon-fama
exports.salonFama = async (req, res, next) => {
  try {
    const ctx = await loadCtx(req)
    if (!ctx) return res.status(404).json({ error: 'No encontrado' })
    const { admin } = ctx

    const ligasFinalizadas = await Liga.find({ admin_id: admin._id, estado: 'finalizada' }).lean()
    if (!ligasFinalizadas.length) return res.json({ campeonatos: [], goleadores: [], mvps: [] })

    const ligaIds = ligasFinalizadas.map(l => l._id)
    const { calcularTabla } = require('./estadisticasController')

    // Campeón por liga finalizada
    const campeonatos = []
    for (const l of ligasFinalizadas) {
      const [equipos, partidos] = await Promise.all([
        Equipo.find({ liga_id: l._id }).lean(),
        Partido.find({ liga_id: l._id, estado: { $in: ['jugado', 'wo'] } }).lean(),
      ])
      if (!equipos.length) continue
      const tabla = calcularTabla(l, equipos, partidos)
      if (tabla.length) campeonatos.push({ liga: { nombre: l.nombre, slug: l.slug }, campeon: tabla[0].equipo })
    }

    // Top 5 goleadores históricos
    const golesAll = await Gol.find({ tipo: { $ne: 'autogol' } })
      .populate({ path: 'partido_id', match: { liga_id: { $in: ligaIds } }, select: 'liga_id' })
      .populate('jugador_id', 'nombre foto')
      .populate('equipo_id', 'nombre logo color_principal')
      .lean()

    const goleadoresMap = {}
    golesAll.filter(g => g.partido_id).forEach(g => {
      const id = g.jugador_id?._id?.toString()
      if (!id) return
      if (!goleadoresMap[id]) goleadoresMap[id] = { jugador: g.jugador_id, equipo: g.equipo_id, goles: 0 }
      goleadoresMap[id].goles++
    })

    // Top 5 MVPs históricos
    const partidosConMvp = await Partido.find({
      liga_id: { $in: ligaIds }, estado: 'jugado', mvp_jugador_id: { $ne: null },
    })
      .populate('mvp_jugador_id', 'nombre foto')
      .populate('mvp_equipo_id', 'nombre logo color_principal')
      .lean()

    const mvpMap = {}
    partidosConMvp.forEach(p => {
      const id = p.mvp_jugador_id?._id?.toString()
      if (!id) return
      if (!mvpMap[id]) mvpMap[id] = { jugador: p.mvp_jugador_id, equipo: p.mvp_equipo_id, mvps: 0 }
      mvpMap[id].mvps++
    })

    res.json({
      campeonatos,
      goleadores: Object.values(goleadoresMap).sort((a, b) => b.goles - a.goles).slice(0, 5),
      mvps: Object.values(mvpMap).sort((a, b) => b.mvps - a.mvps).slice(0, 5),
    })
  } catch (err) { next(err) }
}

// GET /api/public/:username/:ligaSlug/galeria
exports.galeriaPublic = async (req, res, next) => {
  try {
    const liga = await loadLigaPublic(req)
    if (!liga) return res.status(404).json({ error: 'No encontrado' })
    res.json({ galeria: liga.galeria || [] })
  } catch (err) { next(err) }
}

// GET /api/public/:username/:ligaSlug/estadisticas
exports.estadisticas = async (req, res, next) => {
  try {
    const liga = await loadLigaPublic(req)
    if (!liga) return res.status(404).json({ error: 'No encontrado' })

    const [equipos, partidos] = await Promise.all([
      Equipo.find({ liga_id: liga._id, 'baja.activa': { $ne: true } })
        .select('_id nombre logo color_principal')
        .lean(),
      Partido.find({ liga_id: liga._id, estado: { $in: ['jugado', 'wo'] }, es_bye: { $ne: true } })
        .select('equipo_local_id equipo_visitante_id goles_local goles_visitante estado')
        .lean(),
    ])

    const result = equipos.map(e => {
      const eid = e._id.toString()
      const propios = partidos.filter(p =>
        p.equipo_local_id?.toString() === eid || p.equipo_visitante_id?.toString() === eid
      )

      let GF = 0, GC = 0, PJ = 0, clean_sheets = 0
      propios.forEach(p => {
        PJ++
        if (p.estado === 'wo') return
        const esLocal = p.equipo_local_id?.toString() === eid
        const gf = esLocal ? (p.goles_local ?? 0) : (p.goles_visitante ?? 0)
        const gc = esLocal ? (p.goles_visitante ?? 0) : (p.goles_local ?? 0)
        GF += gf
        GC += gc
        if (gc === 0) clean_sheets++
      })

      return {
        equipo: { _id: e._id, nombre: e.nombre, logo: e.logo, color_principal: e.color_principal },
        GF, GC, PJ,
        clean_sheets,
        promedio: PJ > 0 ? +(GF / PJ).toFixed(2) : 0,
      }
    })

    res.json(result)
  } catch (err) { next(err) }
}

// GET /api/public/:username/:ligaSlug/reglamento
exports.reglamento = async (req, res, next) => {
  try {
    const liga = await loadLigaPublic(req)
    if (!liga) return res.status(404).json({ error: 'No encontrado' })
    res.json({ reglamento: liga.reglamento || '' })
  } catch (err) { next(err) }
}

// GET /api/public/:username/:ligaSlug/equipo/:equipoSlug
exports.equipo = async (req, res, next) => {
  try {
    const admin = await Usuario.findOne({ username: req.params.username }).lean()
    if (!admin) return res.status(404).json({ error: 'No encontrado' })
    const liga = await Liga.findOne({ admin_id: admin._id, slug: req.params.ligaSlug }).lean()
    if (!liga) return res.status(404).json({ error: 'No encontrado' })
    const equipo = await Equipo.findOne({ liga_id: liga._id, slug: req.params.equipoSlug }).lean()
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' })

    const [jugadores, partidos] = await Promise.all([
      Jugador.find({ equipo_id: equipo._id, activo: true })
        .select('nombre foto posicion numero_camiseta')
        .lean(),
      Partido.find({
        liga_id: liga._id,
        $or: [{ equipo_local_id: equipo._id }, { equipo_visitante_id: equipo._id }],
        estado: { $in: ['jugado', 'pendiente', 'wo'] },
      })
        .populate('equipo_local_id', 'nombre logo color_principal slug')
        .populate('equipo_visitante_id', 'nombre logo color_principal slug')
        .populate('jornada_id', 'numero fecha')
        .sort('createdAt')
        .lean(),
    ])

    const partidoIds = partidos.filter(p => p.estado === 'jugado' || p.estado === 'wo').map(p => p._id)
    const goles = await Gol.find({
      partido_id: { $in: partidoIds },
      equipo_id: equipo._id,
      tipo: { $ne: 'autogol' },
    }).select('jugador_id').lean()

    const golesPorJugador = {}
    goles.forEach(g => {
      const jid = g.jugador_id?.toString()
      if (jid) golesPorJugador[jid] = (golesPorJugador[jid] || 0) + 1
    })

    const jugadoresConGoles = jugadores.map(j => ({
      ...j,
      goles_temporada: golesPorJugador[j._id?.toString()] || 0,
    }))

    res.json({ equipo, jugadores: jugadoresConGoles, partidos })
  } catch (err) { next(err) }
}
