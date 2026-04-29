const mongoose = require('mongoose')

const liguillaGrupoSchema = new mongoose.Schema(
  {
    liga_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true },
    numero_grupo: { type: Number, required: true },
    equipos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Equipo' }],
    campeon_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipo',
      sparse: true,
      default: null,
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
)

liguillaGrupoSchema.index({ liga_id: 1 })

module.exports = mongoose.model('LiguillaGrupo', liguillaGrupoSchema)
