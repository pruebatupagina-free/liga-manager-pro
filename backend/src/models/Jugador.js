const mongoose = require('mongoose')

const jugadorSchema = new mongoose.Schema(
  {
    equipo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipo', required: true },
    nombre: { type: String, required: true, trim: true },
    numero_camiseta: { type: Number, default: null },
    posicion: {
      type: String,
      enum: ['Portero', 'Defensa', 'Mediocampista', 'Delantero'],
      default: null,
    },
    foto: { type: String, default: null },
    activo: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
)

jugadorSchema.index({ equipo_id: 1 })

module.exports = mongoose.model('Jugador', jugadorSchema)
