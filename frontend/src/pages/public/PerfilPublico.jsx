import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Calendar, ChevronDown, ChevronRight, Star } from 'lucide-react'
import client from '../../api/client'
import useDocumentMeta from '../../hooks/useDocumentMeta'

const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function formatFecha(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return `${DIAS_ES[d.getDay()]} ${d.getDate()} de ${MESES_ES[d.getMonth()]} ${d.getFullYear()}`
}

function formatFechaCorta(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return `${DIAS_ES[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
}

function EquipoAvatar({ equipo, size = 8 }) {
  const color = equipo?.color_principal || '#22C55E'
  return (
    <div
      className={`w-${size} h-${size} rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden`}
      style={{ background: color + '33', color }}
    >
      {equipo?.logo
        ? <img src={equipo.logo} alt="" className="w-full h-full object-cover" />
        : equipo?.nombre?.charAt(0)
      }
    </div>
  )
}

// ─── Partido pendiente (próximos) ─────────────────────────────────────────────

function CardProximo({ p }) {
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        {p.liga && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--color-accent)22', color: 'var(--color-accent)' }}>
            {p.liga.nombre}
          </span>
        )}
        <span className="text-xs ml-auto font-mono" style={{ color: 'var(--color-fg-muted)' }}>
          {p.hora || '—'} · Cancha {p.cancha}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center gap-2 justify-end min-w-0">
          <span className="text-sm font-medium truncate text-right" style={{ color: 'var(--color-fg)' }}>
            {p.equipo_local_id?.nombre}
          </span>
          <EquipoAvatar equipo={p.equipo_local_id} />
        </div>
        <div className="px-3 py-1 rounded-lg text-center" style={{ background: 'var(--color-primary)', minWidth: 48 }}>
          <span className="text-xs font-bold" style={{ color: 'var(--color-fg-muted)' }}>VS</span>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <EquipoAvatar equipo={p.equipo_visitante_id} />
          <span className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>
            {p.equipo_visitante_id?.nombre}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Partido jugado (resultados) ─────────────────────────────────────────────

function CardResultado({ p }) {
  const [expanded, setExpanded] = useState(false)
  const tieneDetalle = p.goles?.length > 0 || p.mvp_jugador_id

  const localGoles = p.goles?.filter(g => g.equipo_id?._id?.toString() === p.equipo_local_id?._id?.toString())
  const visitanteGoles = p.goles?.filter(g => g.equipo_id?._id?.toString() === p.equipo_visitante_id?._id?.toString())

  const ganadorLocal = (p.goles_local ?? 0) > (p.goles_visitante ?? 0)
  const ganadorVisitante = (p.goles_visitante ?? 0) > (p.goles_local ?? 0)

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}
    >
      <button
        onClick={() => tieneDetalle && setExpanded(v => !v)}
        className={`w-full px-4 py-3 text-left ${tieneDetalle ? 'cursor-pointer hover:bg-white/5 transition-all' : ''}`}
      >
        <div className="flex items-center gap-2 mb-2">
          {p.liga && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--color-accent)22', color: 'var(--color-accent)' }}>
              {p.liga.nombre}
            </span>
          )}
          {p.hora && (
            <span className="text-xs font-mono ml-auto" style={{ color: 'var(--color-fg-muted)' }}>
              {p.hora} · C{p.cancha}
            </span>
          )}
          {tieneDetalle && (
            <span style={{ color: 'var(--color-fg-muted)', marginLeft: p.hora ? 0 : 'auto' }}>
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex items-center gap-2 justify-end min-w-0">
            <span
              className="text-sm truncate text-right"
              style={{ color: 'var(--color-fg)', fontWeight: ganadorLocal ? 700 : 400 }}
            >
              {p.equipo_local_id?.nombre}
            </span>
            <EquipoAvatar equipo={p.equipo_local_id} />
          </div>

          <div
            className="px-3 py-1.5 rounded-xl text-center font-display"
            style={{ background: 'var(--color-primary)', minWidth: 64, fontFamily: 'var(--font-display)' }}
          >
            <span style={{ color: ganadorLocal ? 'var(--color-accent)' : 'var(--color-fg)', fontSize: 20 }}>
              {p.goles_local ?? 0}
            </span>
            <span style={{ color: 'var(--color-fg-muted)', fontSize: 16, margin: '0 4px' }}>–</span>
            <span style={{ color: ganadorVisitante ? 'var(--color-accent)' : 'var(--color-fg)', fontSize: 20 }}>
              {p.goles_visitante ?? 0}
            </span>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <EquipoAvatar equipo={p.equipo_visitante_id} />
            <span
              className="text-sm truncate"
              style={{ color: 'var(--color-fg)', fontWeight: ganadorVisitante ? 700 : 400 }}
            >
              {p.equipo_visitante_id?.nombre}
            </span>
          </div>
        </div>

        {p.estado === 'wo' && (
          <p className="text-xs text-center mt-1" style={{ color: '#F59E0B' }}>WO</p>
        )}
      </button>

      {expanded && tieneDetalle && (
        <div className="px-4 pb-3 pt-1 border-t space-y-2" style={{ borderColor: 'var(--color-border)' }}>
          {/* Goles por equipo */}
          {p.goles?.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                {localGoles?.map((g, i) => (
                  <p key={i} className="text-xs py-0.5" style={{ color: 'var(--color-fg-muted)' }}>
                    ⚽ {g.jugador_id?.nombre}{g.minuto != null ? ` ${g.minuto}'` : ''}{g.tipo === 'penal' ? ' (P)' : ''}
                  </p>
                ))}
              </div>
              <div className="text-right">
                {visitanteGoles?.map((g, i) => (
                  <p key={i} className="text-xs py-0.5" style={{ color: 'var(--color-fg-muted)' }}>
                    {g.jugador_id?.nombre}{g.minuto != null ? ` ${g.minuto}'` : ''}{g.tipo === 'penal' ? ' (P)' : ''} ⚽
                  </p>
                ))}
              </div>
            </div>
          )}
          {p.mvp_jugador_id && (
            <div className="flex items-center gap-1.5 pt-1">
              <Star size={11} style={{ color: 'var(--color-accent)', fill: 'var(--color-accent)' }} />
              <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>MVP:</span>
              <span className="text-xs font-medium" style={{ color: 'var(--color-fg)' }}>{p.mvp_jugador_id?.nombre}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Sección Próximos Partidos ────────────────────────────────────────────────

function SeccionProximos({ proximos, username }) {
  const [openFecha, setOpenFecha] = useState(proximos[0]?.fecha ? new Date(proximos[0].fecha).toISOString().split('T')[0] : null)

  if (!proximos.length) {
    return (
      <div className="rounded-2xl py-12 text-center" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
        <Calendar size={32} className="mx-auto mb-3" style={{ color: 'var(--color-fg-muted)', opacity: 0.4 }} />
        <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>No hay partidos próximos programados</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {proximos.map(grupo => {
        const key = new Date(grupo.fecha).toISOString().split('T')[0]
        const isOpen = openFecha === key
        return (
          <div key={key} className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
            <button
              onClick={() => setOpenFecha(isOpen ? null : key)}
              className="w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--color-accent)22' }}>
                  <Calendar size={18} style={{ color: 'var(--color-accent)' }} />
                </div>
                <div className="text-left">
                  <p className="font-display text-lg leading-none" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
                    {formatFecha(key).toUpperCase()}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-fg-muted)' }}>
                    {grupo.partidos.length} partido{grupo.partidos.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: 'var(--color-accent)22', color: 'var(--color-accent)' }}>
                  {grupo.partidos.length}
                </span>
                {isOpen ? <ChevronDown size={16} style={{ color: 'var(--color-fg-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--color-fg-muted)' }} />}
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <div className="pt-3 space-y-2">
                  {grupo.partidos.map(p => <CardProximo key={p._id} p={p} />)}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Sección Resultados ───────────────────────────────────────────────────────

function SeccionResultados({ fechas, username }) {
  const [fechaActiva, setFechaActiva] = useState(fechas[0] || null)

  const { data, isLoading } = useQuery({
    queryKey: ['hub-resultados', username, fechaActiva],
    queryFn: () => client.get(`/public/${username}/resultados/${fechaActiva}`).then(r => r.data),
    enabled: !!fechaActiva,
  })

  if (!fechas.length) {
    return (
      <div className="rounded-2xl py-12 text-center" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
        <Trophy size={32} className="mx-auto mb-3" style={{ color: 'var(--color-fg-muted)', opacity: 0.4 }} />
        <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>Aún no hay resultados registrados</p>
      </div>
    )
  }

  return (
    <div>
      {/* Date pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4 scrollbar-hide">
        {fechas.map(f => (
          <button
            key={f}
            onClick={() => setFechaActiva(f)}
            className="px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0 cursor-pointer transition-all"
            style={{
              background: fechaActiva === f ? 'var(--color-accent)' : 'var(--color-primary)',
              color: fechaActiva === f ? '#020617' : 'var(--color-fg-muted)',
              border: '1px solid var(--color-border)',
            }}
          >
            {formatFechaCorta(f)}
          </button>
        ))}
      </div>

      {/* Results for selected date */}
      {isLoading ? (
        <div className="py-10 text-center text-sm" style={{ color: 'var(--color-fg-muted)' }}>Cargando...</div>
      ) : !data?.partidos?.length ? (
        <div className="rounded-2xl py-10 text-center" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
          <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>Sin resultados para esta fecha</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.partidos.map(p => <CardResultado key={p._id} p={p} />)}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PerfilPublico() {
  const { username } = useParams()
  const [activeTab, setActiveTab] = useState('proximos')

  const { data, isLoading } = useQuery({
    queryKey: ['hub', username],
    queryFn: () => client.get(`/public/${username}/hub/data`).then(r => r.data),
  })

  useDocumentMeta({
    title: data?.admin ? `${data.admin.nombre || data.admin.username} — LigaManager Pro` : 'Perfil',
    description: data?.admin ? `Próximos partidos y resultados de ${data.admin.nombre || data.admin.username}` : undefined,
  })

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)', color: 'var(--color-fg-muted)' }}>
      Cargando...
    </div>
  )

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)', color: 'var(--color-destructive)' }}>
      Usuario no encontrado
    </div>
  )

  const { admin, ligas, proximos, fechas_resultado } = data
  const ligasActivas = ligas.filter(l => l.estado === 'activa')

  const TABS = [
    { key: 'proximos', label: 'Próximos partidos' },
    { key: 'resultados', label: 'Resultados' },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-8 text-center"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #0F2A1A 0%, var(--color-primary) 65%)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'var(--color-accent)22', border: '2px solid var(--color-accent)44' }}>
          <span className="font-display text-4xl" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}>
            {(admin.nombre || admin.username).charAt(0).toUpperCase()}
          </span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl mb-1" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
          {(admin.nombre || admin.username).toUpperCase()}
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
          {ligasActivas.length} liga{ligasActivas.length !== 1 ? 's' : ''} activa{ligasActivas.length !== 1 ? 's' : ''}
        </p>

        {/* Liga strip */}
        {ligas.length > 0 && (
          <div className="flex gap-2 justify-center flex-wrap mt-4 max-w-lg mx-auto">
            {ligas.map(liga => (
              <Link
                key={liga._id}
                to={`/${username}/${liga.slug}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer hover:scale-105"
                style={{
                  background: liga.estado === 'activa' ? 'var(--color-accent)22' : 'var(--color-secondary)',
                  color: liga.estado === 'activa' ? 'var(--color-accent)' : 'var(--color-fg-muted)',
                  border: `1px solid ${liga.estado === 'activa' ? 'var(--color-accent)44' : 'var(--color-border)'}`,
                }}
              >
                <Trophy size={11} />
                {liga.nombre}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Tab bar */}
        <div className="flex gap-1 mb-6 rounded-2xl p-1" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all"
              style={{
                background: activeTab === key ? 'var(--color-accent)' : 'transparent',
                color: activeTab === key ? '#020617' : 'var(--color-fg-muted)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'proximos' && (
          <SeccionProximos proximos={proximos} username={username} />
        )}

        {activeTab === 'resultados' && (
          <SeccionResultados fechas={fechas_resultado} username={username} />
        )}
      </div>

      <footer className="text-center py-8 text-xs mt-4" style={{ color: 'var(--color-fg-muted)', borderTop: '1px solid var(--color-border)' }}>
        Powered by <Link to="/" className="font-semibold cursor-pointer" style={{ color: 'var(--color-accent)' }}>LigaManager Pro</Link>
      </footer>
    </div>
  )
}
