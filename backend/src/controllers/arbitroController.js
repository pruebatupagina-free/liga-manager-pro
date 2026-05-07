const crypto = require('crypto')
const { Partido, Gol, Jugador, Jornada, Liga } = require('../models')
const calcularMVP = require('../utils/calcularMVP')
const { sendPush } = require('../utils/push')

// GET /api/arbitro/mis-partidos  (auth: arbitro)
exports.getMisPartidos = async (req, res, next) => {
  try {
    const partidos = await Partido.find({ arbitro_id: req.user.id })
      .populate('equipo_local_id', 'nombre logo color_principal')
      .populate('equipo_visitante_id', 'nombre logo color_principal')
      .populate('jornada_id', 'numero fecha')
      .populate('liga_id', 'nombre slug')
      .sort({ createdAt: -1 })
      .lean()
    res.json(partidos)
  } catch (err) { next(err) }
}

async function getPartidoByToken(token) {
  return Partido.findOne({ token_arbitro: token })
    .populate('equipo_local_id', 'nombre logo color_principal')
    .populate('equipo_visitante_id', 'nombre logo color_principal')
    .populate('jornada_id', 'numero fecha')
    .lean()
}

// POST /api/partidos/:id/generar-token
exports.generarToken = async (req, res, next) => {
  try {
    const partido = await Partido.findById(req.params.id)
    if (!partido) return res.status(404).json({ error: 'Partido no encontrado' })

    if (req.user.rol === 'arbitro' && partido.arbitro_id?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Sin acceso a este partido' })
    }

    partido.token_arbitro = crypto.randomBytes(8).toString('hex')
    await partido.save()
    res.json({ token: partido.token_arbitro })
  } catch (err) { next(err) }
}

// GET /api/arbitro/:token
exports.getPartido = async (req, res, next) => {
  try {
    const partido = await getPartidoByToken(req.params.token)
    if (!partido) return res.status(404).json({ error: 'Enlace inválido o expirado' })

    const [jugadoresLocal, jugadoresVisitante, golesExistentes] = await Promise.all([
      Jugador.find({ equipo_id: partido.equipo_local_id._id, activo: true }).select('nombre numero_camiseta posicion foto').lean(),
      Jugador.find({ equipo_id: partido.equipo_visitante_id._id, activo: true }).select('nombre numero_camiseta posicion foto').lean(),
      Gol.find({ partido_id: partido._id }).populate('jugador_id', 'nombre').lean(),
    ])

    res.json({ partido, jugadoresLocal, jugadoresVisitante, goles: golesExistentes })
  } catch (err) { next(err) }
}

// PUT /api/arbitro/:token/resultado
exports.guardarResultado = async (req, res, next) => {
  try {
    const doc = await Partido.findOne({ token_arbitro: req.params.token })
    if (!doc) return res.status(404).json({ error: 'Enlace inválido o expirado' })
    if (doc.es_bye) return res.status(400).json({ error: 'Partido BYE no tiene resultado' })

    const { goles_local, goles_visitante, goles = [], mvp_jugador_id } = req.body

    await Gol.deleteMany({ partido_id: doc._id })
    if (goles.length) {
      await Gol.insertMany(goles.map(g => ({ ...g, partido_id: doc._id })))
    }

    const golDocs = await Gol.find({ partido_id: doc._id }).lean()
    const jugLocal = await Jugador.find({ equipo_id: doc.equipo_local_id }).select('_id').lean()
    const jugVisit = await Jugador.find({ equipo_id: doc.equipo_visitante_id }).select('_id').lean()

    const mvpId = mvp_jugador_id || calcularMVP(
      { ...doc.toObject(), goles_local, goles_visitante },
      golDocs,
      jugLocal.map(j => j._id),
      jugVisit.map(j => j._id)
    )

    doc.goles_local = goles_local
    doc.goles_visitante = goles_visitante
    doc.estado = 'jugado'
    doc.mvp_jugador_id = mvpId || null
    await doc.save()

    // Push al admin de la liga (fire-and-forget)
    ;(async () => {
      try {
        const liga = await Liga.findById(doc.liga_id).select('admin_id nombre').lean()
        if (liga?.admin_id) {
          await sendPush(liga.admin_id, {
            title: `Resultado capturado — ${liga.nombre}`,
            body: `${doc.equipo_local_id} ${goles_local} - ${goles_visitante} ${doc.equipo_visitante_id}`,
            url: '/liga-manager-pro/dashboard',
            tag: `resultado-${doc._id}`,
          })
        }
      } catch (_) {}
    })()

    res.json({ ok: true })
  } catch (err) { next(err) }
}
