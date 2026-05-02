const { Conversacion, Mensaje, Equipo, Usuario } = require('../models')

// Determine caller type from role
function tipoFromRol(rol) {
  return rol === 'vendedor' ? 'vendedor' : 'equipo'
}

// GET /api/mensajes/conversaciones
// Returns all conversations for the current user (vendor or equipo owner)
exports.conversaciones = async (req, res, next) => {
  try {
    const query = req.user.rol === 'vendedor'
      ? { vendedor_id: req.user.id }
      : {}

    if (req.user.rol === 'dueno_equipo') {
      const equipo = await Equipo.findOne({ dueno_id: req.user.id }).select('_id').lean()
      if (!equipo) return res.json({ conversaciones: [] })
      query.equipo_id = equipo._id
    }

    const convs = await Conversacion.find(query)
      .populate('equipo_id', 'nombre logo color_principal')
      .populate('vendedor_id', 'nombre negocio')
      .sort('-fecha_ultimo')
      .lean()

    res.json({ conversaciones: convs })
  } catch (err) { next(err) }
}

// GET /api/mensajes/:conversacion_id
// Returns messages in a conversation (with read receipt update)
exports.getMensajes = async (req, res, next) => {
  try {
    const conv = await Conversacion.findById(req.params.conversacion_id).lean()
    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' })

    const tipo = tipoFromRol(req.user.rol)

    // Mark messages as read
    await Mensaje.updateMany(
      { conversacion_id: conv._id, autor_tipo: tipo === 'equipo' ? 'vendedor' : 'equipo', leido: false },
      { leido: true }
    )

    // Reset unread counter
    const update = tipo === 'equipo'
      ? { no_leidos_equipo: 0 }
      : { no_leidos_vendedor: 0 }
    await Conversacion.findByIdAndUpdate(conv._id, update)

    const mensajes = await Mensaje.find({ conversacion_id: conv._id })
      .sort('createdAt')
      .lean()

    res.json({ mensajes })
  } catch (err) { next(err) }
}

// POST /api/mensajes/:vendedor_id  (equipo owner starts or continues conversation)
// POST /api/mensajes/conv/:conversacion_id  (reply in existing conv)
exports.enviar = async (req, res, next) => {
  try {
    const { texto, liga_id, vendedor_id, conversacion_id } = req.body
    if (!texto?.trim()) return res.status(400).json({ error: 'Texto requerido' })

    const tipo = tipoFromRol(req.user.rol)
    let conv

    if (conversacion_id) {
      conv = await Conversacion.findById(conversacion_id)
      if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' })
    } else {
      // Create or find conversation
      if (!liga_id || !vendedor_id) {
        return res.status(400).json({ error: 'liga_id y vendedor_id requeridos para nueva conversación' })
      }
      const equipo = await Equipo.findOne({ dueno_id: req.user.id, liga_id }).select('_id').lean()
      if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' })

      conv = await Conversacion.findOneAndUpdate(
        { equipo_id: equipo._id, vendedor_id },
        {
          $setOnInsert: { liga_id, equipo_id: equipo._id, vendedor_id },
        },
        { upsert: true, new: true }
      )
    }

    const mensaje = await Mensaje.create({
      conversacion_id: conv._id,
      autor_id: req.user.id,
      autor_tipo: tipo,
      texto: texto.trim(),
    })

    // Update conversation summary
    const unreadUpdate = tipo === 'equipo'
      ? { $inc: { no_leidos_vendedor: 1 } }
      : { $inc: { no_leidos_equipo: 1 } }
    await Conversacion.findByIdAndUpdate(conv._id, {
      ultimo_mensaje: texto.trim().slice(0, 80),
      fecha_ultimo: new Date(),
      ...unreadUpdate,
    })

    res.status(201).json({ mensaje, conversacion_id: conv._id })
  } catch (err) { next(err) }
}
