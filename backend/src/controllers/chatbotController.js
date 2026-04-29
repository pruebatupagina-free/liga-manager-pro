const Anthropic = require('@anthropic-ai/sdk')
const { Liga, Equipo, Jornada, Partido, Usuario } = require('../models')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function construirContexto(ligaId) {
  const [liga, equipos, jornadas] = await Promise.all([
    Liga.findById(ligaId).lean(),
    Equipo.find({ liga_id: ligaId, 'baja.activa': { $ne: true } }).select('nombre').lean(),
    Jornada.find({ liga_id: ligaId }).sort('numero').lean(),
  ])
  if (!liga) return null

  const jornadaActual = jornadas.findLast(j => j.estado === 'en_curso') || jornadas.findLast(j => j.estado === 'jugada')
  const proxima = jornadas.find(j => j.estado === 'programada')

  let ctx = `Eres el asistente virtual de la liga de fútbol "${liga.nombre}".`
  ctx += ` Hay ${equipos.length} equipos participantes: ${equipos.map(e => e.nombre).join(', ')}.`
  ctx += ` Total de jornadas: ${jornadas.length}.`
  if (jornadaActual) ctx += ` Jornada actual: ${jornadaActual.numero}.`
  if (proxima) ctx += ` Próxima jornada: ${proxima.numero}.`
  ctx += ' Responde en español, de forma amigable y concisa. Solo proporciona información relevante a esta liga.'

  return ctx
}

// POST /api/chatbot/mensaje
exports.mensaje = async (req, res, next) => {
  try {
    const { liga_id, mensaje, historial } = req.body
    if (!liga_id || !mensaje) return res.status(400).json({ error: 'liga_id y mensaje requeridos' })
    if (!mensaje.trim()) return res.status(400).json({ error: 'Mensaje vacío' })

    const user = await Usuario.findById(req.user.id)
    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' })

    if (user.chat_mensajes_hoy >= 30) {
      return res.status(429).json({ error: 'Límite de 30 mensajes diarios alcanzado. Reinicia mañana.' })
    }

    const sistema = await construirContexto(liga_id)
    if (!sistema) return res.status(404).json({ error: 'Liga no encontrada' })

    const messages = []
    if (Array.isArray(historial)) {
      historial.slice(-10).forEach(m => {
        if (m.role === 'user' || m.role === 'assistant') {
          messages.push({ role: m.role, content: String(m.content).slice(0, 500) })
        }
      })
    }
    messages.push({ role: 'user', content: mensaje.slice(0, 1000) })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: sistema,
      messages,
    })

    const respuesta = response.content[0]?.text || 'No pude procesar tu mensaje.'

    user.chat_mensajes_hoy = (user.chat_mensajes_hoy || 0) + 1
    await user.save()

    res.json({ respuesta, mensajes_hoy: user.chat_mensajes_hoy, limite: 30 })
  } catch (err) { next(err) }
}
