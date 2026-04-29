const mongoose = require('mongoose')

const jornadaSchema = new mongoose.Schema(
  {
    liga_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true },
    numero: { type: Number, required: true },
    fecha: { type: Date, default: null },
    hora_inicio: { type: String, default: null },
    notas: { type: String, default: null },
    estado: {
      type: String,
      enum: ['pendiente', 'en_curso', 'finalizada'],
      default: 'pendiente',
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
)

jornadaSchema.index({ liga_id: 1 })
jornadaSchema.index({ liga_id: 1, numero: 1 })

module.exports = mongoose.model('Jornada', jornadaSchema)
