const mongoose = require('mongoose')

const ligaSchema = new mongoose.Schema(
  {
    admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombre: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    estado: {
      type: String,
      enum: ['activa', 'finalizada', 'pausada', 'archivada'],
      default: 'activa',
    },
    configuracion: {
      dias_juego: [{ type: String }],
      num_canchas: { type: Number, default: 1 },
      hora_inicio: { type: String, default: '08:00' },
      hora_fin: { type: String, default: '20:00' },
      duracion_partido: { type: Number, default: 60 },
      num_jornadas: { type: Number, default: 0 },
      max_equipos_fijos: { type: Number, default: 0 },
      cuota_inscripcion: { type: Number, default: 0 },
      costo_arbitraje: { type: Number, default: 0 },
      pago_fijo_temporada: { type: Number, default: 0 },
      tiene_liguilla: { type: Boolean, default: false },
      criterios_desempate: [{ type: String }],
    },
  },
  { timestamps: true }
)

ligaSchema.index({ slug: 1 })
ligaSchema.index({ admin_id: 1 })

module.exports = mongoose.model('Liga', ligaSchema)
