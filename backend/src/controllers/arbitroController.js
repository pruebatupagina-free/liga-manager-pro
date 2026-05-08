const crypto = require('crypto')
const { Partido, Gol, Tarjeta, Jugador, Liga } = require('../models')
const calcularMVP = require('../utils/calcularMVP')
const { sendPush } = require('../utils/push')

function recalcScore(goles, localId) {
  const localStr = localId.toString()
  let local = 0, visitante = 0
  for (const g of goles) {
    const esLocal = g.equipo_id.toString() === localStr
    if (g.tipo === 'autogol') {
      esLocal ? visitante++ : local++
    } else {
      esLocal ? local++ : visitante++
    }
  }
  return { goles_local: local, goles_visitante: visitante }
}

async function getPartidoByToken(token) {
  return Partido.findOne({ token_arbitro: token })
    .populate('equipo_local_id', 'nombre logo color_principal')
    .populate('equipo_visitante_id', 'nombre logo color_principal')
    .populate('jornada_id', 'numero fecha')
    .lean()
}

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

// POST /api/partidos/:id/generar-token
exports.generarToken = async (req, res, next) => {
  try {
    const partido = await Partido.findById(req.params.id)
    if (!partido) return res.status(404).json({ error: 'Partido no encontrado' })

    if (req.user.rol === 'arbitro' && partido.arbitro_id?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Sin acceso a este partido' })
    }

    // Reuse existing token if match is already in progress
    if (partido.estado === 'en_curso' && partido.token_arbitro) {
      return res.json({ token: partido.token_arbitro })
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

    const [jugadoresLocal, jugadoresVisitante, goles, tarjetas] = await Promise.all([
      Jugador.find({ equipo_id: partido.equipo_local_id._id, activo: true })
        .select('nombre numero_camiseta posicion foto').lean(),
      Jugador.find({ equipo_id: partido.equipo_visitante_id._id, activo: true })
        .select('nombre numero_camiseta posicion foto').lean(),
      Gol.find({ partido_id: partido._id }).populate('jugador_id', 'nombre').lean(),
      Tarjeta.find({ partido_id: partido._id }).populate('jugador_id', 'nombre').lean(),
    ])

    res.json({ partido, jugadoresLocal, jugadoresVisitante, goles, tarjetas })
  } catch (err) { next(err) }
}

// PUT /api/arbitro/:token/iniciar
exports.iniciarPartido = async (req, res, next) => {
  try {
    const doc = await Partido.findOne({ token_arbitro: req.params.token })
    if (!doc) return res.status(404).json({ error: 'Enlace inválido o expirado' })
    if (doc.estado !== 'pendiente') return res.status(400).json({ error: `Partido ya está ${doc.estado}` })
    doc.estado = 'en_curso'
    doc.goles_local = 0
    doc.goles_visitante = 0
    await doc.save()
    res.json({ ok: true })
  } catch (err) { next(err) }
}

// POST /api/arbitro/:token/gol
exports.addGol = async (req, res, next) => {
  try {
    const doc = await Partido.findOne({ token_arbitro: req.params.token })
    if (!doc) return res.status(404).json({ error: 'Enlace inválido o expirado' })
    if (doc.estado !== 'en_curso') return res.status(400).json({ error: 'El partido no está en curso' })

    const { jugador_id, equipo_id, minuto, tipo = 'normal' } = req.body
    const gol = await Gol.create({
      partido_id: doc._id,
      jugador_id: jugador_id || null,
      equipo_id,
      minuto: minuto != null && minuto !== '' ? Number(minuto) : null,
      tipo,
    })

    const goles = await Gol.find({ partido_id: doc._id }).lean()
    const score = recalcScore(goles, doc.equipo_local_id)
    doc.goles_local = score.goles_local
    doc.goles_visitante = score.goles_visitante
    await doc.save()

    res.json({ ok: true, gol, ...score })
  } catch (err) { next(err) }
}

// DELETE /api/arbitro/:token/gol/:golId
exports.removeGol = async (req, res, next) => {
  try {
    const doc = await Partido.findOne({ token_arbitro: req.params.token })
    if (!doc) return res.status(404).json({ error: 'Enlace inválido o expirado' })

    await Gol.findByIdAndDelete(req.params.golId)

    const goles = await Gol.find({ partido_id: doc._id }).lean()
    const score = recalcScore(goles, doc.equipo_local_id)
    doc.goles_local = score.goles_local
    doc.goles_visitante = score.goles_visitante
    await doc.save()

    res.json({ ok: true, ...score })
  } catch (err) { next(err) }
}

// POST /api/arbitro/:token/tarjeta
exports.addTarjeta = async (req, res, next) => {
  try {
    const doc = await Partido.findOne({ token_arbitro: req.params.token })
    if (!doc) return res.status(404).json({ error: 'Enlace inválido o expirado' })
    if (doc.estado !== 'en_curso') return res.status(400).json({ error: 'El partido no está en curso' })

    const { jugador_id, equipo_id, tipo, minuto } = req.body
    const tarjeta = await Tarjeta.create({
      partido_id: doc._id,
      jugador_id,
      equipo_id,
      tipo,
      minuto: minuto != null && minuto !== '' ? Number(minuto) : null,
    })

    res.json({ ok: true, tarjeta })
  } catch (err) { next(err) }
}

// DELETE /api/arbitro/:token/tarjeta/:tarjetaId
exports.removeTarjeta = async (req, res, next) => {
  try {
    const doc = await Partido.findOne({ token_arbitro: req.params.token })
    if (!doc) return res.status(404).json({ error: 'Enlace inválido o expirado' })

    await Tarjeta.findByIdAndDelete(req.params.tarjetaId)
    res.json({ ok: true })
  } catch (err) { next(err) }
}

// PUT /api/arbitro/:token/finalizar
exports.finalizarPartido = async (req, res, next) => {
  try {
    const doc = await Partido.findOne({ token_arbitro: req.params.token })
    if (!doc) return res.status(404).json({ error: 'Enlace inválido o expirado' })
    if (doc.estado !== 'en_curso') {
      return res.status(400).json({ error: `Partido no está en curso (estado: ${doc.estado})` })
    }

    const { mvp_jugador_id } = req.body

    const golDocs = await Gol.find({ partido_id: doc._id }).lean()
    const [jugLocal, jugVisit] = await Promise.all([
      Jugador.find({ equipo_id: doc.equipo_local_id }).select('_id').lean(),
      Jugador.find({ equipo_id: doc.equipo_visitante_id }).select('_id').lean(),
    ])

    const mvpId = mvp_jugador_id || calcularMVP(
      doc.toObject(),
      golDocs,
      jugLocal.map(j => j._id),
      jugVisit.map(j => j._id)
    )

    doc.estado = 'jugado'
    doc.mvp_jugador_id = mvpId || null
    await doc.save()

    ;(async () => {
      try {
        const liga = await Liga.findById(doc.liga_id).select('admin_id nombre').lean()
        if (liga?.admin_id) {
          await sendPush(liga.admin_id, {
            title: `Resultado — ${liga.nombre}`,
            body: `Partido finalizado: ${doc.goles_local} - ${doc.goles_visitante}`,
            url: '/liga-manager-pro/dashboard',
            tag: `resultado-${doc._id}`,
          })
        }
      } catch (_) {}
    })()

    res.json({ ok: true })
  } catch (err) { next(err) }
}

// GET /api/arbitro/:token/live — public polling endpoint for spectators
exports.getLive = async (req, res, next) => {
  try {
    const partido = await Partido.findOne({ token_arbitro: req.params.token })
      .populate('equipo_local_id', 'nombre logo color_principal')
      .populate('equipo_visitante_id', 'nombre logo color_principal')
      .populate('jornada_id', 'numero')
      .lean()

    if (!partido) return res.status(404).json({ error: 'No encontrado' })

    const [goles, tarjetas] = await Promise.all([
      Gol.find({ partido_id: partido._id }).populate('jugador_id', 'nombre').lean(),
      Tarjeta.find({ partido_id: partido._id }).populate('jugador_id', 'nombre').lean(),
    ])

    res.json({ partido, goles, tarjetas })
  } catch (err) { next(err) }
}

// PUT /api/arbitro/:token/resultado — legacy batch entry (kept for backward compat)
exports.guardarResultado = async (req, res, next) => {
  try {
    const doc = await Partido.findOne({ token_arbitro: req.params.token })
    if (!doc) return res.status(404).json({ error: 'Enlace inválido o expirado' })
    if (doc.es_bye) return res.status(400).json({ error: 'Partido BYE no tiene resultado' })
    if (!['pendiente', 'en_curso'].includes(doc.estado)) {
      return res.status(400).json({ error: 'Resultado ya registrado' })
    }

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
