const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { Usuario } = require('../models')

const RESERVED = ['login', 'dashboard', 'admin', 'api', 'ligas', 'equipos', 'usuarios', 'solicitudes']

function signToken(user) {
  return jwt.sign({ id: user._id, rol: user.rol, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  })
}

function safeUser(u) {
  const { password, __v, ...rest } = u.toObject ? u.toObject() : u
  return rest
}

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' })

    const user = await Usuario.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' })

    const token = signToken(user)
    res.json({ token, user: safeUser(user) })
  } catch (err) { next(err) }
}

// POST /api/auth/register — solo superadmin crea admin_liga
exports.register = async (req, res, next) => {
  try {
    if (req.user.rol !== 'superadmin') return res.status(403).json({ error: 'Solo superadmin puede crear admins' })

    const { nombre, email, password, username, rol = 'admin_liga', telefono } = req.body
    if (!nombre || !email || !password || !username) {
      return res.status(400).json({ error: 'nombre, email, password y username son requeridos' })
    }
    if (RESERVED.includes(username.toLowerCase())) {
      return res.status(400).json({ error: 'Username reservado' })
    }

    const exists = await Usuario.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] })
    if (exists) return res.status(409).json({ error: 'Email o username ya en uso' })

    const hash = await bcrypt.hash(password, 12)
    const user = await Usuario.create({
      nombre, email: email.toLowerCase(), password: hash,
      rol, username: username.toLowerCase(), telefono,
      licencia: { plan: 'basico', estado: 'activa', fecha_inicio: new Date() },
    })
    res.status(201).json({ user: safeUser(user) })
  } catch (err) { next(err) }
}

// POST /api/auth/ping
exports.ping = async (req, res, next) => {
  try {
    const { dispositivo = 'desktop' } = req.body
    await Usuario.findByIdAndUpdate(req.user.id, { ultimo_ping: new Date(), dispositivo })
    res.json({ ok: true })
  } catch (err) { next(err) }
}

// GET /api/auth/me
exports.me = async (req, res, next) => {
  try {
    const user = await Usuario.findById(req.user.id).select('-password').lean()
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json(user)
  } catch (err) { next(err) }
}
