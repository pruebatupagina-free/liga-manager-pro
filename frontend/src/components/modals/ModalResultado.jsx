import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { X, Plus, Trash2, Star } from 'lucide-react'
import client from '../../api/client'

const TABS = ['Goles', 'Tarjetas', 'Arbitraje', 'MVP & Notas']
const TIPO_GOL = ['normal', 'penal', 'autogol']
const TIPO_TARJETA = ['amarilla', 'roja']
const ESTADOS = ['programado', 'en_curso', 'jugado', 'cancelado', 'wo', 'reprogramado']

export default function ModalResultado({ partido, onClose }) {
  const qc = useQueryClient()
  const [tab, setTab] = useState(0)
  const [local, setLocal] = useState(partido.goles_local ?? '')
  const [visitante, setVisitante] = useState(partido.goles_visitante ?? '')
  const [goles, setGoles] = useState(partido.goles_detalle || [])
  const [tarjetas, setTarjetas] = useState(partido.tarjetas_detalle || [])
  const [arbitraje, setArbitraje] = useState({
    local: { monto: partido.arbitraje?.local?.monto || 0, pagado: partido.arbitraje?.local?.pagado || false },
    visitante: { monto: partido.arbitraje?.visitante?.monto || 0, pagado: partido.arbitraje?.visitante?.pagado || false },
  })
  const [notas, setNotas] = useState(partido.notas || '')
  const [mvp, setMvp] = useState(partido.mvp_jugador_id?._id || partido.mvp_jugador_id || '')
  const [estado, setEstado] = useState(partido.estado || 'programado')
  const [woEquipo, setWoEquipo] = useState('')

  const { data: jugadoresLocal = [] } = useQuery({
    queryKey: ['jugadores', partido.equipo_local_id?._id || partido.equipo_local_id],
    queryFn: () => client.get('/jugadores', { params: { equipo_id: partido.equipo_local_id?._id || partido.equipo_local_id } }).then(r => r.data),
    enabled: !!partido.equipo_local_id,
  })

  const { data: jugadoresVisitante = [] } = useQuery({
    queryKey: ['jugadores', partido.equipo_visitante_id?._id || partido.equipo_visitante_id],
    queryFn: () => client.get('/jugadores', { params: { equipo_id: partido.equipo_visitante_id?._id || partido.equipo_visitante_id } }).then(r => r.data),
    enabled: !!partido.equipo_visitante_id,
  })

  const todosJugadores = [
    ...jugadoresLocal.map(j => ({ ...j, _equipo: 'local' })),
    ...jugadoresVisitante.map(j => ({ ...j, _equipo: 'visitante' })),
  ]

  const save = useMutation({
    mutationFn: () => client.put(`/partidos/${partido._id}/resultado`, {
      goles_local: Number(local) || 0,
      goles_visitante: Number(visitante) || 0,
      estado: estado === 'wo' && woEquipo ? 'wo' : estado,
      wo_equipo_presente: woEquipo || undefined,
      goles: goles.map(g => ({
        jugador_id: g.jugador_id,
        equipo_id: g.equipo_id,
        minuto: Number(g.minuto) || null,
        tipo: g.tipo || 'normal',
      })),
      tarjetas: tarjetas.map(t => ({
        jugador_id: t.jugador_id,
        equipo_id: t.equipo_id,
        minuto: Number(t.minuto) || null,
        tipo: t.tipo || 'amarilla',
      })),
      mvp_jugador_id: mvp || null,
      notas,
    }),
    onSuccess: () => {
      qc.invalidateQueries(['partidos'])
      qc.invalidateQueries(['jornada'])
      toast.success('Resultado guardado')
      onClose()
    },
    onError: err => toast.error(err.response?.data?.error || 'Error al guardar'),
  })

  const saveArbitraje = useMutation({
    mutationFn: ({ lado, pagado }) => client.put(`/cobros/arbitraje/${partido._id}`, { lado, pagado }),
    onSuccess: () => qc.invalidateQueries(['cobros']),
  })

  function addGol(equipoId, equipoKey) {
    setGoles(g => [...g, { jugador_id: '', equipo_id: equipoId, minuto: '', tipo: 'normal', _equipo: equipoKey }])
  }

  function addTarjeta(equipoId, equipoKey) {
    setTarjetas(t => [...t, { jugador_id: '', equipo_id: equipoId, minuto: '', tipo: 'amarilla', _equipo: equipoKey }])
  }

  const localId = partido.equipo_local_id?._id || partido.equipo_local_id
  const visitanteId = partido.equipo_visitante_id?._id || partido.equipo_visitante_id
  const localNombre = partido.equipo_local_id?.nombre || 'Local'
  const visitanteNombre = partido.equipo_visitante_id?.nombre || 'Visitante'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(2,6,23,0.9)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl rounded-2xl flex flex-col" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', maxHeight: '90vh' }}>

        {/* Sticky header — marcador */}
        <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>RESULTADO</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 cursor-pointer" style={{ color: 'var(--color-fg-muted)' }} aria-label="Cerrar"><X size={18} /></button>
          </div>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center flex-1">
              <p className="text-xs font-medium truncate mb-2" style={{ color: 'var(--color-fg-muted)' }}>{localNombre}</p>
              <input
                type="number" min="0"
                value={local}
                onChange={e => setLocal(e.target.value)}
                className="w-20 text-center rounded-xl outline-none font-display text-4xl"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}
              />
            </div>
            <span className="font-display text-3xl" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>VS</span>
            <div className="text-center flex-1">
              <p className="text-xs font-medium truncate mb-2" style={{ color: 'var(--color-fg-muted)' }}>{visitanteNombre}</p>
              <input
                type="number" min="0"
                value={visitante}
                onChange={e => setVisitante(e.target.value)}
                className="w-20 text-center rounded-xl outline-none font-display text-4xl"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}
              />
            </div>
          </div>

          {/* Estado y W/O */}
          <div className="flex items-center gap-3 mt-4">
            <select
              value={estado}
              onChange={e => setEstado(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none cursor-pointer"
              style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
            >
              {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {estado === 'wo' && (
              <select
                value={woEquipo}
                onChange={e => setWoEquipo(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none cursor-pointer"
                style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
              >
                <option value="">¿Quién estuvo presente?</option>
                <option value="local">{localNombre}</option>
                <option value="visitante">{visitanteNombre}</option>
              </select>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 rounded-xl p-1" style={{ background: 'var(--color-secondary)' }}>
            {TABS.map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(i)}
                className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                style={{
                  background: tab === i ? 'var(--color-primary)' : 'transparent',
                  color: tab === i ? 'var(--color-fg)' : 'var(--color-fg-muted)',
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab 0 — Goles */}
          {tab === 0 && (
            <div className="space-y-4">
              {[{ id: localId, nombre: localNombre, key: 'local' }, { id: visitanteId, nombre: visitanteNombre, key: 'visitante' }].map(({ id, nombre, key }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-fg-muted)' }}>{nombre}</span>
                    <button onClick={() => addGol(id, key)} className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: 'var(--color-accent)' }}>
                      <Plus size={14} /> Agregar gol
                    </button>
                  </div>
                  {goles.filter(g => g._equipo === key).map((g, i) => {
                    const idx = goles.findIndex((x, xi) => x._equipo === key && goles.filter((_, j) => j < xi && goles[j]._equipo === key).length === i)
                    const actualIdx = goles.reduce((acc, x, j) => x._equipo === key && acc.count <= i ? { count: acc.count + 1, idx: j } : acc, { count: 0, idx: -1 }).idx
                    const jugadoresEq = key === 'local' ? jugadoresLocal : jugadoresVisitante
                    return (
                      <div key={actualIdx} className="flex items-center gap-2 mb-2">
                        <select
                          value={goles[actualIdx]?.jugador_id || ''}
                          onChange={e => setGoles(arr => arr.map((x, j) => j === actualIdx ? { ...x, jugador_id: e.target.value } : x))}
                          className="flex-1 px-3 py-2 rounded-xl text-sm outline-none cursor-pointer"
                          style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                        >
                          <option value="">Jugador</option>
                          {jugadoresEq.map(j => <option key={j._id} value={j._id}>{j.nombre}</option>)}
                        </select>
                        <input
                          type="number" min="0" max="120" placeholder="Min"
                          value={goles[actualIdx]?.minuto || ''}
                          onChange={e => setGoles(arr => arr.map((x, j) => j === actualIdx ? { ...x, minuto: e.target.value } : x))}
                          className="w-16 px-2 py-2 rounded-xl text-sm outline-none text-center"
                          style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                        />
                        <select
                          value={goles[actualIdx]?.tipo || 'normal'}
                          onChange={e => setGoles(arr => arr.map((x, j) => j === actualIdx ? { ...x, tipo: e.target.value } : x))}
                          className="px-3 py-2 rounded-xl text-sm outline-none cursor-pointer"
                          style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                        >
                          {TIPO_GOL.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button onClick={() => setGoles(arr => arr.filter((_, j) => j !== actualIdx))} className="p-2 rounded-xl cursor-pointer" style={{ color: 'var(--color-destructive)' }} aria-label="Eliminar gol"><Trash2 size={14} /></button>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Tab 1 — Tarjetas */}
          {tab === 1 && (
            <div className="space-y-4">
              {[{ id: localId, nombre: localNombre, key: 'local' }, { id: visitanteId, nombre: visitanteNombre, key: 'visitante' }].map(({ id, nombre, key }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-fg-muted)' }}>{nombre}</span>
                    <button onClick={() => addTarjeta(id, key)} className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: 'var(--color-warning)' }}>
                      <Plus size={14} /> Tarjeta
                    </button>
                  </div>
                  {tarjetas.filter(t => t._equipo === key).map((t, i) => {
                    const actualIdx = tarjetas.reduce((acc, x, j) => x._equipo === key && acc.count <= i ? { count: acc.count + 1, idx: j } : acc, { count: 0, idx: -1 }).idx
                    const jugadoresEq = key === 'local' ? jugadoresLocal : jugadoresVisitante
                    return (
                      <div key={actualIdx} className="flex items-center gap-2 mb-2">
                        <select
                          value={tarjetas[actualIdx]?.jugador_id || ''}
                          onChange={e => setTarjetas(arr => arr.map((x, j) => j === actualIdx ? { ...x, jugador_id: e.target.value } : x))}
                          className="flex-1 px-3 py-2 rounded-xl text-sm outline-none cursor-pointer"
                          style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                        >
                          <option value="">Jugador</option>
                          {jugadoresEq.map(j => <option key={j._id} value={j._id}>{j.nombre}</option>)}
                        </select>
                        <input
                          type="number" min="0" max="120" placeholder="Min"
                          value={tarjetas[actualIdx]?.minuto || ''}
                          onChange={e => setTarjetas(arr => arr.map((x, j) => j === actualIdx ? { ...x, minuto: e.target.value } : x))}
                          className="w-16 px-2 py-2 rounded-xl text-sm outline-none text-center"
                          style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                        />
                        <select
                          value={tarjetas[actualIdx]?.tipo || 'amarilla'}
                          onChange={e => setTarjetas(arr => arr.map((x, j) => j === actualIdx ? { ...x, tipo: e.target.value } : x))}
                          className="px-3 py-2 rounded-xl text-sm outline-none cursor-pointer"
                          style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                        >
                          {TIPO_TARJETA.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <button onClick={() => setTarjetas(arr => arr.filter((_, j) => j !== actualIdx))} className="p-2 rounded-xl cursor-pointer" style={{ color: 'var(--color-destructive)' }} aria-label="Eliminar"><Trash2 size={14} /></button>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Tab 2 — Arbitraje */}
          {tab === 2 && (
            <div className="space-y-4">
              {[['local', localNombre], ['visitante', visitanteNombre]].map(([lado, nombre]) => (
                <div key={lado} className="rounded-xl p-4" style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}>
                  <p className="text-sm font-semibold mb-3" style={{ color: 'var(--color-fg)' }}>{nombre}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs mb-1" style={{ color: 'var(--color-fg-muted)' }}>Monto ($)</label>
                      <input
                        type="number" min="0"
                        value={arbitraje[lado].monto}
                        onChange={e => setArbitraje(a => ({ ...a, [lado]: { ...a[lado], monto: e.target.value } }))}
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                        style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                      />
                    </div>
                    <div className="text-center">
                      <label className="block text-xs mb-1" style={{ color: 'var(--color-fg-muted)' }}>Pagado</label>
                      <button
                        type="button"
                        onClick={() => {
                          const newVal = !arbitraje[lado].pagado
                          setArbitraje(a => ({ ...a, [lado]: { ...a[lado], pagado: newVal } }))
                          saveArbitraje.mutate({ lado, pagado: newVal })
                        }}
                        className={`w-12 h-6 rounded-full transition-all cursor-pointer relative ${arbitraje[lado].pagado ? 'bg-green-500' : 'bg-slate-600'}`}
                        role="switch"
                        aria-checked={arbitraje[lado].pagado}
                      >
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-transform ${arbitraje[lado].pagado ? 'translate-x-6' : 'translate-x-0.5'}`} style={{ background: '#fff' }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3 — MVP & Notas */}
          {tab === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-fg-muted)' }}>
                  <Star size={12} className="inline mr-1" style={{ color: '#F59E0B' }} />
                  Jugador MVP
                </label>
                <select
                  value={mvp}
                  onChange={e => setMvp(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                  style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                >
                  <option value="">Sin MVP</option>
                  {jugadoresLocal.map(j => <option key={j._id} value={j._id}>{j.nombre} ({localNombre})</option>)}
                  {jugadoresVisitante.map(j => <option key={j._id} value={j._id}>{j.nombre} ({visitanteNombre})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-fg-muted)' }}>Notas del partido</label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  rows={4}
                  placeholder="Observaciones, incidencias..."
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t flex gap-3" style={{ borderColor: 'var(--color-border)' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}>Cancelar</button>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
            style={{ background: 'var(--color-accent)', color: '#020617' }}
          >
            {save.isPending ? 'Guardando...' : 'Guardar resultado'}
          </button>
        </div>
      </div>
    </div>
  )
}
