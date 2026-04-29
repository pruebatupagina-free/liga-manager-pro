const { Liga, Equipo, Partido, Gol, Tarjeta, Jugador, Jornada } = require('../models')
const PDFDocument = require('pdfkit')
const XLSX = require('xlsx')

async function verificarAdmin(ligaId, user) {
  const liga = await Liga.findById(ligaId).lean()
  if (!liga) return null
  if (user.rol === 'superadmin') return liga
  if (liga.admin_id.toString() === user.id) return liga
  return null
}

exports.calcularTabla = calcularTabla
function calcularTabla(liga, equipos, partidos) {
  const stats = {}
  equipos.forEach(e => {
    stats[e._id.toString()] = { equipo: e, PJ: 0, PG: 0, PE: 0, PP: 0, GF: 0, GC: 0, DG: 0, Pts: 0 }
  })

  partidos.filter(p => p.estado === 'jugado' && !p.es_bye).forEach(p => {
    const lid = p.equipo_local_id?.toString()
    const vid = p.equipo_visitante_id?.toString()
    const gl = p.goles_local ?? 0
    const gv = p.goles_visitante ?? 0
    if (!stats[lid] || !stats[vid]) return

    stats[lid].PJ++; stats[vid].PJ++
    stats[lid].GF += gl; stats[lid].GC += gv
    stats[vid].GF += gv; stats[vid].GC += gl

    if (gl > gv) { stats[lid].PG++; stats[lid].Pts += 3; stats[vid].PP++ }
    else if (gl < gv) { stats[vid].PG++; stats[vid].Pts += 3; stats[lid].PP++ }
    else { stats[lid].PE++; stats[lid].Pts++; stats[vid].PE++; stats[vid].Pts++ }
  })

  Object.values(stats).forEach(s => { s.DG = s.GF - s.GC })

  const criterios = liga.configuracion?.criterios_desempate || ['diferencia_goles', 'goles_favor']

  const lista = Object.values(stats).sort((a, b) => {
    if (a.equipo.baja?.activa && !b.equipo.baja?.activa) return 1
    if (!a.equipo.baja?.activa && b.equipo.baja?.activa) return -1
    if (b.Pts !== a.Pts) return b.Pts - a.Pts

    for (const c of criterios) {
      if (c === 'diferencia_goles' && b.DG !== a.DG) return b.DG - a.DG
      if (c === 'goles_favor' && b.GF !== a.GF) return b.GF - a.GF
      if (c === 'menos_goles_contra' && a.GC !== b.GC) return a.GC - b.GC
    }
    return a.equipo.nombre.localeCompare(b.equipo.nombre)
  })

  return lista.map((s, i) => ({ posicion: i + 1, ...s }))
}

// GET /api/estadisticas/tabla?liga_id=xxx
exports.tabla = async (req, res, next) => {
  try {
    const { liga_id } = req.query
    if (!liga_id) return res.status(400).json({ error: 'liga_id requerido' })
    const liga = await verificarAdmin(liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })
    const [equipos, partidos] = await Promise.all([
      Equipo.find({ liga_id }).lean(),
      Partido.find({ liga_id, estado: { $in: ['jugado', 'wo'] } }).lean(),
    ])
    res.json(calcularTabla(liga, equipos, partidos))
  } catch (err) { next(err) }
}

// GET /api/estadisticas/goleadores?liga_id=xxx
exports.goleadores = async (req, res, next) => {
  try {
    const { liga_id } = req.query
    if (!liga_id) return res.status(400).json({ error: 'liga_id requerido' })
    const liga = await verificarAdmin(liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    const goles = await Gol.find({ tipo: { $ne: 'autogol' } })
      .populate({ path: 'partido_id', match: { liga_id }, select: 'liga_id' })
      .populate('jugador_id', 'nombre foto equipo_id')
      .populate('equipo_id', 'nombre')
      .lean()

    const filtrados = goles.filter(g => g.partido_id)
    const ranking = {}
    filtrados.forEach(g => {
      const id = g.jugador_id?._id?.toString()
      if (!id) return
      if (!ranking[id]) ranking[id] = { jugador: g.jugador_id, equipo: g.equipo_id, goles: 0 }
      ranking[id].goles++
    })

    const lista = Object.values(ranking).sort((a, b) => b.goles - a.goles)
    res.json(lista)
  } catch (err) { next(err) }
}

// GET /api/estadisticas/rendimiento?liga_id=xxx&equipo_id=yyy
exports.rendimiento = async (req, res, next) => {
  try {
    const { liga_id, equipo_id } = req.query
    if (!liga_id || !equipo_id) return res.status(400).json({ error: 'liga_id y equipo_id requeridos' })
    const liga = await verificarAdmin(liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    const jornadas = await Jornada.find({ liga_id }).sort('numero').lean()
    const partidos = await Partido.find({
      liga_id, estado: 'jugado',
      $or: [{ equipo_local_id: equipo_id }, { equipo_visitante_id: equipo_id }],
    }).lean()

    const porJornada = jornadas.map(j => {
      const p = partidos.find(x => x.jornada_id?.toString() === j._id.toString())
      if (!p) return { jornada: j.numero, goles_favor: 0, goles_contra: 0, resultado: null }
      const esLocal = p.equipo_local_id?.toString() === equipo_id
      return {
        jornada: j.numero,
        goles_favor: esLocal ? p.goles_local : p.goles_visitante,
        goles_contra: esLocal ? p.goles_visitante : p.goles_local,
        resultado: (esLocal ? p.goles_local > p.goles_visitante : p.goles_visitante > p.goles_local)
          ? 'G' : ((p.goles_local === p.goles_visitante) ? 'E' : 'P'),
      }
    })

    // Racha actual
    let racha = 0; let rachaChar = null
    for (let i = porJornada.length - 1; i >= 0; i--) {
      const r = porJornada[i].resultado
      if (!r) break
      if (!rachaChar) rachaChar = r
      if (r === rachaChar) racha++
      else break
    }

    res.json({ por_jornada: porJornada, racha: { tipo: rachaChar, cantidad: racha } })
  } catch (err) { next(err) }
}

// GET /api/estadisticas/comparativa?liga_id=xxx&equipo1=yyy&equipo2=zzz
exports.comparativa = async (req, res, next) => {
  try {
    const { liga_id, equipo1, equipo2 } = req.query
    if (!liga_id || !equipo1 || !equipo2) return res.status(400).json({ error: 'Parámetros incompletos' })
    const liga = await verificarAdmin(liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    const historial = await Partido.find({
      liga_id, estado: 'jugado',
      $or: [
        { equipo_local_id: equipo1, equipo_visitante_id: equipo2 },
        { equipo_local_id: equipo2, equipo_visitante_id: equipo1 },
      ],
    }).lean()

    let gE1 = 0, gE2 = 0, ganaE1 = 0, ganaE2 = 0, empates = 0
    historial.forEach(p => {
      const e1Local = p.equipo_local_id?.toString() === equipo1
      const gf = e1Local ? p.goles_local : p.goles_visitante
      const gc = e1Local ? p.goles_visitante : p.goles_local
      gE1 += gf; gE2 += gc
      if (gf > gc) ganaE1++
      else if (gf < gc) ganaE2++
      else empates++
    })

    res.json({ historial, resumen: { partidos: historial.length, ganaE1, ganaE2, empates, gE1, gE2 } })
  } catch (err) { next(err) }
}

// GET /api/estadisticas/mvp?liga_id=xxx&jornada_id=yyy
exports.mvp = async (req, res, next) => {
  try {
    const { liga_id, jornada_id } = req.query
    if (!liga_id) return res.status(400).json({ error: 'liga_id requerido' })
    const liga = await verificarAdmin(liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    const filter = { liga_id, estado: 'jugado', mvp_jugador_id: { $ne: null } }
    if (jornada_id) filter.jornada_id = jornada_id

    const partidos = await Partido.find(filter)
      .populate('mvp_jugador_id', 'nombre foto')
      .populate('equipo_local_id', 'nombre')
      .populate('equipo_visitante_id', 'nombre')
      .lean()

    const ranking = {}
    partidos.forEach(p => {
      const id = p.mvp_jugador_id?._id?.toString()
      if (!id) return
      if (!ranking[id]) ranking[id] = { jugador: p.mvp_jugador_id, mvps: 0 }
      ranking[id].mvps++
    })

    res.json({
      por_partido: partidos.map(p => ({ partido: p._id, mvp: p.mvp_jugador_id })),
      ranking: Object.values(ranking).sort((a, b) => b.mvps - a.mvps),
    })
  } catch (err) { next(err) }
}

// GET /api/estadisticas/export/pdf?liga_id=xxx
exports.exportPDF = async (req, res, next) => {
  try {
    const { liga_id } = req.query
    const liga = await verificarAdmin(liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    const [equipos, partidos] = await Promise.all([
      Equipo.find({ liga_id }).lean(),
      Partido.find({ liga_id, estado: { $in: ['jugado', 'wo'] } }).lean(),
    ])
    const tabla = calcularTabla(liga, equipos, partidos)

    const doc = new PDFDocument({ margin: 40 })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=tabla-${liga.slug}.pdf`)
    doc.pipe(res)

    doc.fontSize(18).text(`Tabla de Posiciones — ${liga.nombre}`, { align: 'center' })
    doc.moveDown()
    doc.fontSize(9)

    const headers = ['Pos', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'Pts']
    doc.text(headers.join('  '), { continued: false })
    doc.moveDown(0.3)
    tabla.forEach(row => {
      doc.text(`${row.posicion}  ${row.equipo.nombre}  ${row.PJ}  ${row.PG}  ${row.PE}  ${row.PP}  ${row.GF}  ${row.GC}  ${row.DG}  ${row.Pts}`)
    })

    doc.end()
  } catch (err) { next(err) }
}

// GET /api/estadisticas/export/excel?liga_id=xxx
exports.exportExcel = async (req, res, next) => {
  try {
    const { liga_id } = req.query
    const liga = await verificarAdmin(liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    const [equipos, partidos, goles] = await Promise.all([
      Equipo.find({ liga_id }).lean(),
      Partido.find({ liga_id }).lean(),
      Gol.find({ tipo: { $ne: 'autogol' } }).populate({ path: 'partido_id', match: { liga_id } }).populate('jugador_id', 'nombre').lean(),
    ])

    const tabla = calcularTabla(liga, equipos, partidos).map(r => ({
      Posicion: r.posicion, Equipo: r.equipo.nombre, PJ: r.PJ, PG: r.PG, PE: r.PE, PP: r.PP, GF: r.GF, GC: r.GC, DG: r.DG, Pts: r.Pts,
    }))

    const goleadoresMap = {}
    goles.filter(g => g.partido_id).forEach(g => {
      const id = g.jugador_id?._id?.toString()
      if (!id) return
      goleadoresMap[id] = goleadoresMap[id] || { Jugador: g.jugador_id?.nombre, Goles: 0 }
      goleadoresMap[id].Goles++
    })
    const goleadoresList = Object.values(goleadoresMap).sort((a, b) => b.Goles - a.Goles)

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tabla), 'Tabla')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(goleadoresList), 'Goleadores')

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=estadisticas-${liga.slug}.xlsx`)
    res.send(buffer)
  } catch (err) { next(err) }
}
