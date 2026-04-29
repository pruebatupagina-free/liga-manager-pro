function calcularMVP(partido, goles, jugadoresLocal, jugadoresVisitante) {
  const gl = partido.goles_local ?? 0
  const gv = partido.goles_visitante ?? 0
  const todosJugadores = [...jugadoresLocal, ...jugadoresVisitante]

  function aleatorio(arr) {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  // 0-0 → aleatorio entre todos
  if (gl === 0 && gv === 0) {
    return todosJugadores.length ? aleatorio(todosJugadores) : null
  }

  const golesLocal = goles.filter(g => g.equipo_id.toString() === partido.equipo_local_id.toString() && g.tipo !== 'autogol')
  const golesVisitante = goles.filter(g => g.equipo_id.toString() === partido.equipo_visitante_id.toString() && g.tipo !== 'autogol')

  // Empate con goles → aleatorio entre todos los goleadores de ambos equipos
  if (gl === gv) {
    const goleadores = goles.filter(g => g.tipo !== 'autogol').map(g => g.jugador_id.toString())
    const uniqueGoleadores = [...new Set(goleadores)]
    return uniqueGoleadores.length ? aleatorio(uniqueGoleadores) : aleatorio(todosJugadores)
  }

  // Hay ganador
  const esLocalGanador = gl > gv
  const golesGanador = esLocalGanador ? golesLocal : golesVisitante

  if (!golesGanador.length) {
    const jugadoresGanador = esLocalGanador ? jugadoresLocal : jugadoresVisitante
    return jugadoresGanador.length ? aleatorio(jugadoresGanador) : null
  }

  // Contar goles por jugador en equipo ganador
  const conteo = {}
  golesGanador.forEach(g => {
    const id = g.jugador_id.toString()
    conteo[id] = (conteo[id] || 0) + 1
  })

  const maxGoles = Math.max(...Object.values(conteo))
  const destacados = Object.entries(conteo)
    .filter(([, n]) => n === maxGoles)
    .map(([id]) => id)

  return aleatorio(destacados)
}

module.exports = calcularMVP
