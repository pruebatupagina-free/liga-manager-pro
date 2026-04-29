import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { DollarSign, Download, Send, ChevronDown, ChevronUp } from 'lucide-react'
import client from '../api/client'

const FILTROS = ['Todos', 'Con hora fija', 'Sin hora fija', 'Con deuda', 'Al día']

function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-secondary)' }}>
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

function deudaColor(deuda, total) {
  if (deuda <= 0) return '#22C55E'
  if (deuda < total) return '#F59E0B'
  return '#EF4444'
}

export default function CobrosPage() {
  const { liga_id } = useParams()
  const qc = useQueryClient()
  const [filtro, setFiltro] = useState('Todos')
  const [openEquipo, setOpenEquipo] = useState(null)
  const [pagoInputs, setPagoInputs] = useState({})

  const { data: cobros = [], isLoading } = useQuery({
    queryKey: ['cobros', liga_id],
    queryFn: () => client.get('/cobros', { params: { liga_id } }).then(r => r.data),
  })

  const actualizarPago = useMutation({
    mutationFn: ({ equipo_id, monto_pagado }) => client.put(`/cobros/${equipo_id}`, { monto_pagado }),
    onSuccess: () => { qc.invalidateQueries(['cobros', liga_id]); toast.success('Pago actualizado') },
    onError: err => toast.error(err.response?.data?.error || 'Error'),
  })

  const enviarCobro = useMutation({
    mutationFn: equipo_id => client.post('/whatsapp/cobro', { liga_id, equipo_id }),
    onSuccess: () => toast.success('Recordatorio enviado'),
    onError: err => toast.error(err.response?.data?.error || 'Error'),
  })

  function exportar(tipo) {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/cobros/export/${tipo}?liga_id=${liga_id}`, '_blank')
  }

  const filtrados = cobros.filter(({ equipo, cobros: c }) => {
    if (filtro === 'Con hora fija') return equipo.tiene_hora_fija
    if (filtro === 'Sin hora fija') return !equipo.tiene_hora_fija
    if (filtro === 'Con deuda') return c.total_deuda > 0
    if (filtro === 'Al día') return c.total_deuda <= 0
    return true
  })

  const totalDeuda = cobros.reduce((s, { cobros: c }) => s + (c.total_deuda || 0), 0)
  const totalCobrado = cobros.reduce((s, { cobros: c }) => s + (c.inscripcion.pagado + c.fijo.pagado + c.arbitrajes.pagado), 0)

  return (
    <div className="p-6 max-w-5xl mx-auto" data-tour="cobros">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>COBROS</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-fg-muted)' }}>
            Cobrado: <span style={{ color: '#22C55E' }}>${totalCobrado.toLocaleString()}</span>
            &nbsp;· Pendiente: <span style={{ color: totalDeuda > 0 ? '#EF4444' : '#22C55E' }}>${totalDeuda.toLocaleString()}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportar('pdf')} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer" style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>
            <Download size={16} /> PDF
          </button>
          <button onClick={() => exportar('excel')} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer" style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>
            <Download size={16} /> Excel
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTROS.map(f => {
          let count = cobros.length
          if (f === 'Con hora fija') count = cobros.filter(({ equipo }) => equipo.tiene_hora_fija).length
          if (f === 'Sin hora fija') count = cobros.filter(({ equipo }) => !equipo.tiene_hora_fija).length
          if (f === 'Con deuda') count = cobros.filter(({ cobros: c }) => c.total_deuda > 0).length
          if (f === 'Al día') count = cobros.filter(({ cobros: c }) => c.total_deuda <= 0).length
          return (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer"
              style={{
                background: filtro === f ? 'var(--color-accent)' : 'var(--color-secondary)',
                color: filtro === f ? '#020617' : 'var(--color-fg-muted)',
              }}
            >
              {f} ({count})
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="text-center py-20" style={{ color: 'var(--color-fg-muted)' }}>Cargando...</div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(({ equipo, cobros: c }) => {
            const color = deudaColor(c.total_deuda, c.inscripcion.total + c.fijo.total + c.arbitrajes.total)
            const isOpen = openEquipo === equipo._id
            const pagoActual = pagoInputs[equipo._id] ?? c.total_pagado ?? ''
            return (
              <div key={equipo._id} className="rounded-2xl overflow-hidden glow-card" style={{ background: 'var(--color-primary)' }}>
                <button
                  onClick={() => setOpenEquipo(isOpen ? null : equipo._id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-all cursor-pointer text-left"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0"
                    style={{ background: equipo.color + '33', color: equipo.color, fontSize: '14px' }}
                  >
                    {equipo.nombre.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: 'var(--color-fg)' }}>{equipo.nombre}</p>
                    <div className="mt-1.5">
                      <ProgressBar
                        value={c.inscripcion.pagado + c.fijo.pagado + c.arbitrajes.pagado}
                        max={c.inscripcion.total + c.fijo.total + c.arbitrajes.total}
                        color={color}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display text-lg" style={{ color, fontFamily: 'var(--font-display)' }}>
                      ${c.total_deuda.toLocaleString()}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>deuda</p>
                  </div>
                  {isOpen ? <ChevronUp size={18} style={{ color: 'var(--color-fg-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--color-fg-muted)' }} />}
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 border-t space-y-4" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="pt-4 grid grid-cols-3 gap-3">
                      {[
                        { label: 'Inscripción', data: c.inscripcion },
                        { label: 'Fijo', data: c.fijo },
                        { label: 'Arbitrajes', data: c.arbitrajes },
                      ].map(({ label, data }) => (
                        <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'var(--color-secondary)' }}>
                          <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{label}</p>
                          <p className="font-semibold text-sm mt-1" style={{ color: 'var(--color-fg)' }}>
                            ${data.pagado}/${data.total}
                          </p>
                          <ProgressBar value={data.pagado} max={data.total} color={color} />
                        </div>
                      ))}
                    </div>

                    {c.arbitrajes.detalle?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-fg-muted)' }}>Detalle arbitrajes</p>
                        <div className="space-y-1">
                          {c.arbitrajes.detalle.map((d, i) => (
                            <div key={i} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg" style={{ background: 'var(--color-muted)' }}>
                              <span style={{ color: 'var(--color-fg-muted)' }}>{d.hora} {d.cancha}</span>
                              <span style={{ color: 'var(--color-fg)' }}>${d.monto}</span>
                              <span style={{ color: d.pagado ? '#22C55E' : '#EF4444' }}>{d.pagado ? 'Pagado' : 'Pendiente'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <input
                        type="number" min="0"
                        placeholder="Nuevo monto pagado"
                        value={pagoInputs[equipo._id] ?? ''}
                        onChange={e => setPagoInputs(p => ({ ...p, [equipo._id]: e.target.value }))}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                        style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                      />
                      <button
                        onClick={() => {
                          const val = pagoInputs[equipo._id]
                          if (val === undefined || val === '') return
                          actualizarPago.mutate({ equipo_id: equipo._id, monto_pagado: Number(val) })
                          setPagoInputs(p => { const n = { ...p }; delete n[equipo._id]; return n })
                        }}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                        style={{ background: 'var(--color-accent)', color: '#020617' }}
                      >
                        Actualizar
                      </button>
                      {equipo.whatsapp && (
                        <button
                          onClick={() => enviarCobro.mutate(equipo._id)}
                          className="p-2.5 rounded-xl cursor-pointer"
                          style={{ background: '#25D36622', color: '#25D366' }}
                          aria-label="Enviar recordatorio WhatsApp"
                        >
                          <Send size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
