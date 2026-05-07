const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  usuario_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  subscription: { type: Object, required: true },
}, { timestamps: true })

module.exports = mongoose.model('PushSubscription', schema)
