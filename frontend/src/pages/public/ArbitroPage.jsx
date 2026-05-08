import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, ChevronDown, CheckCircle2, Trophy, Play, Square, Star } from 'lucide-react'
import client from '../../api/client'

const TIPO_GOL = ['normal', 'penal', 'autogol']
const TIPO_TARJETA = ['amarilla', 'roja']

// ─── Event Modal ──────────────────────────────────────────────────────────────

function EventModal({ tipo, equipo, jugadores, onConfirm, onCancel, isPending }) {
  const isGol = tipo === 'gol'
  const [jugador_id, setJugador] = useState('')
  const [subtipo, setSubtipo] = useState(isGol ? 'normal' : 'amarilla')
  const [minuto, setMinuto] = useState('')

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(2,6,23,0.85)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl p-6 pb-8 space-y-4"
        style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
        onClick={e => e.stopPropagation()}
      >
        <p className="text-base font-bold" style={{ color: 'var(--color-fg)' }}>
          {isGol ? '⚽' : '🟨'} {isGol ? 'Gol' : 'Tarjeta'} — {equipo.nombre}
        </p>

        {/* Player select */}
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-fg-muted)' }}>
            Jugador {isGol ? '(opcional)' : ''}
          </label>
          <select
            value={jugador_id}
            onChange={e => setJugador(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
            style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
          >
            <option value="">— Sin asignar —</option>
            {jugadores.map(j => (
              <option key={j._id} value={j._id}>
                {j.numero_camiseta ? `#${j.numero_camiseta} ` : ''}{j.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo pills */}
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-fg-muted)' }}>Tipo</label>
          <div className="flex gap-2">
            {(isGol ? TIPO_GOL : TIPO_TARJETA).map(t => {
              const cardColor = t === 'amarilla' ? '#F59E0B' : t === 'roja' ? '#EF4444' : null
              const isSelected = subtipo === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSubtipo(t)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold capitalize cursor-pointer transition-all"
                  style={{
                    background: isSelected
                      ? (cardColor ? cardColor + '33' : 'var(--color-accent)' + '33')
                      : 'var(--color-secondary)',
                    color: isSelected ? (cardColor || 'var(--color-accent)') : 'var(--color-fg-muted)',
                    border: `1px solid ${isSelected ? (cardColor || 'var(--color-accent)') : 'var(--color-border)'}`,
                  }}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>

        {/* Minute */}
        <div>
          <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-fg-muted)' }}>Minuto (opcional)</label>
          <input
            type="number" min="1" max="120" placeholder="ej. 45"
            value={minuto}
            onChange={e => setMinuto(e.target.value)}
            className="w-24 px-3 py-2.5 rounded-xl text-sm outline-none text-center"
            style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer"
            style={{ background: 'var(--color-secondary)', color: 'var(--color-fg-muted)', border: '1px solid var(--color-border)' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm({ jugador_id: jugador_id || null, tipo: subtipo, minuto: minuto || null })}
            disabled={isPending || (!isGol && !jugador_id)}
            className="flex-1 py-3 rounded-xl text-sm font-bold cursor-pointer disabled:opacity-60"
            style={{ background: 'var(--color-accent)', color: '#020617' }}
          >
            {isPending ? '...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Live Scorer ──────────────────────────────────────────────────────────────

function LiveScorer({ token, data, queryClient }) {
  const { partido, jugadoresLocal, jugadoresVisitante, goles = [], tarjetas = [] } = data
  const local = partido.equipo_local_id
  const visitante = partido.equipo_visitante_id
  const colorL = local.color_principal || '#22C55E'
  const colorV = visitante.color_principal || '#3B82F6'

  const [modal, setModal] = useState(null)
  const [showMvp, setShowMvp] = useState(false)
  const [mvp, setMvp] = useState(partido.mvp_jugador_id?._id || '')

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['arbitro', token] })
  }

  const addGol = useMutation({
    mutationFn: body => client.post(`/arbitro/${token}/gol`, body),
    onSuccess: () => { setModal(null); invalidate() },
  })

  const removeGol = useMutation({
    mutationFn: golId => client.delete(`/arbitro/${token}/gol/${golId}`),
    onSuccess: invalidate,
  })

  const addTarjeta = useMutation({
    mutationFn: body => client.post(`/arbitro/${token}/tarjeta`, body),
    onSuccess: () => { setModal(null); invalidate() },
  })

  const removeTarjeta = useMutation({
    mutationFn: tid => client.delete(`/arbitro/${token}/tarjeta/${tid}`),
    onSuccess: invalidate,
  })

  const finalizar = useMutation({
    mutationFn: () => client.put(`/arbitro/${token}/finalizar`, { mvp_jugador_id: mvp || null }),
    onSuccess: invalidate,
  })

  function openModal(tipo, equipo) {
    setModal({ tipo, equipo })
  }

  function handleConfirm(form) {
    const equipo = modal.equipo === 'local' ? local : visitante
    if (modal.tipo === 'gol') {
      addGol.mutate({ ...form, equipo_id: equipo._id })
    } else {
      addTarjeta.mutate({ ...form, equipo_id: equipo._id })
    }
  }

  // Chronological events merged
  const events = [
    ...goles.map(g => ({ ...g, _kind: 'gol', _t: g.createdAt })),
    ...tarjetas.map(t => ({ ...t, _kind: 'tarjeta', _t: t.createdAt })),
  ].sort((a, b) => {
    const aMin = a.minuto ?? 999
    const bMin = b.minuto ?? 999
    return aMin !== bMin ? aMin - bMin : new Date(a._t) - new Date(b._t)
  })

  const todosJugadores = [
    ...jugadoresLocal.map(j => ({ ...j, _equipoNombre: local.nombre })),
    ...jugadoresVisitante.map(j => ({ ...j, _equipoNombre: visitante.nombre })),
  ]

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--color-bg)' }}>

      {/* Header */}
      <div className="px-4 pt-5 pb-4" style={{ background: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold"
            style={{ background: '#EF444422', color: '#EF4444' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
            EN VIVO
          </span>
          <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
            J{partido.jornada_id?.numero}
            {partido.hora ? ` · ${partido.hora}` : ''}
            {partido.cancha ? ` · Cancha ${partido.cancha}` : ''}
          </span>
        </div>
      </div>

      <div className="px-4 pt-5 max-w-sm mx-auto space-y-5">

        {/* Scoreboard */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="text-center">
              <p className="text-xs font-bold truncate mb-2" style={{ color: colorL }}>{local.nombre}</p>
              <p className="font-display text-6xl leading-none" style={{ color: colorL, fontFamily: 'var(--font-display)' }}>
                {partido.goles_local ?? 0}
              </p>
            </div>
            <p className="font-display text-2xl" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>–</p>
            <div className="text-center">
              <p className="text-xs font-bold truncate mb-2" style={{ color: colorV }}>{visitante.nombre}</p>
              <p className="font-display text-6xl leading-none" style={{ color: colorV, fontFamily: 'var(--font-display)' }}>
                {partido.goles_visitante ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => openModal('gol', 'local')}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold cursor-pointer active:scale-95 transition-transform"
              style={{ background: colorL + '22', color: colorL, border: `1px solid ${colorL}44` }}
            >
              <Plus size={16} /> Gol Local
            </button>
            <button
              type="button"
              onClick={() => openModal('gol', 'visitante')}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold cursor-pointer active:scale-95 transition-transform"
              style={{ background: colorV + '22', color: colorV, border: `1px solid ${colorV}44` }}
            >
              <Plus size={16} /> Gol Visitante
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => openModal('tarjeta', 'local')}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold cursor-pointer active:scale-95 transition-transform"
              style={{ background: '#F59E0B18', color: '#F59E0B', border: '1px solid #F59E0B33' }}
            >
              🟨 Tarjeta Local
            </button>
            <button
              type="button"
              onClick={() => openModal('tarjeta', 'visitante')}
              className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold cursor-pointer active:scale-95 transition-transform"
              style={{ background: '#F59E0B18', color: '#F59E0B', border: '1px solid #F59E0B33' }}
            >
              🟨 Tarjeta Visitante
            </button>
          </div>
        </div>

        {/* Events log */}
        {events.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
            <p className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-fg-muted)', borderBottom: '1px solid var(--color-border)' }}>
              Eventos ({events.length})
            </p>
            <div className="divide-y" style={{ '--tw-divide-opacity': 1, borderColor: 'var(--color-border)' }}>
              {events.map(ev => {
                if (ev._kind === 'gol') {
                  const esLocal = ev.equipo_id?.toString() === local._id?.toString()
                  const color = esLocal ? colorL : colorV
                  return (
                    <div key={ev._id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="text-base">⚽</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>
                          {ev.jugador_id?.nombre || '—'}
                          {ev.tipo !== 'normal' && <span className="ml-1 text-xs" style={{ color: 'var(--color-fg-muted)' }}>({ev.tipo})</span>}
                        </p>
                        <p className="text-xs" style={{ color }}>
                          {esLocal ? local.nombre : visitante.nombre}
                          {ev.minuto != null ? ` · ${ev.minuto}'` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeGol.mutate(ev._id)}
                        disabled={removeGol.isPending}
                        className="p-1.5 rounded-lg cursor-pointer"
                        style={{ color: 'var(--color-fg-muted)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                }
                // tarjeta
                const esLocal = ev.equipo_id?.toString() === local._id?.toString()
                const color = esLocal ? colorL : colorV
                const cardColor = ev.tipo === 'roja' ? '#EF4444' : '#F59E0B'
                return (
                  <div key={ev._id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-4 h-5 rounded-sm flex-shrink-0" style={{ background: cardColor }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>
                        {ev.jugador_id?.nombre || '—'}
                      </p>
                      <p className="text-xs" style={{ color }}>
                        {esLocal ? local.nombre : visitante.nombre}
                        {ev.minuto != null ? ` · ${ev.minuto}'` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTarjeta.mutate(ev._id)}
                      disabled={removeTarjeta.isPending}
                      className="p-1.5 rounded-lg cursor-pointer"
                      style={{ color: 'var(--color-fg-muted)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* MVP */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
          <button
            type="button"
            onClick={() => setShowMvp(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--color-fg)' }}>
              MVP {mvp ? '⭐' : '(opcional)'}
            </span>
            <ChevronDown size={16} style={{
              color: 'var(--color-fg-muted)',
              transform: showMvp ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }} />
          </button>
          {showMvp && (
            <div className="px-4 pb-4 grid grid-cols-2 gap-2">
              {todosJugadores.map(j => {
                const isSelected = mvp === j._id
                const isLocalPlayer = jugadoresLocal.some(x => x._id === j._id)
                const color = isLocalPlayer ? colorL : colorV
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
                      <p className="text-xs truncate" style={{ color: 'var(--color-fg-muted)' }}>{j._equipoNombre}</p>
                    </div>
                    {isSelected && <Star size={12} style={{ marginLeft: 'auto', color: 'var(--color-accent)', fill: 'var(--color-accent)' }} />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Fixed footer: Finalizar */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4" style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
        <button
          type="button"
          onClick={() => {
            if (!window.confirm('¿Finalizar el partido? Esta acción no se puede deshacer.')) return
            finalizar.mutate()
          }}
          disabled={finalizar.isPending}
          className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold cursor-pointer disabled:opacity-60"
          style={{ background: '#EF444422', color: '#EF4444', border: '1px solid #EF444444' }}
        >
          <Square size={16} />
          {finalizar.isPending ? 'Finalizando...' : 'Finalizar Partido'}
        </button>
        {finalizar.isError && (
          <p className="text-center text-xs mt-2" style={{ color: '#EF4444' }}>
            {finalizar.error?.response?.data?.error || 'Error al finalizar'}
          </p>
        )}
      </div>

      {/* Modal overlay */}
      {modal && (
        <EventModal
          tipo={modal.tipo}
          equipo={modal.equipo === 'local' ? local : visitante}
          jugadores={modal.equipo === 'local' ? jugadoresLocal : jugadoresVisitante}
          onConfirm={handleConfirm}
          onCancel={() => setModal(null)}
          isPending={addGol.isPending || addTarjeta.isPending}
        />
      )}
    </div>
  )
}

// ─── Pending State ────────────────────────────────────────────────────────────

function PendingState({ token, data, queryClient }) {
  const { partido, jugadoresLocal, jugadoresVisitante } = data
  const local = partido.equipo_local_id
  const visitante = partido.equipo_visitante_id
  const colorL = local.color_principal || '#22C55E'
  const colorV = visitante.color_principal || '#3B82F6'

  const [clasico, setClasico] = useState(false)
  const [scoreLocal, setScoreLocal] = useState(0)
  const [scoreVisitante, setScoreVisitante] = useState(0)
  const [goles, setGoles] = useState([])

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['arbitro', token] })
  }

  const iniciar = useMutation({
    mutationFn: () => client.put(`/arbitro/${token}/iniciar`),
    onSuccess: invalidate,
  })

  const submitClasico = useMutation({
    mutationFn: () => client.put(`/arbitro/${token}/resultado`, {
      goles_local: scoreLocal,
      goles_visitante: scoreVisitante,
      goles: goles.map(g => ({
        jugador_id: g.jugador_id || undefined,
        equipo_id: g.equipo_id,
        minuto: g.minuto ? Number(g.minuto) : null,
        tipo: g.tipo || 'normal',
      })),
    }),
    onSuccess: invalidate,
  })

  return (
    <div className="min-h-screen pb-10" style={{ background: 'var(--color-bg)' }}>
      <div className="px-4 pt-5 pb-4" style={{ background: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <Trophy size={14} style={{ color: 'var(--color-accent)' }} />
          <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
            J{partido.jornada_id?.numero}
            {partido.hora ? ` · ${partido.hora}` : ''}
            {partido.cancha ? ` · Cancha ${partido.cancha}` : ''}
          </span>
        </div>
      </div>

      <div className="px-4 pt-6 max-w-sm mx-auto space-y-5">
        {/* Teams card */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
          <div className="grid grid-cols-3 items-center gap-3">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-2"
                style={{ background: colorL + '22', color: colorL }}>
                {local.nombre.charAt(0)}
              </div>
              <p className="text-xs font-semibold truncate" style={{ color: colorL }}>{local.nombre}</p>
            </div>
            <p className="text-center font-display text-xl" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>VS</p>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-2"
                style={{ background: colorV + '22', color: colorV }}>
                {visitante.nombre.charAt(0)}
              </div>
              <p className="text-xs font-semibold truncate" style={{ color: colorV }}>{visitante.nombre}</p>
            </div>
          </div>
        </div>

        {/* Live start CTA */}
        {!clasico && (
          <>
            <button
              type="button"
              onClick={() => iniciar.mutate()}
              disabled={iniciar.isPending}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-base font-bold cursor-pointer disabled:opacity-60 active:scale-98 transition-transform"
              style={{ background: 'var(--color-accent)', color: '#020617' }}
            >
              <Play size={18} fill="#020617" />
              {iniciar.isPending ? 'Iniciando...' : 'Iniciar Partido en Vivo'}
            </button>
            {iniciar.isError && (
              <p className="text-center text-xs" style={{ color: '#EF4444' }}>
                {iniciar.error?.response?.data?.error || 'Error al iniciar'}
              </p>
            )}
            <button
              type="button"
              onClick={() => setClasico(true)}
              className="w-full text-center text-sm cursor-pointer py-2"
              style={{ color: 'var(--color-fg-muted)' }}
            >
              Capturar solo el resultado final →
            </button>
          </>
        )}

        {/* Classic mode form */}
        {clasico && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setClasico(false)}
              className="text-sm cursor-pointer"
              style={{ color: 'var(--color-accent)' }}
            >
              ← Volver al modo en vivo
            </button>

            {/* Score counters */}
            <div className="rounded-2xl p-5" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-around gap-4">
                <ScoreBlock label={local.nombre} color={colorL} value={scoreLocal} onChange={setScoreLocal} />
                <p className="font-display text-2xl" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>–</p>
                <ScoreBlock label={visitante.nombre} color={colorV} value={scoreVisitante} onChange={setScoreVisitante} />
              </div>
            </div>

            {/* Quick goles */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-fg)' }}>Goles ({goles.length})</p>
              {goles.map((g, idx) => (
                <QuickGolRow
                  key={idx}
                  gol={g}
                  equipo={g._equipo}
                  jugadores={g._equipo._id === local._id ? jugadoresLocal : jugadoresVisitante}
                  onUpdate={patch => setGoles(prev => prev.map((x, i) => i === idx ? { ...x, ...patch } : x))}
                  onRemove={() => setGoles(prev => prev.filter((_, i) => i !== idx))}
                />
              ))}
              <div className="grid grid-cols-2 gap-2">
                <button type="button"
                  onClick={() => setGoles(p => [...p, { equipo_id: local._id, _equipo: local, jugador_id: '', minuto: '', tipo: 'normal' }])}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium cursor-pointer active:scale-95 transition-transform"
                  style={{ background: colorL + '18', color: colorL, border: `1px solid ${colorL}33` }}>
                  <Plus size={13} /> {local.nombre}
                </button>
                <button type="button"
                  onClick={() => setGoles(p => [...p, { equipo_id: visitante._id, _equipo: visitante, jugador_id: '', minuto: '', tipo: 'normal' }])}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium cursor-pointer active:scale-95 transition-transform"
                  style={{ background: colorV + '18', color: colorV, border: `1px solid ${colorV}33` }}>
                  <Plus size={13} /> {visitante.nombre}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => submitClasico.mutate()}
              disabled={submitClasico.isPending}
              className="w-full py-4 rounded-2xl text-base font-bold cursor-pointer disabled:opacity-60"
              style={{ background: 'var(--color-accent)', color: '#020617' }}
            >
              {submitClasico.isPending ? 'Enviando...' : `Registrar ${scoreLocal} – ${scoreVisitante}`}
            </button>
            {submitClasico.isError && (
              <p className="text-center text-xs" style={{ color: '#EF4444' }}>
                {submitClasico.error?.response?.data?.error || 'Error al enviar'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ScoreBlock({ label, color, value, onChange }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-semibold truncate max-w-[80px] text-center" style={{ color }}>{label}</p>
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))}
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold cursor-pointer"
        style={{ background: 'var(--color-secondary)', color: 'var(--color-fg-muted)', border: '1px solid var(--color-border)' }}>−
      </button>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-display text-4xl"
        style={{ background: color + '18', color, border: `2px solid ${color}44`, fontFamily: 'var(--font-display)' }}>
        {value}
      </div>
      <button type="button" onClick={() => onChange(value + 1)}
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold cursor-pointer"
        style={{ background: color + '22', color, border: `1px solid ${color}44` }}>+
      </button>
    </div>
  )
}

function QuickGolRow({ gol, equipo, jugadores, onUpdate, onRemove }) {
  return (
    <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold" style={{ color: equipo.color_principal || 'var(--color-accent)' }}>{equipo.nombre}</span>
        <button type="button" onClick={onRemove} className="p-1 cursor-pointer" style={{ color: 'var(--color-destructive)' }}>
          <Trash2 size={13} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select value={gol.jugador_id} onChange={e => onUpdate({ jugador_id: e.target.value })}
          className="col-span-2 px-2 py-2 rounded-xl text-xs outline-none cursor-pointer"
          style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}>
          <option value="">Jugador</option>
          {jugadores.map(j => <option key={j._id} value={j._id}>{j.nombre}</option>)}
        </select>
        <input type="number" min="0" max="120" placeholder="Min"
          value={gol.minuto} onChange={e => onUpdate({ minuto: e.target.value })}
          className="px-2 py-2 rounded-xl text-xs outline-none text-center"
          style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }} />
      </div>
      <select value={gol.tipo} onChange={e => onUpdate({ tipo: e.target.value })}
        className="w-full px-2 py-2 rounded-xl text-xs outline-none cursor-pointer"
        style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}>
        {TIPO_GOL.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
      </select>
    </div>
  )
}

// ─── Done State ───────────────────────────────────────────────────────────────

function DoneState({ partido }) {
  const local = partido.equipo_local_id
  const visitante = partido.equipo_visitante_id
  const colorL = local.color_principal || '#22C55E'
  const colorV = visitante.color_principal || '#3B82F6'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--color-bg)' }}>
      <CheckCircle2 size={64} className="mb-4" style={{ color: '#22C55E' }} />
      <h1 className="font-display text-3xl mb-2" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>RESULTADO ENVIADO</h1>
      <div className="flex items-center gap-6 my-6">
        <div className="text-center">
          <p className="text-xs mb-1" style={{ color: colorL }}>{local.nombre}</p>
          <p className="font-display text-5xl" style={{ color: colorL, fontFamily: 'var(--font-display)' }}>{partido.goles_local}</p>
        </div>
        <p className="font-display text-2xl" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>–</p>
        <div className="text-center">
          <p className="text-xs mb-1" style={{ color: colorV }}>{visitante.nombre}</p>
          <p className="font-display text-5xl" style={{ color: colorV, fontFamily: 'var(--font-display)' }}>{partido.goles_visitante}</p>
        </div>
      </div>
      <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>El administrador puede revisar el resultado en el panel.</p>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ArbitroPage() {
  const { token } = useParams()
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['arbitro', token],
    queryFn: () => client.get(`/arbitro/${token}`).then(r => r.data),
    refetchInterval: (query) => {
      const estado = query.state.data?.partido?.estado
      return estado === 'en_curso' ? 15000 : false
    },
  })

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

  const estado = data.partido?.estado

  if (estado === 'jugado' || estado === 'wo') return <DoneState partido={data.partido} />
  if (estado === 'en_curso') return <LiveScorer token={token} data={data} queryClient={queryClient} />
  return <PendingState token={token} data={data} queryClient={queryClient} />
}
