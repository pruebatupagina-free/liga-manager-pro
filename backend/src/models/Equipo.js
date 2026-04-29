const mongoose = require('mongoose')

const equipoSchema = new mongoose.Schema(
  {
    liga_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true },
    dueno_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', sparse: true, default: null },
    nombre: { type: String, required: true, trim: true },
    slug: { type: String, lowercase: true, trim: true },
    color_principal: { type: String, default: '#000000' },
    logo: { type: String, default: null },
    dia_juego: { type: String, default: null },
    hora_fija: { type: String, default: null },
    tiene_hora_fija: { type: Boolean, default: false },
    telefono: { type: String, default: null },
    whatsapp: { type: String, default: null },
    monto_pagado: { type: Number, default: 0 },
    veces_bye: { type: Number, default: 0 },
    baja: {
      activa: { type: Boolean, default: false },
      motivo: { type: String, default: null },
      fecha: { type: Date, default: null },
      conservar_partidos: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
)

equipoSchema.index({ liga_id: 1 })
equipoSchema.index({ liga_id: 1, slug: 1 })

module.exports = mongoose.model('Equipo', equipoSchema)
