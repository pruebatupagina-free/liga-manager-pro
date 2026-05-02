const mongoose = require('mongoose')

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    rol: {
      type: String,
      enum: ['superadmin', 'admin_liga', 'dueno_equipo', 'vendedor'],
      required: true,
    },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    foto: { type: String, default: null },
    telefono: { type: String, default: null },
    negocio: {
      nombre:      { type: String, default: null },
      descripcion: { type: String, default: null },
      logo:        { type: String, default: null },
      categoria:   { type: String, default: null },
      whatsapp:    { type: String, default: null },
    },
    ligas_asignadas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Liga' }],
    licencia: {
      plan: { type: String, enum: ['basico', 'pro', 'elite'], default: 'basico' },
      estado: {
        type: String,
        enum: ['activa', 'por_vencer', 'vencida', 'suspendida'],
        default: 'activa',
      },
      fecha_inicio: { type: Date, default: null },
      fecha_vencimiento: { type: Date, default: null },
      pago: { type: String, enum: ['mensual', 'anual'], default: 'mensual' },
    },
    ultimo_ping: { type: Date, default: null },
    dispositivo: { type: String, enum: ['mobile', 'desktop'], default: 'desktop' },
    chat_mensajes_hoy: {
      count: { type: Number, default: 0 },
      fecha: { type: Date, default: null },
    },
    resetToken: { type: String, default: null },
    resetTokenExpires: { type: Date, default: null },
  },
  { timestamps: true }
)

usuarioSchema.index({ email: 1 })
usuarioSchema.index({ username: 1 })

module.exports = mongoose.model('Usuario', usuarioSchema)
