const mongoose = require('mongoose')

const golSchema = new mongoose.Schema(
  {
    partido_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partido', required: true },
    jugador_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Jugador', required: true },
    equipo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipo', required: true },
    minuto: { type: Number, default: null },
    tipo: {
      type: String,
      enum: ['normal', 'penal', 'autogol'],
      default: 'normal',
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
)

golSchema.index({ partido_id: 1 })
golSchema.index({ jugador_id: 1 })

module.exports = mongoose.model('Gol', golSchema)
