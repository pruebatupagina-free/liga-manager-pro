require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { Usuario } = require('../models')

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('MongoDB conectado')

  const existing = await Usuario.findOne({ rol: 'superadmin' })
  if (existing) {
    console.log('Superadmin ya existe:', existing.email)
    return
  }

  const password = process.env.SUPERADMIN_PASSWORD || 'Admin2026!Liga'
  const hash = await bcrypt.hash(password, 12)

  const admin = await Usuario.create({
    email: 'admin@ligamanager.pro',
    username: 'superadmin',
    password_hash: hash,
    nombre: 'Super Admin',
    rol: 'superadmin',
    licencia: {
      estado: 'activa',
      plan: 'ilimitado',
      fecha_vencimiento: new Date('2099-12-31'),
    },
  })

  console.log('Superadmin creado:', admin.email)
  console.log('Password:', password)
}

seed()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => mongoose.disconnect())
