const { Liga, Jornada, Partido, Equipo } = require('../models')
const { enviarMensaje, mensajeJornada, mensajeBye, mensajeCobro } = require('../utils/whatsapp')

async function verificarAdmin(ligaId, user) {
  const liga = await Liga.findById(ligaId).lean()
  if (!liga) return null
  if (user.rol === 'superadmin') return liga
  if (liga.admin_id.toString() === user.id) return liga
  return null
}

// POST /api/whatsapp/enviar
exports.enviar = async (req, res, next) => {
  try {
    const { liga_id, telefono, mensaje, equipo_id, tipo } = req.body
    if (!liga_id || !telefono || !mensaje) return res.status(400).json({ error: 'liga_id, telefono y mensaje requeridos' })
    const liga = await verificarAdmin(liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    const log = await enviarMensaje(telefono, mensaje, liga_id, equipo_id || null, tipo || 'manual')
    res.json(log)
  } catch (err) { next(err) }
}

// POST /api/whatsapp/jornada  { liga_id, jornada_id }
exports.jornada = async (req, res, next) => {
  try {
    const { liga_id, jornada_id } = req.body
    if (!liga_id || !jornada_id) return res.status(400).json({ error: 'liga_id y jornada_id requeridos' })
    const liga = await verificarAdmin(liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    const jornada = await Jornada.findById(jornada_id).lean()
    if (!jornada) return res.status(404).json({ error: 'Jornada no encontrada' })

    const partidos = await Partido.find({ jornada_id, es_bye: false })
      .populate('equipo_local_id', 'nombre telefono_contacto')
      .populate('equipo_visitante_id', 'nombre telefono_contacto')
      .lean()

    const resultados = []
    for (const p of partidos) {
      for (const lado of ['equipo_local_id', 'equipo_visitante_id']) {
        const equipo = p[lado]
        if (equipo?.telefono_contacto) {
          const texto = mensajeJornada(jornada, p, equipo._id.toString() === p.equipo_local_id._id?.toString())
          const log = await enviarMensaje(equipo.telefono_contacto, texto, liga_id, equipo._id, 'jornada')
          resultados.push({ equipo: equipo.nombre, estado: log.estado })
        }
      }
    }

    res.json({ enviados: resultados.length, detalle: resultados })
  } catch (err) { next(err) }
}

// POST /api/whatsapp/bye  { liga_id, partido_id }
exports.bye = async (req, res, next) => {
  try {
    const { liga_id, partido_id } = req.body
    if (!liga_id || !partido_id) return res.status(400).json({ error: 'liga_id y partido_id requeridos' })
    const liga = await verificarAdmin(liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    const partido = await Partido.findById(partido_id)
      .populate('equipo_local_id', 'nombre telefono_contacto')
      .populate('jornada_id', 'numero')
      .lean()
    if (!partido || !partido.es_bye) return res.status(400).json({ error: 'Partido BYE no encontrado' })

    const equipo = partido.equipo_local_id
    if (!equipo?.telefono_contacto) return res.status(400).json({ error: 'El equipo no tiene teléfono de contacto' })

    const texto = mensajeBye(partido.jornada_id, equipo)
    const log = await enviarMensaje(equipo.telefono_contacto, texto, liga_id, equipo._id, 'bye')
    res.json(log)
  } catch (err) { next(err) }
}

// POST /api/whatsapp/cobro  { liga_id, equipo_id }
exports.cobro = async (req, res, next) => {
  try {
    const { liga_id, equipo_id } = req.body
    if (!liga_id || !equipo_id) return res.status(400).json({ error: 'liga_id y equipo_id requeridos' })
    const liga = await verificarAdmin(liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    const equipo = await Equipo.findById(equipo_id).lean()
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' })
    if (!equipo.telefono_contacto) return res.status(400).json({ error: 'El equipo no tiene teléfono de contacto' })

    const calcularPagos = require('../utils/calcularPagos')
    const partidos = await Partido.find({ liga_id, estado: { $ne: 'cancelado' } }).lean()
    const cobros = calcularPagos(equipo, liga, partidos)

    if (cobros.total_deuda <= 0) return res.status(400).json({ error: 'El equipo no tiene deuda pendiente' })

    const texto = mensajeCobro(equipo, cobros)
    const log = await enviarMensaje(equipo.telefono_contacto, texto, liga_id, equipo._id, 'cobro')
    res.json(log)
  } catch (err) { next(err) }
}
