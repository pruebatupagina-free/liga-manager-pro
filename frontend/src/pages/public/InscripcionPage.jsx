import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Trash2, CheckCircle2, Users, ChevronDown } from 'lucide-react'
import client from '../../api/client'

const POSICIONES = ['Portero', 'Defensa', 'Mediocampista', 'Delantero']
const COLORES = ['#22C55E', '#3B82F6', '#EF4444', '#F59E0B', '#A855F7', '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#64748B']

export default function InscripcionPage() {
  const { token } = useParams()
  const [form, setForm] = useState({
    nombre_equipo: '',
    color: '#22C55E',
    nombre_capitan: '',
    whatsapp: '',
  })
  const [jugadores, setJugadores] = useState([])
  const [showJugadores, setShowJugadores] = useState(false)
  const [done, setDone] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['inscripcion-form', token],
    queryFn: () => client.get(`/inscripciones/${token}`).then(r => r.data),
    retry: false,
  })

  const submit = useMutation({
    mutationFn: () => client.post(`/inscripciones/${token}`, { ...form, jugadores }),
    onSuccess: () => setDone(true),
  })

  function addJugador() {
    setJugadores(prev => [...prev, { nombre: '', numero_camiseta: '', posicion: '' }])
  }

  function updateJugador(idx, patch) {
    setJugadores(prev => prev.map((j, i) => i === idx ? { ...j, ...patch } : j))
  }

  function removeJugador(idx) {
    setJugadores(prev => prev.filter((_, i) => i !== idx))
  }

  const canSubmit = form.nombre_equipo.trim() && form.nombre_capitan.trim() && form.whatsapp.trim()

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)', color: 'var(--color-fg-muted)' }}>
      Cargando...
    </div>
  )

  if (error) {
    const msg = error.response?.data?.error || 'Enlace inválido'
    const cerrado = msg.includes('cerradas')
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--color-bg)' }}>
        <p className="text-5xl mb-4">{cerrado ? '🔒' : '🚫'}</p>
        <p className="font-semibold text-lg mb-2" style={{ color: 'var(--color-fg)' }}>
          {cerrado ? 'Inscripciones cerradas' : 'Enlace inválido'}
        </p>
        <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>{msg}</p>
      </div>
    )
  }

  const liga = data?.liga
  const color = form.color

  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--color-bg)' }}>
      <CheckCircle2 size={64} className="mb-4" style={{ color: '#22C55E' }} />
      <h1 className="font-display text-3xl mb-2" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
        ¡INSCRIPCIÓN ENVIADA!
      </h1>
      <p className="text-base mb-1" style={{ color: color }}>{form.nombre_equipo}</p>
      <p className="text-sm mt-2" style={{ color: 'var(--color-fg-muted)' }}>
        El administrador revisará tu solicitud y te contactará por WhatsApp.
      </p>
    </div>
  )

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--color-bg)' }}>

      {/* Header liga */}
      <div className="px-4 pt-8 pb-6 text-center" style={{ background: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
          style={{ background: 'var(--color-accent)' + '22', border: '2px solid var(--color-accent)' }}>
          <Users size={24} style={{ color: 'var(--color-accent)' }} />
        </div>
        <h1 className="font-display text-2xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
          {liga?.nombre}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-fg-muted)' }}>Formulario de inscripción</p>
      </div>

      <div className="px-4 pt-6 max-w-sm mx-auto space-y-4">

        {/* Color selector */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-fg-muted)' }}>Color del equipo</p>
          <div className="flex gap-2 flex-wrap">
            {COLORES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setForm(f => ({ ...f, color: c }))}
                className="w-9 h-9 rounded-xl cursor-pointer active:scale-90 transition-transform flex items-center justify-center"
                style={{ background: c, border: color === c ? '3px solid white' : '3px solid transparent', boxShadow: color === c ? `0 0 0 2px ${c}` : 'none' }}
              >
                {color === c && <span style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Datos del equipo */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--color-primary)', border: `1px solid ${color}33` }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>Equipo</p>
          <input
            type="text"
            placeholder="Nombre del equipo *"
            value={form.nombre_equipo}
            onChange={e => setForm(f => ({ ...f, nombre_equipo: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--color-secondary)', border: `1px solid var(--color-border)`, color: 'var(--color-fg)' }}
          />
          <input
            type="text"
            placeholder="Nombre del capitán *"
            value={form.nombre_capitan}
            onChange={e => setForm(f => ({ ...f, nombre_capitan: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
          />
          <input
            type="tel"
            placeholder="WhatsApp del capitán *"
            value={form.whatsapp}
            onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
          />
        </div>

        {/* Reglamento */}
        {liga?.reglamento?.trim() && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-fg-muted)' }}>Reglamento</p>
            <pre className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--color-fg-muted)', fontFamily: 'inherit' }}>
              {liga.reglamento}
            </pre>
          </div>
        )}

        {/* Jugadores (opcional) */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
          <button
            type="button"
            onClick={() => setShowJugadores(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
          >
            <span className="text-sm font-semibold" style={{ color: 'var(--color-fg)' }}>
              Jugadores ({jugadores.length}) — opcional
            </span>
            <ChevronDown size={16} style={{ color: 'var(--color-fg-muted)', transform: showJugadores ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {showJugadores && (
            <div className="px-4 pb-4 space-y-3">
              <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>Puedes agregar tu plantilla ahora o después.</p>
              {jugadores.map((j, idx) => (
                <div key={idx} className="rounded-xl p-3 space-y-2" style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: color }}>Jugador {idx + 1}</span>
                    <button type="button" onClick={() => removeJugador(idx)} className="p-1 cursor-pointer" style={{ color: 'var(--color-destructive)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Nombre *"
                    value={j.nombre}
                    onChange={e => updateJugador(idx, { nombre: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="# Camiseta"
                      value={j.numero_camiseta}
                      onChange={e => updateJugador(idx, { numero_camiseta: e.target.value })}
                      className="px-3 py-2 rounded-xl text-sm outline-none"
                      style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                    />
                    <select
                      value={j.posicion}
                      onChange={e => updateJugador(idx, { posicion: e.target.value })}
                      className="px-3 py-2 rounded-xl text-sm outline-none cursor-pointer"
                      style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
                    >
                      <option value="">Posición</option>
                      {POSICIONES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addJugador}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm cursor-pointer"
                style={{ background: color + '18', color, border: `1px dashed ${color}55` }}
              >
                <Plus size={16} /> Agregar jugador
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sticky submit */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4" style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)' }}>
        <button
          type="button"
          onClick={() => submit.mutate()}
          disabled={submit.isPending || !canSubmit}
          className="w-full max-w-sm mx-auto block py-4 rounded-2xl text-base font-bold cursor-pointer disabled:opacity-50 active:scale-98 transition-transform"
          style={{ background: color, color: '#fff' }}
        >
          {submit.isPending ? 'Enviando...' : 'Enviar inscripción'}
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
