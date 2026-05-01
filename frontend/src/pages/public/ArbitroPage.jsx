import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Trash2, ChevronDown, CheckCircle2, Trophy } from 'lucide-react'
import client from '../../api/client'

const TIPO_GOL = ['normal', 'penal', 'autogol']

function ScoreCounter({ value, onChange, color }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold cursor-pointer select-none active:scale-95 transition-transform"
        style={{ background: 'var(--color-secondary)', color: 'var(--color-fg-muted)', border: '1px solid var(--color-border)' }}
      >−</button>
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center font-display text-5xl"
        style={{ background: color + '18', color, border: `2px solid ${color}44`, fontFamily: 'var(--font-display)' }}
      >
        {value}
      </div>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold cursor-pointer select-none active:scale-95 transition-transform"
        style={{ background: color + '22', color, border: `1px solid ${color}44` }}
      >+</button>
    </div>
  )
}

function GolRow({ gol, idx, jugadores, equipo, onUpdate, onRemove }) {
  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: equipo.color_principal || 'var(--color-accent)' }}>{equipo.nombre}</span>
        <button type="button" onClick={onRemove} className="p-1 rounded-lg cursor-pointer" style={{ color: 'var(--color-destructive)' }}>
          <Trash2 size={14} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={gol.jugador_id}
          onChange={e => onUpdate({ jugador_id: e.target.value })}
          className="col-span-2 px-3 py-2 rounded-xl text-sm outline-none cursor-pointer"
          style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
        >
          <option value="">Jugador</option>
          {jugadores.map(j => <option key={j._id} value={j._id}>{j.nombre}</option>)}
        </select>
        <input
          type="number" min="0" max="120" placeholder="Min"
          value={gol.minuto}
          onChange={e => onUpdate({ minuto: e.target.value })}
          className="px-3 py-2 rounded-xl text-sm outline-none text-center"
          style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
        />
      </div>
      <select
        value={gol.tipo}
        onChange={e => onUpdate({ tipo: e.target.value })}
        className="w-full px-3 py-2 rounded-xl text-sm outline-none cursor-pointer"
        style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
      >
        {TIPO_GOL.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
      </select>
    </div>
  )
}

export default function ArbitroPage() {
  const { token } = useParams()
  const [scoreLocal, setScoreLocal] = useState(0)
  const [scoreVisitante, setScoreVisitante] = useState(0)
  const [goles, setGoles] = useState([])
  const [mvp, setMvp] = useState('')
  const [done, setDone] = useState(false)
  const [showGoles, setShowGoles] = useState(true)
  const [showMvp, setShowMvp] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['arbitro', token],
    queryFn: () => client.get(`/arbitro/${token}`).then(r => r.data),
    onSuccess: d => {
      if (d.partido.estado === 'jugado') {
        setScoreLocal(d.partido.goles_local ?? 0)
        setScoreVisitante(d.partido.goles_visitante ?? 0)
        setDone(true)
      }
    },
  })

  const submit = useMutation({
    mutationFn: () => client.put(`/arbitro/${token}/resultado`, {
      goles_local: scoreLocal,
      goles_visitante: scoreVisitante,
      goles: goles.map(g => ({
        jugador_id: g.jugador_id || undefined,
        equipo_id: g.equipo_id,
        minuto: g.minuto ? Number(g.minuto) : null,
        tipo: g.tipo || 'normal',
      })),
      mvp_jugador_id: mvp || null,
    }),
    onSuccess: () => setDone(true),
  })

  function addGol(equipo) {
    setGoles(prev => [...prev, { equipo_id: equipo._id, _equipoKey: equipo._id, jugador_id: '', minuto: '', tipo: 'normal', _equipo: equipo }])
  }

  function updateGol(idx, patch) {
    setGoles(prev => prev.map((g, i) => i === idx ? { ...g, ...patch } : g))
  }

  function removeGol(idx) {
    setGoles(prev => prev.filter((_, i) => i !== idx))
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)', color: 'var(--color-fg-muted)' }}>
      Cargando partido...
    </div>
  )

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center text-center px-6" style={{ background: 'var(--color-bg)' }}>
      <div>
        <p className="text-4xl mb-4">🚫</p>
        <p className="font-semibold mb-2" style={{ color: 'var(--color-fg)' }}>Enlace inválido</p>
        <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>Este enlace de árbitro no existe o expiró.</p>
      </div>
    </div>
  )

  const { partido, jugadoresLocal, jugadoresVisitante } = data
  const local = partido.equipo_local_id
  const visitante = partido.equipo_visitante_id
  const colorL = local.color_principal || '#22C55E'
  const colorV = visitante.color_principal || '#3B82F6'
  const todosJugadores = [
    ...jugadoresLocal.map(j => ({ ...j, _equipo: local.nombre })),
    ...jugadoresVisitante.map(j => ({ ...j, _equipo: visitante.nombre })),
  ]

  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--color-bg)' }}>
      <CheckCircle2 size={64} className="mb-4" style={{ color: '#22C55E' }} />
      <h1 className="font-display text-3xl mb-2" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>RESULTADO ENVIADO</h1>
      <div className="flex items-center gap-6 my-6">
        <div className="text-center">
          <p className="text-xs mb-1" style={{ color: colorL }}>{local.nombre}</p>
          <p className="font-display text-5xl" style={{ color: colorL, fontFamily: 'var(--font-display)' }}>{scoreLocal}</p>
        </div>
        <p className="font-display text-2xl" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>–</p>
        <div className="text-center">
          <p className="text-xs mb-1" style={{ color: colorV }}>{visitante.nombre}</p>
          <p className="font-display text-5xl" style={{ color: colorV, fontFamily: 'var(--font-display)' }}>{scoreVisitante}</p>
        </div>
      </div>
      <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>El administrador puede revisar el resultado en el panel.</p>
    </div>
  )

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4" style={{ background: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Trophy size={16} style={{ color: 'var(--color-accent)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>
            Jornada {partido.jornada_id?.numero}
            {partido.hora ? ` · ${partido.hora}` : ''}
            {partido.cancha ? ` · Cancha ${partido.cancha}` : ''}
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>Captura de resultado — Árbitro</p>
      </div>

      <div className="px-4 pt-6 max-w-sm mx-auto space-y-6">

        {/* Score */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-around">
            <div className="text-center flex-1">
              <p className="text-xs font-semibold mb-3 truncate" style={{ color: colorL }}>{local.nombre}</p>
              <ScoreCounter value={scoreLocal} onChange={setScoreLocal} color={colorL} />
            </div>
            <div className="font-display text-2xl px-4" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>VS</div>
            <div className="text-center flex-1">
              <p className="text-xs font-semibold mb-3 truncate" style={{ color: colorV }}>{visitante.nombre}</p>
              <ScoreCounter value={scoreVisitante} onChange={setScoreVisitante} color={colorV} />
            </div>
          </div>
        </div>

        {/* Goles section */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
          <button
            type="button"
            onClick={() => setShowGoles(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--color-fg)' }}>
              Goles ({goles.length})
            </span>
            <ChevronDown size={16} style={{ color: 'var(--color-fg-muted)', transform: showGoles ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {showGoles && (
            <div className="px-4 pb-4 space-y-3">
              {goles.map((g, idx) => (
                <GolRow
                  key={idx}
                  gol={g}
                  idx={idx}
                  equipo={g._equipo}
                  jugadores={g._equipo._id === local._id ? jugadoresLocal : jugadoresVisitante}
                  onUpdate={patch => updateGol(idx, patch)}
                  onRemove={() => removeGol(idx)}
                />
              ))}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => addGol(local)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium cursor-pointer active:scale-95 transition-transform"
                  style={{ background: colorL + '18', color: colorL, border: `1px solid ${colorL}33` }}
                >
                  <Plus size={14} /> {local.nombre}
                </button>
                <button
                  type="button"
                  onClick={() => addGol(visitante)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium cursor-pointer active:scale-95 transition-transform"
                  style={{ background: colorV + '18', color: colorV, border: `1px solid ${colorV}33` }}
                >
                  <Plus size={14} /> {visitante.nombre}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MVP section */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
          <button
            type="button"
            onClick={() => setShowMvp(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--color-fg)' }}>
              MVP {mvp ? '⭐' : ''}
            </span>
            <ChevronDown size={16} style={{ color: 'var(--color-fg-muted)', transform: showMvp ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {showMvp && (
            <div className="px-4 pb-4">
              <div className="grid grid-cols-2 gap-2">
                {todosJugadores.map(j => {
                  const isSelected = mvp === j._id
                  const color = jugadoresLocal.find(x => x._id === j._id) ? colorL : colorV
                  return (
                    <button
                      key={j._id}
                      type="button"
                      onClick={() => setMvp(isSelected ? '' : j._id)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left cursor-pointer active:scale-95 transition-all"
                      style={{
                        background: isSelected ? color + '22' : 'var(--color-secondary)',
                        border: `1px solid ${isSelected ? color : 'var(--color-border)'}`,
                      }}
                    >
                      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                        style={{ background: color + '33', color }}>
                        {j.nombre.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--color-fg)' }}>{j.nombre}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--color-fg-muted)' }}>{j._equipo}</p>
                      </div>
                      {isSelected && <span className="ml-auto">⭐</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky submit */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4" style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
        <button
          type="button"
          onClick={() => submit.mutate()}
          disabled={submit.isPending}
          className="w-full max-w-sm mx-auto block py-4 rounded-2xl text-base font-bold cursor-pointer disabled:opacity-60 active:scale-98 transition-transform"
          style={{ background: 'var(--color-accent)', color: '#020617' }}
        >
          {submit.isPending ? 'Enviando...' : `Registrar ${scoreLocal} – ${scoreVisitante}`}
        </button>
        {submit.isError && (
          <p className="text-center text-xs mt-2" style={{ color: 'var(--color-destructive)' }}>
            {submit.error?.response?.data?.error || 'Error al enviar'}
          </p>
        )}
      </div>
    </div>
  )
}
