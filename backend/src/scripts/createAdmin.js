// Usage: node src/scripts/createAdmin.js <email> <username> <password> [plan] [dias]
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { Usuario } = require('../models')

async function createAdmin() {
  const [,, email, username, password, plan = 'basico', dias = '365'] = process.argv

  if (!email || !username || !password) {
    console.error('Uso: node createAdmin.js <email> <username> <password> [plan] [dias_licencia]')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGODB_URI)

  const existing = await Usuario.findOne({ $or: [{ email }, { username }] })
  if (existing) {
    console.error('Ya existe un usuario con ese email o username')
    process.exit(1)
  }

  const hash = await bcrypt.hash(password, 12)
  const vencimiento = new Date()
  vencimiento.setDate(vencimiento.getDate() + Number(dias))

  const user = await Usuario.create({
    email,
    username,
    password_hash: hash,
    nombre: username,
    rol: 'admin_liga',
    licencia: {
      estado: 'activa',
      plan,
      fecha_vencimiento: vencimiento,
    },
  })

  console.log('Admin de liga creado:')
  console.log('  Email:', user.email)
  console.log('  Username:', user.username)
  console.log('  Plan:', plan)
  console.log('  Vencimiento:', vencimiento.toLocaleDateString('es-MX'))
}

createAdmin()
  .catch(err => { console.error(err); process.exit(1) })
  .finally(() => mongoose.disconnect())
