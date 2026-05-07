const mongoose = require('mongoose')

const partidoSchema = new mongoose.Schema(
  {
    jornada_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Jornada', required: true },
    liga_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true },
    equipo_local_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipo', required: true },
    equipo_visitante_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipo', default: null },
    cancha: { type: Number, default: 1 },
    hora: { type: String, default: null },
    goles_local: { type: Number, default: null },
    goles_visitante: { type: Number, default: null },
    estado: {
      type: String,
      enum: ['pendiente', 'jugado', 'cancelado', 'wo', 'reprogramado'],
      default: 'pendiente',
    },
    tipo: {
      type: String,
      enum: ['normal', 'extra', 'revancha'],
      default: 'normal',
    },
    es_bye: { type: Boolean, default: false },
    arbitraje: {
      local: {
        monto: { type: Number, default: 0 },
        pagado: { type: Boolean, default: false },
      },
      visitante: {
        monto: { type: Number, default: 0 },
        pagado: { type: Boolean, default: false },
      },
    },
    mvp_jugador_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Jugador',
      sparse: true,
      default: null,
    },
    mvp_equipo_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipo',
      sparse: true,
      default: null,
    },
    notas: { type: String, default: null },
    token_arbitro: { type: String, default: null, index: true, sparse: true },
    arbitro_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
)

partidoSchema.index({ liga_id: 1 })
partidoSchema.index({ jornada_id: 1 })
partidoSchema.index({ liga_id: 1, estado: 1 })

module.exports = mongoose.model('Partido', partidoSchema)
