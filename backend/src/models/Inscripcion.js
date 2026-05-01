const mongoose = require('mongoose')

const inscripcionSchema = new mongoose.Schema(
  {
    liga_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true },
    nombre_equipo: { type: String, required: true, trim: true },
    color: { type: String, default: '#22C55E' },
    nombre_capitan: { type: String, required: true, trim: true },
    whatsapp: { type: String, required: true, trim: true },
    jugadores: [
      {
        nombre: { type: String, trim: true },
        numero_camiseta: { type: Number, default: null },
        posicion: { type: String, default: null },
      },
    ],
    estado: {
      type: String,
      enum: ['pendiente', 'aprobada', 'rechazada'],
      default: 'pendiente',
    },
    notas_admin: { type: String, default: null },
    equipo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipo', default: null },
  },
  { timestamps: true }
)

inscripcionSchema.index({ liga_id: 1, estado: 1 })

module.exports = mongoose.model('Inscripcion', inscripcionSchema)
