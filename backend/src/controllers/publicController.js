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

// GET /api/public/:username/:ligaSlug
exports.liga = async (req, res, next) => {
  try {
    const admin = await Usuario.findOne({ username: req.params.username }).lean()
    if (!admin) return res.status(404).json({ error: 'Usuario no encontrado' })

    const liga = await Liga.findOne({ admin_id: admin._id, slug: req.params.ligaSlug }).lean()
    if (!liga) return res.status(404).json({ error: 'Liga no encontrada' })

    const [equipos, jornadas] = await Promise.all([
      Equipo.find({ liga_id: liga._id, 'baja.activa': { $ne: true } }).select('nombre logo slug color_principal').lean(),
      Jornada.find({ liga_id: liga._id }).sort('numero').select('numero estado fecha').lean(),
    ])

    res.json({ liga, equipos, jornadas, admin: { username: admin.username, nombre: admin.nombre } })
  } catch (err) { next(err) }
}

async function loadLigaPublic(req) {
  const admin = await Usuario.findOne({ username: req.params.username }).lean()
  if (!admin) return null
  const liga = await Liga.findOne({ admin_id: admin._id, slug: req.params.ligaSlug }).lean()
  return liga
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

// GET /api/public/:username/:ligaSlug/equipo/:equipoSlug
exports.equipo = async (req, res, next) => {
  try {
    const admin = await Usuario.findOne({ username: req.params.username }).lean()
    if (!admin) return res.status(404).json({ error: 'No encontrado' })
    const liga = await Liga.findOne({ admin_id: admin._id, slug: req.params.ligaSlug }).lean()
    if (!liga) return res.status(404).json({ error: 'No encontrado' })
    const equipo = await Equipo.findOne({ liga_id: liga._id, slug: req.params.equipoSlug }).lean()
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' })

    const jugadores = await Jugador.find({ equipo_id: equipo._id, activo: true })
      .select('nombre foto posicion numero_camiseta')
      .lean()

    const partidos = await Partido.find({
      liga_id: liga._id,
      $or: [{ equipo_local_id: equipo._id }, { equipo_visitante_id: equipo._id }],
      estado: { $in: ['jugado', 'pendiente', 'wo'] },
    })
      .populate('equipo_local_id', 'nombre logo color_principal slug')
      .populate('equipo_visitante_id', 'nombre logo color_principal slug')
      .populate('jornada_id', 'numero fecha')
      .sort('createdAt')
      .lean()

    res.json({ equipo, jugadores, partidos })
  } catch (err) { next(err) }
}
