const https = require('https')
const { WhatsappLog } = require('../models')

function httpPost(url, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data)
    const opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }
    const req = https.request(url, opts, res => {
      let raw = ''
      res.on('data', chunk => (raw += chunk))
      res.on('end', () => resolve(JSON.parse(raw)))
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

async function enviarMensaje(telefono, mensaje, liga_id = null, equipo_id = null, tipo = 'general') {
  const instance = process.env.ULTRAMSG_INSTANCE
  const token = process.env.ULTRAMSG_TOKEN
  let estado = 'enviado'

  try {
    if (!instance || !token) throw new Error('UltraMsg no configurado')
    const url = `https://api.ultramsg.com/${instance}/messages/chat`
    await httpPost(url, { token, to: `+52${telefono}`, body: mensaje })
  } catch (err) {
    estado = 'error'
    console.error('WhatsApp error:', err.message)
  }

  if (liga_id) {
    await WhatsappLog.create({ liga_id, equipo_id, tipo, mensaje, estado })
  }
  return estado
}

function mensajeJornada(jornada, partidos, equiposMap) {
  const lineas = partidos
    .filter(p => !p.es_bye)
    .map(p => {
      const l = equiposMap[p.equipo_local_id] || 'TBD'
      const v = equiposMap[p.equipo_visitante_id] || 'TBD'
      return `\u{26BD} ${p.hora} Cancha ${p.cancha}: ${l} vs ${v}`
    })
    .join('\n')
  return `\u{1F4CB} *Jornada ${jornada.numero}*\n${jornada.fecha ? new Date(jornada.fecha).toLocaleDateString('es-MX') : ''}\n\n${lineas}\n\n\u{1F550} Favor de llegar 15 min antes`
}

function mensajeBye(equipo) {
  return `Hola *${equipo.nombre}* \u{1F44B}\n\nEsta jornada les corresponde descanso (BYE).\nNo hay cobro de arbitraje.\n\n\u{1F3C6} \u{00A1}Nos vemos la siguiente jornada!`
}

function mensajeCobro(equipo, deuda) {
  return `Hola *${equipo.nombre}* \u{1F44B}\n\nRecordatorio de pago pendiente:\n\n\u{1F4B0} Deuda total: $${deuda.toFixed(2)}\n\nPor favor regulariza tu situaci\u{00F3}n para participar sin problemas.\n\n\u{1F4DE} Cualquier duda, cont\u{00E1}ctanos`
}

module.exports = { enviarMensaje, mensajeJornada, mensajeBye, mensajeCobro }
