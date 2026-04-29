const BYE = { _id: 'BYE', nombre: 'BYE', es_bye: true }

function generarRoundRobin(equipos) {
  const lista = [...equipos]
  if (lista.length % 2 !== 0) lista.push(BYE)
  const n = lista.length
  const rondas = []
  const fijo = lista[0]
  const rotantes = lista.slice(1)

  for (let r = 0; r < n - 1; r++) {
    const orden = [fijo, ...rotantes]
    const partidos = []
    for (let i = 0; i < n / 2; i++) {
      const local = orden[i]
      const visitante = orden[n - 1 - i]
      if (local._id !== 'BYE' && visitante._id !== 'BYE') {
        partidos.push({ equipo_local_id: local._id, equipo_visitante_id: visitante._id, es_bye: false })
      } else {
        const real = local._id === 'BYE' ? visitante : local
        partidos.push({ equipo_local_id: real._id, equipo_visitante_id: null, es_bye: true, equipo_bye_id: real._id })
      }
    }
    rondas.push(partidos)
    rotantes.unshift(rotantes.pop())
  }
  return rondas
}

function reordenarPorInteligencia(partidos, historial) {
  // 25% equipos más igualados, 50% emocionantes (muchos goles), 25% clásicos (más encuentros)
  const scored = partidos.map(p => {
    const key1 = `${p.equipo_local_id}-${p.equipo_visitante_id}`
    const key2 = `${p.equipo_visitante_id}-${p.equipo_local_id}`
    const h = historial[key1] || historial[key2] || { partidos: 0, goles: 0, diferencia: 0 }
    return { ...p, _score: h.goles * 0.5 + h.partidos * 0.25 + (1 / (Math.abs(h.diferencia) + 1)) * 0.25 }
  })
  return scored.sort((a, b) => b._score - a._score).map(({ _score, ...p }) => p)
}

function asignarHorariosConFijos(partidos, equipos, config) {
  const { hora_inicio, hora_fin, duracion_partido, num_canchas } = config
  const slots = generarSlots(hora_inicio, hora_fin, duracion_partido, num_canchas)
  const fijos = equipos.filter(e => e.tiene_hora_fija && e.hora_fija)
  const resultado = []
  const slotsUsados = {}

  // Primero asignar partidos de equipos con hora fija
  partidos.forEach(p => {
    const equipoFijo = fijos.find(
      e => e._id.toString() === p.equipo_local_id?.toString() || e._id.toString() === p.equipo_visitante_id?.toString()
    )
    if (equipoFijo) {
      resultado.push({ ...p, hora: equipoFijo.hora_fija, cancha: 1 })
    }
  })

  // Luego los demás
  let slotIdx = 0
  partidos.forEach(p => {
    const yaAsignado = resultado.find(
      r => r.equipo_local_id?.toString() === p.equipo_local_id?.toString()
    )
    if (!yaAsignado) {
      while (slotIdx < slots.length && slotsUsados[slots[slotIdx]]) slotIdx++
      if (slotIdx < slots.length) {
        const [hora, cancha] = slots[slotIdx].split('|')
        slotsUsados[slots[slotIdx]] = true
        resultado.push({ ...p, hora, cancha: Number(cancha) })
        slotIdx++
      } else {
        resultado.push({ ...p, hora: hora_inicio, cancha: 1 })
      }
    }
  })
  return resultado
}

function generarSlots(horaInicio, horaFin, duracion, numCanchas) {
  const slots = []
  let [h, m] = horaInicio.split(':').map(Number)
  const [hFin, mFin] = horaFin.split(':').map(Number)
  while (h * 60 + m + duracion <= hFin * 60 + mFin) {
    const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    for (let c = 1; c <= numCanchas; c++) slots.push(`${hora}|${c}`)
    m += duracion
    h += Math.floor(m / 60)
    m %= 60
  }
  return slots
}

function calcularHorarios(partidos, horaInicio, duracion, numCanchas) {
  const slots = generarSlots(horaInicio, '23:59', duracion, numCanchas)
  return partidos.map((p, i) => {
    const slot = slots[i] || `${horaInicio}|1`
    const [hora, cancha] = slot.split('|')
    return { ...p, hora, cancha: Number(cancha) }
  })
}

module.exports = { generarRoundRobin, reordenarPorInteligencia, asignarHorariosConFijos, calcularHorarios }
