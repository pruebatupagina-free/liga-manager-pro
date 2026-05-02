const mongoose = require('mongoose')

const productoSchema = new mongoose.Schema(
  {
    vendedor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, default: null, maxlength: 500 },
    precio: { type: Number, required: true, min: 0 },
    imagen: { type: String, default: null },
    categoria: { type: String, default: null, trim: true },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
)

productoSchema.index({ vendedor_id: 1 })

module.exports = mongoose.model('Producto', productoSchema)
