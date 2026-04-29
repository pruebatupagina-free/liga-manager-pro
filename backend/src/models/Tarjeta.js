const mongoose = require('mongoose')

const tarjetaSchema = new mongoose.Schema(
  {
    partido_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Partido', required: true },
    jugador_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Jugador', required: true },
    equipo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipo', required: true },
    tipo: {
      type: String,
      enum: ['amarilla', 'roja'],
      required: true,
    },
    minuto: { type: Number, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
)

tarjetaSchema.index({ partido_id: 1 })
tarjetaSchema.index({ jugador_id: 1 })

module.exports = mongoose.model('Tarjeta', tarjetaSchema)
