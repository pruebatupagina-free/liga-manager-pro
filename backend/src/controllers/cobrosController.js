const { Equipo, Liga, Partido } = require('../models')
const calcularPagos = require('../utils/calcularPagos')
const PDFDocument = require('pdfkit')
const XLSX = require('xlsx')

async function verificarAdmin(ligaId, user) {
  const liga = await Liga.findById(ligaId)
  if (!liga) return null
  if (user.rol === 'superadmin') return liga
  if (liga.admin_id.toString() === user.id) return liga
  return null
}

// GET /api/cobros?liga_id=xxx
exports.getEstado = async (req, res, next) => {
  try {
    const { liga_id } = req.query
    if (!liga_id) return res.status(400).json({ error: 'liga_id requerido' })
    const liga = await verificarAdmin(liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    const equipos = await Equipo.find({ liga_id }).lean()
    const partidos = await Partido.find({ liga_id, estado: { $ne: 'cancelado' } }).lean()

    const resultado = equipos.map(e => ({ equipo: e, cobros: calcularPagos(e, liga, partidos) }))
    res.json(resultado)
  } catch (err) { next(err) }
}

// PUT /api/cobros/:equipo_id
exports.actualizarPago = async (req, res, next) => {
  try {
    const equipo = await Equipo.findById(req.params.equipo_id)
    if (!equipo) return res.status(404).json({ error: 'Equipo no encontrado' })
    const liga = await verificarAdmin(equipo.liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    const { monto_pagado } = req.body
    if (monto_pagado === undefined) return res.status(400).json({ error: 'monto_pagado requerido' })
    equipo.monto_pagado = Number(monto_pagado)
    await equipo.save()

    const partidos = await Partido.find({ liga_id: equipo.liga_id, estado: { $ne: 'cancelado' } }).lean()
    const cobros = calcularPagos(equipo.toObject(), liga, partidos)
    res.json({ equipo, cobros })
  } catch (err) { next(err) }
}

// PUT /api/cobros/arbitraje/:partido_id
exports.marcarArbitraje = async (req, res, next) => {
  try {
    const partido = await Partido.findById(req.params.partido_id)
    if (!partido) return res.status(404).json({ error: 'Partido no encontrado' })
    const liga = await verificarAdmin(partido.liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    const { lado, pagado } = req.body
    if (!['local', 'visitante'].includes(lado)) return res.status(400).json({ error: 'lado debe ser local o visitante' })
    partido.arbitraje[lado].pagado = Boolean(pagado)
    await partido.save()
    res.json(partido.arbitraje)
  } catch (err) { next(err) }
}

// GET /api/cobros/export/pdf?liga_id=xxx
exports.exportPDF = async (req, res, next) => {
  try {
    const { liga_id } = req.query
    const liga = await verificarAdmin(liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    const equipos = await Equipo.find({ liga_id }).lean()
    const partidos = await Partido.find({ liga_id }).lean()

    const doc = new PDFDocument({ margin: 40 })
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename=cobros-${liga.slug}.pdf`)
    doc.pipe(res)

    doc.fontSize(18).text(`Cobros — ${liga.nombre}`, { align: 'center' })
    doc.moveDown()

    equipos.forEach(e => {
      const c = calcularPagos(e, liga, partidos)
      doc.fontSize(12).fillColor('#1a7a8a').text(e.nombre)
      doc.fillColor('black').fontSize(10)
        .text(`  Inscripción: $${c.inscripcion.pagado}/$${c.inscripcion.total}`)
      if (c.fijo.aplica) doc.text(`  Fijo: $${c.fijo.pagado}/$${c.fijo.total}`)
      doc.text(`  Arbitrajes: $${c.arbitrajes.pagado}/$${c.arbitrajes.total}`)
        .text(`  Deuda total: $${c.total_deuda}`, { color: c.total_deuda > 0 ? 'red' : 'green' })
      doc.moveDown(0.5)
    })

    doc.end()
  } catch (err) { next(err) }
}

// GET /api/cobros/export/excel?liga_id=xxx
exports.exportExcel = async (req, res, next) => {
  try {
    const { liga_id } = req.query
    const liga = await verificarAdmin(liga_id, req.user)
    if (!liga) return res.status(403).json({ error: 'Sin acceso' })

    const equipos = await Equipo.find({ liga_id }).lean()
    const partidos = await Partido.find({ liga_id }).lean()

    const resumen = equipos.map(e => {
      const c = calcularPagos(e, liga, partidos)
      return {
        Equipo: e.nombre, Inscripcion_Total: c.inscripcion.total, Inscripcion_Pagado: c.inscripcion.pagado,
        Fijo_Total: c.fijo.total, Fijo_Pagado: c.fijo.pagado,
        Arbitrajes_Total: c.arbitrajes.total, Arbitrajes_Pagado: c.arbitrajes.pagado,
        Deuda: c.total_deuda,
      }
    })

    const arbitrajes = []
    equipos.forEach(e => {
      const c = calcularPagos(e, liga, partidos)
      c.arbitrajes.detalle.forEach(d => {
        arbitrajes.push({ Equipo: e.nombre, Hora: d.hora, Cancha: d.cancha, Monto: d.monto, Pagado: d.pagado ? 'Sí' : 'No' })
      })
    })

    const totales = [{
      Total_Inscripciones: resumen.reduce((s, r) => s + r.Inscripcion_Total, 0),
      Total_Cobrado: resumen.reduce((s, r) => s + r.Inscripcion_Pagado + r.Fijo_Pagado + r.Arbitrajes_Pagado, 0),
      Total_Deuda: resumen.reduce((s, r) => s + r.Deuda, 0),
    }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), 'Resumen')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(arbitrajes), 'Arbitrajes')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(totales), 'Totales')

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=cobros-${liga.slug}.xlsx`)
    res.send(buffer)
  } catch (err) { next(err) }
}
