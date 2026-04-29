const cron = require('node-cron')
const { Usuario } = require('../models')

// Runs daily at 8:00 AM — marks licenses expiring soon or already expired
function iniciarCronLicencias() {
  cron.schedule('0 8 * * *', async () => {
    try {
      const ahora = new Date()
      const en7dias = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000)

      // Vencer licencias ya expiradas
      const vencidas = await Usuario.updateMany(
        {
          rol: { $ne: 'superadmin' },
          'licencia.estado': { $in: ['activa', 'por_vencer'] },
          'licencia.fecha_vencimiento': { $lt: ahora },
        },
        { $set: { 'licencia.estado': 'vencida' } }
      )

      // Marcar por_vencer las que expiran en 7 días
      const porVencer = await Usuario.updateMany(
        {
          rol: { $ne: 'superadmin' },
          'licencia.estado': 'activa',
          'licencia.fecha_vencimiento': { $gte: ahora, $lte: en7dias },
        },
        { $set: { 'licencia.estado': 'por_vencer' } }
      )

      // Resetear contador diario de mensajes de chatbot
      await Usuario.updateMany({}, { $set: { chat_mensajes_hoy: 0 } })

      if (vencidas.modifiedCount > 0 || porVencer.modifiedCount > 0) {
        console.log(`[cron:licencias] Vencidas: ${vencidas.modifiedCount} | Por vencer: ${porVencer.modifiedCount}`)
      }
    } catch (err) {
      console.error('[cron:licencias] Error:', err.message)
    }
  }, { timezone: 'America/Mexico_City' })

  console.log('[cron:licencias] Iniciado — 8:00 AM diario (Mexico City)')
}

module.exports = iniciarCronLicencias
