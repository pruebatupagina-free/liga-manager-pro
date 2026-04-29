function calcularPagos(equipo, liga, partidos) {
  const { monto_pagado = 0 } = equipo
  const { cuota_inscripcion = 0, costo_arbitraje = 0, pago_fijo_temporada = 0 } = liga.configuracion
  const tieneFijo = equipo.tiene_hora_fija

  let restante = monto_pagado

  // 1. Inscripción
  const insc = Math.min(restante, cuota_inscripcion)
  restante -= insc

  // 2. Fijo (solo si tiene hora fija)
  let fijoPagado = 0
  let fijoTotal = tieneFijo ? pago_fijo_temporada : 0
  if (tieneFijo) {
    fijoPagado = Math.min(restante, fijoTotal)
    restante -= fijoPagado
  }

  // 3. Arbitrajes — ordenados por fecha
  const partidosDelEquipo = partidos
    .filter(p => {
      const esParticipante =
        p.equipo_local_id?.toString() === equipo._id.toString() ||
        p.equipo_visitante_id?.toString() === equipo._id.toString()
      return esParticipante && !p.es_bye && p.estado !== 'cancelado' && p.estado !== 'wo'
    })
    .sort((a, b) => {
      const fa = a.hora || '00:00'
      const fb = b.hora || '00:00'
      return fa.localeCompare(fb)
    })

  let arbTotal = 0
  let arbPagado = 0
  const detalle = []

  partidosDelEquipo.forEach(p => {
    const esLocal = p.equipo_local_id?.toString() === equipo._id.toString()
    const montoArb = costo_arbitraje
    arbTotal += montoArb
    const pagadoEnPartido = Math.min(restante, montoArb)
    restante -= pagadoEnPartido
    arbPagado += pagadoEnPartido
    detalle.push({
      partido_id: p._id,
      cancha: p.cancha,
      hora: p.hora,
      rival: esLocal ? p.equipo_visitante_id : p.equipo_local_id,
      monto: montoArb,
      pagado: pagadoEnPartido >= montoArb,
    })
  })

  return {
    inscripcion: { total: cuota_inscripcion, pagado: insc, pendiente: Math.max(0, cuota_inscripcion - insc) },
    fijo: { aplica: tieneFijo, total: fijoTotal, pagado: fijoPagado, pendiente: Math.max(0, fijoTotal - fijoPagado) },
    arbitrajes: { total: arbTotal, pagado: arbPagado, pendiente: Math.max(0, arbTotal - arbPagado), detalle },
    total_deuda: Math.max(0, (cuota_inscripcion - insc) + (fijoTotal - fijoPagado) + (arbTotal - arbPagado)),
  }
}

module.exports = calcularPagos
