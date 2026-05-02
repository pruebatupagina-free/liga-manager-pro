const mongoose = require('mongoose')

const mensajeSchema = new mongoose.Schema(
  {
    conversacion_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversacion', required: true },
    autor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    autor_tipo: { type: String, enum: ['equipo', 'vendedor'], required: true },
    texto: { type: String, required: true, maxlength: 1000 },
    leido: { type: Boolean, default: false },
  },
  { timestamps: true }
)

mensajeSchema.index({ conversacion_id: 1, createdAt: 1 })

module.exports = mongoose.model('Mensaje', mensajeSchema)
