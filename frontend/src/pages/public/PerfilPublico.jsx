import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Calendar } from 'lucide-react'
import client from '../../api/client'
import useDocumentMeta from '../../hooks/useDocumentMeta'

const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

// "abril 29 del 2026 (miércoles)"
function formatFechaLarga(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const dia = DIAS_ES[d.getDay()].toLowerCase()
  return `${MESES_ES[d.getMonth()]} ${d.getDate()} del ${d.getFullYear()} (${dia})`
}

function EquipoAvatar({ equipo, size = 8 }) {
  const color = equipo?.color_principal || '#22C55E'
  return (
    <div
      className={`w-${size} h-${size} rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden`}
      style={{ background: color + '33', color }}
    >
      {equipo?.logo
        ? <img src={equipo.logo} alt="" className="w-full h-full object-cover rounded-lg" />
        : equipo?.nombre?.charAt(0)
      }
    </div>
  )
}

// ─── Fila de partido próximo (estilo referencia) ───────────────────────────────
function RowProximo({ p }) {
  return (
    <div className="py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
      <p className="text-xs font-semibold mb-0.5 uppercase tracking-wide truncate" style={{ color: 'var(--color-accent)' }}>
        {p.liga?.nombre}
      </p>
      <p className="text-xs mb-2" style={{ color: 'var(--color-fg-muted)' }}>
        Jornada {p.jornada_numero}{p.cancha ? ` · Cancha ${p.cancha}` : ''}
      </p>
      <div className="grid items-center gap-2" style={{ gridTemplateColumns: '1fr 80px 1fr' }}>
        <div className="flex items-center gap-2 justify-end min-w-0">
          <span className="text-sm font-bold truncate text-right" style={{ color: 'var(--color-fg)' }}>
            {p.equipo_local_id?.nombre}
          </span>
          <EquipoAvatar equipo={p.equipo_local_id} size={7} />
        </div>
        <div className="text-center">
          <p className="text-sm font-bold" style={{ color: 'var(--color-fg)' }}>
            {p.hora ? `${p.hora}hs` : '—'}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>Normal</p>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <EquipoAvatar equipo={p.equipo_visitante_id} size={7} />
          <span className="text-sm font-bold truncate" style={{ color: 'var(--color-fg)' }}>
            {p.equipo_visitante_id?.nombre}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Fila de resultado (estilo referencia con scores grandes) ──────────────────
function RowResultado({ p }) {
  const ganadorLocal = (p.goles_local ?? 0) > (p.goles_visitante ?? 0)
  const ganadorVisitante = (p.goles_visitante ?? 0) > (p.goles_local ?? 0)

  return (
    <div className="py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-accent)' }}>
          {p.liga?.nombre}
        </p>
        <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>· Jornada {p.jornada_numero}</span>
        {p.hora && (
          <span className="text-xs font-mono ml-auto" style={{ color: 'var(--color-fg-muted)' }}>{p.hora}hs</span>
        )}
      </div>
      <div className="grid items-center gap-2" style={{ gridTemplateColumns: '1fr auto 1fr' }}>
        {/* Local */}
        <div className="flex items-center gap-2 justify-end min-w-0">
          <div className="text-right min-w-0">
            <span
              className="text-3xl font-black block leading-none"
              style={{ color: ganadorLocal ? 'var(--color-accent)' : 'var(--color-fg)' }}
            >
              {p.goles_local ?? 0}
            </span>
            <span className="text-xs font-semibold truncate block mt-0.5" style={{ color: 'var(--color-fg)' }}>
              {p.equipo_local_id?.nombre}
            </span>
          </div>
          <EquipoAvatar equipo={p.equipo_local_id} size={9} />
        </div>
        {/* Center */}
        <div className="text-center px-1">
          {p.estado === 'wo'
            ? <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: '#F59E0B22', color: '#F59E0B' }}>WO</span>
            : <span className="text-sm font-bold" style={{ color: 'var(--color-fg-muted)' }}>–</span>
          }
        </div>
        {/* Visitante */}
        <div className="flex items-center gap-2 min-w-0">
          <EquipoAvatar equipo={p.equipo_visitante_id} size={9} />
          <div className="min-w-0">
            <span
              className="text-3xl font-black block leading-none"
              style={{ color: ganadorVisitante ? 'var(--color-accent)' : 'var(--color-fg)' }}
            >
              {p.goles_visitante ?? 0}
            </span>
            <span className="text-xs font-semibold truncate block mt-0.5" style={{ color: 'var(--color-fg)' }}>
              {p.equipo_visitante_id?.nombre}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Encabezado de sección (barra oscura como en el sitio referencia) ──────────
function SectionHeader({ children }) {
  return (
    <div className="px-4 py-3" style={{ background: 'var(--color-secondary)', borderBottom: '1px solid var(--color-border)' }}>
      <h2 className="text-sm font-bold" style={{ color: 'var(--color-fg)' }}>{children}</h2>
    </div>
  )
}

// ─── Sección Próximos Partidos ────────────────────────────────────────────────
function SeccionProximos({ proximos }) {
  const fechaMap = {}
  proximos.forEach(g => {
    const key = new Date(g.fecha).toISOString().split('T')[0]
    fechaMap[key] = g
  })
  const fechas = Object.keys(fechaMap).sort()
  const [selected, setSelected] = useState(fechas[0] || null)

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
      <SectionHeader>Próximos partidos</SectionHeader>

      {!fechas.length ? (
        <div className="py-12 text-center px-4">
          <Calendar size={32} className="mx-auto mb-3" style={{ color: 'var(--color-fg-muted)', opacity: 0.4 }} />
          <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>No hay partidos próximos programados</p>
        </div>
      ) : (
        <>
          {/* Calendar strip */}
          <div style={{ borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
            <div className="flex gap-1 p-3" style={{ minWidth: 'max-content' }}>
              {fechas.map(f => {
                const d = new Date(f + 'T12:00:00')
                const count = fechaMap[f]?.partidos?.length ?? 0
                const isSel = selected === f
                return (
                  <button
                    key={f}
                    onClick={() => setSelected(f)}
                    className="flex flex-col items-center px-3 py-2 rounded-xl transition-all cursor-pointer flex-shrink-0"
                    style={{
                      background: isSel ? 'var(--color-accent)' : 'var(--color-secondary)',
                      color: isSel ? '#020617' : 'var(--color-fg-muted)',
                      minWidth: 54,
                    }}
                  >
                    <span className="text-xs font-medium">{DIAS_ES[d.getDay()]}</span>
                    <span className="text-xl font-black leading-tight">{d.getDate()}</span>
                    <span className="text-xs">{MESES_CORTO[d.getMonth()]}</span>
                    <span
                      className="text-xs font-bold mt-1 rounded-full px-1.5"
                      style={{
                        background: count > 0
                          ? isSel ? '#02061733' : 'var(--color-accent)22'
                          : 'transparent',
                        color: isSel ? '#020617' : count > 0 ? 'var(--color-accent)' : 'var(--color-fg-muted)',
                      }}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected date header */}
          {selected && (() => {
            const d = new Date(selected + 'T12:00:00')
            const grupo = fechaMap[selected]
            return (
              <>
                <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <div className="rounded-lg px-2 py-1 text-center flex-shrink-0" style={{ background: '#EF444422', border: '1px solid #EF444444' }}>
                    <p className="text-xs font-bold" style={{ color: '#EF4444' }}>{MESES_CORTO[d.getMonth()].toUpperCase()}</p>
                    <p className="text-2xl font-black leading-none" style={{ color: '#EF4444' }}>{d.getDate()}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--color-fg)' }}>
                      {DIAS_ES[d.getDay()].toLowerCase()} {d.getDate()} de {MESES_ES[d.getMonth()]}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                      {grupo.partidos.length} partido{grupo.partidos.length !== 1 ? 's' : ''} programado{grupo.partidos.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="px-4">
                  {grupo.partidos.map(p => <RowProximo key={p._id} p={p} />)}
                  <div className="h-2" />
                </div>
              </>
            )
          })()}
        </>
      )}
    </div>
  )
}

// ─── Sección Resultados Recientes ─────────────────────────────────────────────
function SeccionResultados({ fechas, username }) {
  const [fechaActiva, setFechaActiva] = useState(fechas[0] || null)

  const { data, isLoading } = useQuery({
    queryKey: ['hub-resultados', username, fechaActiva],
    queryFn: () => client.get(`/public/${username}/resultados/${fechaActiva}`).then(r => r.data),
    enabled: !!fechaActiva,
  })

  // Agrupar fechas por mes para mostrar encabezado de mes
  const mesPrimero = fechas[0] ? MESES_ES[new Date(fechas[0] + 'T12:00:00').getMonth()] : ''

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
      <SectionHeader>Resultados recientes</SectionHeader>

      {!fechas.length ? (
        <div className="py-12 text-center px-4">
          <Trophy size={32} className="mx-auto mb-3" style={{ color: 'var(--color-fg-muted)', opacity: 0.4 }} />
          <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>Aún no hay resultados registrados</p>
        </div>
      ) : (
        <>
          {/* Month + date pills */}
          <div className="px-4 pt-3 pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <p className="text-xs font-semibold text-center mb-2 capitalize" style={{ color: 'var(--color-fg-muted)' }}>
              {mesPrimero.charAt(0).toUpperCase() + mesPrimero.slice(1)}
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {fechas.map(f => {
                const d = new Date(f + 'T12:00:00')
                const isActive = fechaActiva === f
                return (
                  <button
                    key={f}
                    onClick={() => setFechaActiva(f)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 cursor-pointer transition-all"
                    style={{
                      background: isActive ? 'var(--color-accent)22' : 'var(--color-secondary)',
                      color: isActive ? 'var(--color-accent)' : 'var(--color-fg-muted)',
                      border: `1px solid ${isActive ? 'var(--color-accent)44' : 'var(--color-border)'}`,
                      fontWeight: isActive ? 700 : 400,
                    }}
                  >
                    {DIAS_ES[d.getDay()]} - {d.getDate()}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selected date label */}
          {fechaActiva && (
            <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                {formatFechaLarga(fechaActiva)}
              </p>
            </div>
          )}

          {/* Match list */}
          <div className="px-4">
            {isLoading ? (
              <div className="py-8 text-center text-sm" style={{ color: 'var(--color-fg-muted)' }}>Cargando...</div>
            ) : !data?.partidos?.length ? (
              <div className="py-8 text-center text-sm" style={{ color: 'var(--color-fg-muted)' }}>Sin resultados para esta fecha</div>
            ) : (
              data.partidos.map(p => <RowResultado key={p._id} p={p} />)
            )}
            <div className="h-2" />
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function PerfilPublico() {
  const { username } = useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['hub', username],
    queryFn: () => client.get(`/public/${username}/hub/data`).then(r => r.data),
  })

  useDocumentMeta({
    title: data?.admin ? `${data.admin.nombre || data.admin.username} — LigaManager Pro` : 'Perfil',
    description: data?.admin
      ? `Próximos partidos y resultados de ${data.admin.nombre || data.admin.username}`
      : undefined,
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

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>

      {/* Header */}
      <div
        className="px-4 pt-10 pb-8 text-center"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, #0F2A1A 0%, var(--color-primary) 65%)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div
          className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'var(--color-accent)22', border: '2px solid var(--color-accent)44' }}
        >
          <span className="text-4xl font-black" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}>
            {(admin.nombre || admin.username).charAt(0).toUpperCase()}
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl mb-1 font-black tracking-wide" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105"
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

      {/* Content — ambas secciones apiladas como en el sitio de referencia */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <SeccionProximos proximos={proximos} />
        <SeccionResultados fechas={fechas_resultado} username={username} />
      </div>

      <footer
        className="text-center py-8 text-xs mt-4"
        style={{ color: 'var(--color-fg-muted)', borderTop: '1px solid var(--color-border)' }}
      >
        Powered by{' '}
        <Link to="/" className="font-semibold" style={{ color: 'var(--color-accent)' }}>
          LigaManager Pro
        </Link>
      </footer>
    </div>
  )
}
