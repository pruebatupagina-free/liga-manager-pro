const mongoose = require('mongoose')

const sancionSchema = new mongoose.Schema(
  {
    jugador_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Jugador', required: true },
    liga_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true },
    motivo: { type: String, required: true, trim: true },
    jornadas_suspension: { type: Number, required: true, min: 1 },
    jornada_inicio: { type: Number, required: true },
    activa: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
)

sancionSchema.index({ jugador_id: 1 })
sancionSchema.index({ liga_id: 1, activa: 1 })

module.exports = mongoose.model('Sancion', sancionSchema)
