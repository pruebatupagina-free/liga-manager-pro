const mongoose = require('mongoose')

const whatsappLogSchema = new mongoose.Schema(
  {
    liga_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true },
    equipo_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Equipo',
      sparse: true,
      default: null,
    },
    tipo: { type: String, required: true },
    mensaje: { type: String, required: true },
    estado: {
      type: String,
      enum: ['enviado', 'error'],
      required: true,
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
)

whatsappLogSchema.index({ liga_id: 1 })

module.exports = mongoose.model('WhatsappLog', whatsappLogSchema)
