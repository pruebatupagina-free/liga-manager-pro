const mongoose = require('mongoose')

const conversacionSchema = new mongoose.Schema(
  {
    liga_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true },
    equipo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipo', required: true },
    vendedor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    ultimo_mensaje: { type: String, default: null },
    fecha_ultimo: { type: Date, default: null },
    no_leidos_equipo: { type: Number, default: 0 },
    no_leidos_vendedor: { type: Number, default: 0 },
  },
  { timestamps: true }
)

conversacionSchema.index({ equipo_id: 1, vendedor_id: 1 }, { unique: true })
conversacionSchema.index({ liga_id: 1 })

module.exports = mongoose.model('Conversacion', conversacionSchema)
