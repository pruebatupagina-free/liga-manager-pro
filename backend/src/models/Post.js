const mongoose = require('mongoose')

const PostSchema = new mongoose.Schema({
  liga_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Liga', required: true, index: true },
  autor_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  autor_nombre: { type: String, required: true },
  autor_logo:   { type: String, default: null },
  autor_tipo:   { type: String, enum: ['admin_liga', 'dueno_equipo', 'superadmin', 'vendedor'], required: true },
  texto:        { type: String, required: true, maxlength: 1000 },
  imagen:       { type: String, default: null },
  likes:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }],
}, { timestamps: true })

module.exports = mongoose.model('Post', PostSchema)
