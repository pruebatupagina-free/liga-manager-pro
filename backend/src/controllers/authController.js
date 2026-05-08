const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { Usuario } = require('../models')
const { sendPasswordReset, sendWelcome } = require('../utils/email')

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

// POST /api/auth/register-public — registro público, crea admin_liga con plan basico
exports.registerPublic = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'nombre, email y contraseña son requeridos' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
    }

    const exists = await Usuario.findOne({ email: email.toLowerCase() })
    if (exists) return res.status(409).json({ error: 'Ya existe una cuenta con ese email' })

    // Username desde email: parte antes del @, solo alfanumérico+guion bajo, max 20 chars
    let base = email.toLowerCase().split('@')[0].replace(/[^a-z0-9_]/g, '').slice(0, 20)
    if (!base) base = 'user'
    if (RESERVED.includes(base)) base = `${base}1`
    let username = base
    let suffix = 1
    while (await Usuario.findOne({ username })) {
      username = `${base}${suffix++}`
    }

    const hash = await bcrypt.hash(password, 12)
    const user = await Usuario.create({
      nombre: nombre.trim(),
      email: email.toLowerCase(),
      password: hash,
      rol: 'admin_liga',
      username,
      licencia: { plan: 'basico', estado: 'activa', fecha_inicio: new Date() },
    })

    const token = signToken(user)
    res.status(201).json({ token, user: safeUser(user) })

    const frontendUrl = process.env.FRONTEND_URL || 'https://pruebatupagina-free.github.io/liga-manager-pro'
    sendWelcome(user.email, user.nombre, `${frontendUrl}/dashboard`).catch(err =>
      console.error('Welcome email failed:', err)
    )
  } catch (err) { next(err) }
}

// POST /api/auth/register — solo superadmin crea admin_liga
exports.register = async (req, res, next) => {
  try {
    if (req.user.rol !== 'superadmin') return res.status(403).json({ error: 'Solo superadmin puede crear admins' })

    const { nombre, email, password, username, rol = 'admin_liga', telefono, plan = 'basico', fecha_vencimiento } = req.body
    if (!nombre || !email || !password || !username) {
      return res.status(400).json({ error: 'nombre, email, password y username son requeridos' })
    }
    if (RESERVED.includes(username.toLowerCase())) {
      return res.status(400).json({ error: 'Username reservado' })
    }

    const exists = await Usuario.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] })
    if (exists) return res.status(409).json({ error: 'Email o username ya en uso' })

    const hash = await bcrypt.hash(password, 12)
    const licencia = { plan, estado: 'activa', fecha_inicio: new Date() }
    if (fecha_vencimiento) licencia.fecha_vencimiento = new Date(fecha_vencimiento)

    const user = await Usuario.create({
      nombre, email: email.toLowerCase(), password: hash,
      rol, username: username.toLowerCase(), telefono,
      licencia,
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

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email requerido' })

    const user = await Usuario.findOne({ email: email.toLowerCase() })
    // Responder siempre igual para no revelar si el email existe
    if (!user) return res.json({ message: 'Si el email existe, recibirás un enlace en breve.' })

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    await Usuario.updateOne(
      { _id: user._id },
      { $set: { resetToken: token, resetTokenExpires: expires } }
    )

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const resetUrl = `${frontendUrl}/reset-password/${token}`

    // Respond immediately; fire email in background so slow API doesn't block the client
    res.json({ message: 'Si el email existe, recibirás un enlace en breve.' })
    sendPasswordReset(user.email, resetUrl).catch(err => console.error('Email send failed:', err))
  } catch (err) { next(err) }
}

// POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params
    const { password } = req.body

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    }

    const user = await Usuario.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() },
    })

    if (!user) return res.status(400).json({ error: 'Token inválido o expirado' })

    const hashedPassword = await bcrypt.hash(password, 12)
    await Usuario.updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword, resetToken: null, resetTokenExpires: null } }
    )

    res.json({ message: 'Contraseña actualizada correctamente' })
  } catch (err) { next(err) }
}

// GET /api/auth/me
exports.me = async (req, res, next) => {
  try {
    const user = await Usuario.findById(req.user.id)
      .select('-password')
      .populate('ligas_asignadas', 'nombre slug')
      .lean()
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })
    res.json(user)
  } catch (err) { next(err) }
}
