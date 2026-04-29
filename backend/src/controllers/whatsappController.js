const STUB = { success: false, message: 'WhatsApp no configurado aún' }

exports.enviar = async (req, res) => res.json(STUB)
exports.jornada = async (req, res) => res.json(STUB)
exports.bye = async (req, res) => res.json(STUB)
exports.cobro = async (req, res) => res.json(STUB)
