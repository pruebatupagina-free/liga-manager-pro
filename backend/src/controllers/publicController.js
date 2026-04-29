const { Usuario, Liga, Equipo, Jugador, Partido, Gol, Jornada } = require('../models')

// GET /api/public/:username
exports.perfil = async (req, res, next) => {
  try {
    const user = await Usuario.findOne({ username: req.params.username }).select('username nombre').lean()
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const ligas = await Liga.find({ admin_id: user._id })
      .select('nombre slug descripcion logo configuracion.deporte')
      .lean()

    res.json({ admin: user, ligas })
  } catch (err) { next(err) }
}

// GET /api/public/:username/:ligaSlug
exports.liga = async (req, res, next) => {
  try {
    const admin = await Usuario.findOne({ username: req.params.username }).lean()
    if (!admin) return res.status(404).json({ error: 'Usuario no encontrado' })

    const liga = await Liga.findOne({ admin_id: admin._id, slug: req.params.ligaSlug })
      .select('-configuracion.cuotas')
      .lean()
    if (!liga) return res.status(404).json({ error: 'Liga no encontrada' })

    const [equipos, jornadas] = await Promise.all([
      Equipo.find({ liga_id: liga._id, 'baja.activa': { $ne: true } }).select('nombre logo slug').lean(),
      Jornada.find({ liga_id: liga._id }).sort('numero').select('numero estado fecha').lean(),
    ])

    res.json({ liga, equipos, jornadas })
  } catch (err) { next(err) }
}

// GET /api/public/:username/:ligaSlug/tabla
exports.tabla = async (req, res, next) => {
  try {
    const admin = await Usuario.findOne({ username: req.params.username }).lean()
    if (!admin) return res.status(404).json({ error: 'No encontrado' })
    const liga = await Liga.findOne({ admin_id: admin._id, slug: req.params.ligaSlug }).lean()
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
    const admin = await Usuario.findOne({ username: req.params.username }).lean()
    if (!admin) return res.status(404).json({ error: 'No encontrado' })
    const liga = await Liga.findOne({ admin_id: admin._id, slug: req.params.ligaSlug }).lean()
    if (!liga) return res.status(404).json({ error: 'No encontrado' })

    const goles = await Gol.find({ tipo: { $ne: 'autogol' } })
      .populate({ path: 'partido_id', match: { liga_id: liga._id }, select: 'liga_id' })
      .populate('jugador_id', 'nombre foto equipo_id')
      .populate('equipo_id', 'nombre')
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
      estado: { $in: ['jugado', 'programado', 'wo'] },
    })
      .populate('equipo_local_id', 'nombre logo')
      .populate('equipo_visitante_id', 'nombre logo')
      .populate('jornada_id', 'numero')
      .sort('fecha')
      .lean()

    res.json({ equipo, jugadores, partidos })
  } catch (err) { next(err) }
}
