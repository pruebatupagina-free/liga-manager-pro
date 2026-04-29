const mongoose = require('mongoose')

const liguillaPartidoSchema = new mongoose.Schema(
  {
    grupo_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LiguillaGrupo', required: true },
    liga_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true },
    fase: {
      type: String,
      enum: ['cuartos', 'semis', 'final'],
      required: true,
    },
    equipo_local_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipo', required: true },
    equipo_visitante_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipo', required: true },
    goles_local: { type: Number, default: null },
    goles_visitante: { type: Number, default: null },
    penales_local: { type: Number, default: null },
    penales_visitante: { type: Number, default: null },
    ganador_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipo',
      sparse: true,
      default: null,
    },
    es_bye: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
)

liguillaPartidoSchema.index({ liga_id: 1 })
liguillaPartidoSchema.index({ grupo_id: 1 })

module.exports = mongoose.model('LiguillaPartido', liguillaPartidoSchema)
