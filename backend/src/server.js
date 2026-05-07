require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const mongoose = require('mongoose')

const app = express()

// Security
app.use(helmet())
app.use(cors({
  origin: [process.env.CLIENT_URL, process.env.FRONTEND_URL, 'http://localhost:5173'],
  credentials: true,
}))
app.use(rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  message: { error: 'Demasiadas solicitudes, intenta más tarde' },
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/ligas', require('./routes/ligas'))
app.use('/api/equipos', require('./routes/equipos'))
app.use('/api/jugadores', require('./routes/jugadores'))
app.use('/api/jornadas', require('./routes/jornadas'))
app.use('/api/partidos', require('./routes/partidos'))
app.use('/api/cobros', require('./routes/cobros'))
app.use('/api/estadisticas', require('./routes/estadisticas'))
app.use('/api/whatsapp', require('./routes/whatsapp'))
app.use('/api/chatbot', require('./routes/chatbot'))
app.use('/api/liguilla', require('./routes/liguilla'))
app.use('/api/public', require('./routes/public'))
app.use('/api/admin', require('./routes/admin'))
app.use('/api/arbitro', require('./routes/arbitro'))
app.use('/api/inscripciones', require('./routes/inscripciones'))
app.use('/api/posts', require('./routes/posts'))
app.use('/api/productos', require('./routes/productos'))
app.use('/api/mensajes', require('./routes/mensajes'))
app.use('/api/vendedores', require('./routes/vendedores'))
app.use('/api/arbitros', require('./routes/arbitros'))

app.use('/api/push', require('./routes/push'))

app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: new Date() }))

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  const status = err.status || 500
  res.status(status).json({ error: err.message || 'Error interno del servidor' })
})

// MongoDB + server start
const PORT = process.env.PORT || 5000
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB conectado')
    app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`))
    require('./crons/licencias')()
  })
  .catch(err => {
    console.error('Error conectando a MongoDB:', err.message)
    process.exit(1)
  })
