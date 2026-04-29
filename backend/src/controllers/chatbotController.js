const { Liga, Equipo, Jornada, Usuario } = require('../models')

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

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

    const hoy = new Date().toDateString()
    const mensajesHoy = user.chat_mensajes_hoy?.fecha?.toDateString?.() === hoy
      ? (user.chat_mensajes_hoy?.count ?? 0)
      : 0
    if (mensajesHoy >= 30) {
      return res.status(429).json({ error: 'Límite de 30 mensajes diarios alcanzado. Reinicia mañana.' })
    }

    const sistema = await construirContexto(liga_id)
    if (!sistema) return res.status(404).json({ error: 'Liga no encontrada' })

    const contents = []
    if (Array.isArray(historial)) {
      historial.slice(-10).forEach(m => {
        if (m.role === 'user' || m.role === 'assistant') {
          const role = m.role === 'assistant' ? 'model' : 'user'
          contents.push({ role, parts: [{ text: String(m.content).slice(0, 500) }] })
        }
      })
    }
    contents.push({ role: 'user', parts: [{ text: mensaje.slice(0, 1000) }] })

    const apiKey = process.env.GEMINI_API_KEY
    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: sistema }] },
        contents,
        generationConfig: { maxOutputTokens: 512 },
      }),
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      return res.status(502).json({ error: 'Error al contactar Gemini', detalle: errText })
    }

    const data = await geminiRes.json()
    const respuesta = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude procesar tu mensaje.'

    user.chat_mensajes_hoy = { count: mensajesHoy + 1, fecha: new Date() }
    await user.save()

    res.json({ respuesta, mensajes_hoy: mensajesHoy + 1, limite: 30 })
  } catch (err) { next(err) }
}
