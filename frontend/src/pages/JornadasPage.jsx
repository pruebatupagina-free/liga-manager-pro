import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Plus, Calendar, ChevronDown, ChevronUp, Send, RefreshCw } from 'lucide-react'
import Modal from '../components/ui/Modal'
import ModalResultado from '../components/modals/ModalResultado'
import { estadoBadge } from '../components/ui/Badge'
import client from '../api/client'

function timeSlots(horaInicio, horaFin, duracion) {
  const slots = []
  const [h0, m0] = (horaInicio || '09:00').split(':').map(Number)
  const [h1, m1] = (horaFin || '22:00').split(':').map(Number)
  let mins = h0 * 60 + m0
  const end = h1 * 60 + m1
  while (mins + duracion <= end) {
    const hh = String(Math.floor(mins / 60)).padStart(2, '0')
    const mm = String(mins % 60).padStart(2, '0')
    slots.push(`${hh}:${mm}`)
    mins += duracion
  }
  return slots
}

export default function JornadasPage() {
  const { liga_id } = useParams()
  const qc = useQueryClient()
  const [genModal, setGenModal] = useState(false)
  const [extraModal, setExtraModal] = useState(false)
  const [resultadoPartido, setResultadoPartido] = useState(null)
  const [openJornada, setOpenJornada] = useState(null)
  const [genForm, setGenForm] = useState({ fecha: '', hora_inicio: '', notas: '', permitir_repetir: false })
  const [extraForm, setExtraForm] = useState({ jornada_id: '', equipo_local_id: '', equipo_visitante_id: '', hora: '', cancha: '' })

  const { data: liga } = useQuery({
    queryKey: ['liga', liga_id],
    queryFn: () => client.get(`/ligas/${liga_id}`).then(r => r.data),
  })

  const { data: jornadas = [], isLoading } = useQuery({
    queryKey: ['jornadas', liga_id],
    queryFn: () => client.get('/jornadas', { params: { liga_id } }).then(r => r.data),
  })

  const { data: equipos = [] } = useQuery({
    queryKey: ['equipos', liga_id],
    queryFn: () => client.get('/equipos', { params: { liga_id } }).then(r => r.data),
  })

  const { data: partidos = [] } = useQuery({
    queryKey: ['partidos', liga_id],
    queryFn: () => client.get('/partidos', { params: { liga_id } }).then(r => r.data),
  })

  const generar = useMutation({
    mutationFn: data => client.post('/jornadas/generar', data),
    onSuccess: () => { qc.invalidateQueries(['jornadas', liga_id]); qc.invalidateQueries(['partidos', liga_id]); setGenModal(false); toast.success('Jornada generada') },
    onError: err => toast.error(err.response?.data?.error || 'Error al generar'),
  })

  const agregarExtra = useMutation({
    mutationFn: data => client.post('/partidos/extra', data),
    onSuccess: () => { qc.invalidateQueries(['partidos', liga_id]); setExtraModal(false); toast.success('Partido extra agregado') },
    onError: err => toast.error(err.response?.data?.error || 'Error'),
  })

  const enviarWA = useMutation({
    mutationFn: jornada_id => client.post('/whatsapp/jornada', { liga_id, jornada_id }),
    onSuccess: res => toast.success(`WhatsApp enviado a ${res.data.enviados} equipos`),
    onError: err => toast.error(err.response?.data?.error || 'Error al enviar'),
  })

  const cfg = liga?.configuracion
  const slots = cfg ? timeSlots(cfg.hora_inicio, cfg.hora_fin, cfg.duracion_partido || 60) : []

  function getPartidosJornada(jornada_id) {
    return partidos.filter(p => (p.jornada_id?._id || p.jornada_id) === jornada_id)
  }

  function getEquipoNombre(id) {
    return equipos.find(e => e._id === (id?._id || id))?.nombre || 'Desconocido'
  }

  return (
    <div className="p-6 max-w-5xl mx-auto" data-tour="jornadas">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
            JORNADAS
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-fg-muted)' }}>{liga?.nombre} · {jornadas.length} jornada(s)</p>
        </div>
        <button
          onClick={() => setGenModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
          style={{ background: 'var(--color-accent)', color: '#020617' }}
        >
          <Plus size={16} /> Generar jornada
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20" style={{ color: 'var(--color-fg-muted)' }}>Cargando...</div>
      ) : jornadas.length === 0 ? (
        <div className="text-center py-20">
          <Calendar size={48} className="mx-auto mb-4" style={{ color: 'var(--color-fg-muted)' }} />
          <p style={{ color: 'var(--color-fg-muted)' }}>Sin jornadas. ¡Genera la primera!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jornadas.map(j => {
            const pjs = getPartidosJornada(j._id)
            const isOpen = openJornada === j._id
            return (
              <div key={j._id} className="rounded-2xl overflow-hidden glow-card" style={{ background: 'var(--color-primary)' }}>
                <button
                  onClick={() => setOpenJornada(isOpen ? null : j._id)}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-all cursor-pointer text-left"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-display text-lg flex-shrink-0"
                    style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}
                  >
                    {j.numero}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: 'var(--color-fg)' }}>Jornada {j.numero}</span>
                      {estadoBadge(j.estado)}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                      {j.fecha ? new Date(j.fecha).toLocaleDateString('es-MX') : 'Sin fecha'} · {pjs.length} partido(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); enviarWA.mutate(j._id) }}
                      className="p-2 rounded-xl hover:bg-white/10 cursor-pointer"
                      style={{ color: '#25D366' }}
                      aria-label="Enviar horarios por WhatsApp"
                      title="Enviar horarios por WhatsApp"
                    >
                      <Send size={16} />
                    </button>
                    {isOpen ? <ChevronUp size={18} style={{ color: 'var(--color-fg-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--color-fg-muted)' }} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="pt-4 space-y-2">
                      {pjs.length === 0 ? (
                        <p className="text-sm text-center py-4" style={{ color: 'var(--color-fg-muted)' }}>Sin partidos</p>
                      ) : (
                        pjs.map(p => (
                          <button
                            key={p._id}
                            onClick={() => !p.es_bye && setResultadoPartido(p)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${!p.es_bye ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default opacity-60'}`}
                            style={{ background: 'var(--color-secondary)' }}
                          >
                            <div className="flex-1 grid grid-cols-3 items-center gap-2">
                              <span className="text-sm font-medium text-right truncate" style={{ color: 'var(--color-fg)' }}>
                                {getEquipoNombre(p.equipo_local_id)}
                              </span>
                              <div className="text-center">
                                {p.estado === 'jugado' || p.estado === 'wo' ? (
                                  <span className="font-display text-lg" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
                                    {p.goles_local} – {p.goles_visitante}
                                  </span>
                                ) : (
                                  <div>
                                    <span className="text-xs block" style={{ color: 'var(--color-fg-muted)' }}>{p.hora || '—'}</span>
                                    <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{p.cancha || ''}</span>
                                  </div>
                                )}
                              </div>
                              <span className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>
                                {p.es_bye ? 'BYE' : getEquipoNombre(p.equipo_visitante_id)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {p.es_revancha && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>Rev</span>}
                              {p.es_extra && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(168,85,247,0.15)', color: '#A855F7' }}>Extra</span>}
                              {estadoBadge(p.estado)}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    <button
                      onClick={() => { setExtraForm(f => ({ ...f, jornada_id: j._id })); setExtraModal(true) }}
                      className="mt-3 flex items-center gap-2 text-xs cursor-pointer"
                      style={{ color: 'var(--color-accent)' }}
                    >
                      <Plus size={14} /> Agregar partido extra
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Generar jornada modal */}
      <Modal open={genModal} onClose={() => setGenModal(false)} title="GENERAR JORNADA">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Fecha</label>
            <input
              type="date"
              value={genForm.fecha}
              onChange={e => setGenForm(f => ({ ...f, fecha: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Hora inicio (override opcional)</label>
            <select
              value={genForm.hora_inicio}
              onChange={e => setGenForm(f => ({ ...f, hora_inicio: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
              style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
            >
              <option value="">Usar hora de liga ({cfg?.hora_inicio})</option>
              {slots.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Notas</label>
            <input
              value={genForm.notas}
              onChange={e => setGenForm(f => ({ ...f, notas: e.target.value }))}
              placeholder="Ej: Cancha mojada, traer uniforme..."
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
            />
          </div>
          <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}>
            <div>
              <p className="text-sm" style={{ color: 'var(--color-fg)' }}>Permitir repetir enfrentamientos</p>
              <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>Si ya no hay matchups nuevos</p>
            </div>
            <button
              type="button"
              onClick={() => setGenForm(f => ({ ...f, permitir_repetir: !f.permitir_repetir }))}
              className={`w-12 h-6 rounded-full cursor-pointer relative ${genForm.permitir_repetir ? 'bg-green-500' : 'bg-slate-600'}`}
              role="switch"
              aria-checked={genForm.permitir_repetir}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${genForm.permitir_repetir ? 'translate-x-6' : 'translate-x-0.5'}`} style={{ background: '#fff' }} />
            </button>
          </div>

          {/* Preview horarios */}
          {equipos.length > 0 && (
            <div className="rounded-xl p-3" style={{ background: 'var(--color-muted)', border: '1px solid var(--color-border)' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-fg-muted)' }}>Vista previa (aprox.)</p>
              <div className="space-y-1">
                {slots.slice(0, Math.ceil(equipos.length / 2)).map((s, i) => (
                  <div key={s} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                    <span style={{ color: 'var(--color-fg)' }}>{s}</span>
                    <span>Partido {i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setGenModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>Cancelar</button>
            <button
              type="button"
              onClick={() => generar.mutate({ liga_id, fecha: genForm.fecha, hora_inicio_override: genForm.hora_inicio || undefined, notas: genForm.notas, permitir_repetir: genForm.permitir_repetir })}
              disabled={generar.isPending || !genForm.fecha}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
              style={{ background: 'var(--color-accent)', color: '#020617' }}
            >
              {generar.isPending ? 'Generando...' : 'Generar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Partido extra modal */}
      <Modal open={extraModal} onClose={() => setExtraModal(false)} title="PARTIDO EXTRA" size="sm">
        <div className="space-y-4">
          {[
            { key: 'equipo_local_id', label: 'Equipo local' },
            { key: 'equipo_visitante_id', label: 'Equipo visitante' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>{label}</label>
              <select
                value={extraForm[key]}
                onChange={e => setExtraForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              >
                <option value="">Seleccionar...</option>
                {equipos.map(e => <option key={e._id} value={e._id}>{e.nombre}</option>)}
              </select>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Hora</label>
              <select
                value={extraForm.hora}
                onChange={e => setExtraForm(f => ({ ...f, hora: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              >
                <option value="">—</option>
                {slots.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Cancha</label>
              <input
                value={extraForm.cancha}
                onChange={e => setExtraForm(f => ({ ...f, cancha: e.target.value }))}
                placeholder="Cancha 1"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setExtraModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>Cancelar</button>
            <button
              type="button"
              onClick={() => agregarExtra.mutate({ liga_id, ...extraForm })}
              disabled={agregarExtra.isPending || !extraForm.equipo_local_id || !extraForm.equipo_visitante_id}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
              style={{ background: 'var(--color-accent)', color: '#020617' }}
            >
              {agregarExtra.isPending ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
        </div>
      </Modal>

      {resultadoPartido && (
        <ModalResultado
          partido={resultadoPartido}
          onClose={() => setResultadoPartido(null)}
        />
      )}
    </div>
  )
}
