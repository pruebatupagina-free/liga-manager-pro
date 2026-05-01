import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Trophy, Calendar, BarChart2, Users, Star, Home, BookOpen, Award, Target, TrendingUp, Image, X,
} from 'lucide-react'
import client from '../../api/client'
import useDocumentMeta from '../../hooks/useDocumentMeta'

// ─── Shared components ────────────────────────────────────────────────────────

function RachaBadge({ tipo }) {
  const map = { V: ['#22C55E22', '#22C55E'], E: ['#F59E0B22', '#F59E0B'], D: ['#EF444422', '#EF4444'] }
  const [bg, fg] = map[tipo] || ['#94A3B822', '#94A3B8']
  return (
    <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
      style={{ background: bg, color: fg, fontFamily: 'var(--font-display)' }}>
      {tipo}
    </div>
  )
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="rounded-2xl py-16 text-center" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
      <Icon size={36} className="mx-auto mb-3" style={{ color: 'var(--color-fg-muted)', opacity: 0.4 }} />
      <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>{text}</p>
    </div>
  )
}

function LoadingState() {
  return <div className="text-center py-10 text-sm" style={{ color: 'var(--color-fg-muted)' }}>Cargando...</div>
}

function PartidoCard({ partido: p, username, ligaSlug, pendiente }) {
  return (
    <div className="rounded-xl px-3 py-3" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between gap-2 mb-1.5 text-xs" style={{ color: 'var(--color-fg-muted)' }}>
        <span>J{p.jornada_id?.numero || '?'} · Cancha {p.cancha}</span>
        {p.hora && <span className="font-mono">{p.hora}</span>}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Link to={`/${username}/${ligaSlug}/equipo/${p.equipo_local_id?.slug}`} className="flex items-center gap-2 cursor-pointer min-w-0 justify-end">
          <span className="text-sm font-medium truncate text-right" style={{ color: 'var(--color-fg)' }}>{p.equipo_local_id?.nombre}</span>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden"
            style={{ background: (p.equipo_local_id?.color_principal || '#22C55E') + '33', color: p.equipo_local_id?.color_principal || '#22C55E' }}>
            {p.equipo_local_id?.logo ? <img src={p.equipo_local_id.logo} alt="" className="w-full h-full object-cover" /> : p.equipo_local_id?.nombre?.charAt(0)}
          </div>
        </Link>
        <div className="px-3 py-1 rounded-lg text-center min-w-[60px]" style={{ background: pendiente ? 'transparent' : 'var(--color-secondary)' }}>
          {pendiente
            ? <span className="text-xs font-bold" style={{ color: 'var(--color-fg-muted)' }}>VS</span>
            : <span className="font-display text-base" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{p.goles_local} – {p.goles_visitante}</span>
          }
        </div>
        <Link to={`/${username}/${ligaSlug}/equipo/${p.equipo_visitante_id?.slug}`} className="flex items-center gap-2 cursor-pointer min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden"
            style={{ background: (p.equipo_visitante_id?.color_principal || '#22C55E') + '33', color: p.equipo_visitante_id?.color_principal || '#22C55E' }}>
            {p.equipo_visitante_id?.logo ? <img src={p.equipo_visitante_id.logo} alt="" className="w-full h-full object-cover" /> : p.equipo_visitante_id?.nombre?.charAt(0)}
          </div>
          <span className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>{p.equipo_visitante_id?.nombre}</span>
        </Link>
      </div>
      {p.estado === 'wo' && <p className="text-xs text-center mt-1" style={{ color: '#F59E0B' }}>WO</p>}
    </div>
  )
}

// ─── Tab: INICIO ──────────────────────────────────────────────────────────────

function TabInicio({ username, ligaSlug, liga, equipos, jornadas }) {
  const jugadas = jornadas.filter(j => j.estado === 'finalizada').length
  const proxJornada = jornadas.find(j => j.estado === 'en_curso' || j.estado === 'pendiente')

  const { data: resultados = [] } = useQuery({
    queryKey: ['pub-resultados', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/resultados`).then(r => r.data),
  })
  const { data: proximos = [] } = useQuery({
    queryKey: ['pub-proximos', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/proximos`).then(r => r.data),
  })

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Equipos', value: equipos.length, color: 'var(--color-accent)' },
          { label: 'Jornadas', value: `${jugadas}/${jornadas.length}`, color: 'var(--color-fg)' },
          { label: 'Próxima', value: proxJornada ? `J${proxJornada.numero}` : '—', color: liga.estado === 'activa' ? '#22C55E' : '#94A3B8' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
            <p className="font-display text-2xl leading-none mb-1" style={{ color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</p>
            <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {resultados.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: 'var(--color-fg-muted)' }}>Últimos resultados</p>
          <div className="space-y-2">
            {resultados.slice(0, 3).map(p => <PartidoCard key={p._id} partido={p} username={username} ligaSlug={ligaSlug} />)}
          </div>
        </div>
      )}

      {proximos.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: 'var(--color-fg-muted)' }}>Próximos partidos</p>
          <div className="space-y-2">
            {proximos.slice(0, 3).map(p => <PartidoCard key={p._id} partido={p} username={username} ligaSlug={ligaSlug} pendiente />)}
          </div>
        </div>
      )}

      {resultados.length === 0 && proximos.length === 0 && (
        <EmptyState icon={Calendar} text="La liga aún no tiene partidos registrados" />
      )}
    </div>
  )
}

// ─── Tab: TABLA ───────────────────────────────────────────────────────────────

function TabTabla({ username, ligaSlug, liga }) {
  const { data: tabla = [] } = useQuery({
    queryKey: ['pub-tabla', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/tabla`).then(r => r.data),
  })
  const { data: defensiva = [] } = useQuery({
    queryKey: ['pub-defensiva', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/estadisticas-defensivas`).then(r => r.data),
  })

  const rachaMap = Object.fromEntries((defensiva || []).map(d => [d.equipo_id, d.racha]))
  const liguillaCutoff = liga.configuracion?.tiene_liguilla ? 4 : 0

  return (
    <div>
      {liguillaCutoff > 0 && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="w-3 h-3 rounded-sm" style={{ background: 'var(--color-accent)' }} />
          <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>Top {liguillaCutoff} → Liguilla</span>
        </div>
      )}
      <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--color-border)' }}>
        <table className="w-full text-sm" style={{ background: 'var(--color-primary)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['#', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'Pts', 'Forma'].map(h => (
                <th key={h} className="px-2 py-3 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{ color: 'var(--color-fg-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabla.map((row, idx) => {
              const inLiguilla = liguillaCutoff > 0 && idx < liguillaCutoff
              const racha = rachaMap[row.equipo._id?.toString()] || []
              return (
                <tr key={row.equipo._id} className="hover:bg-white/5 transition-all"
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    opacity: row.equipo.baja?.activa ? 0.5 : 1,
                    borderLeft: inLiguilla ? '3px solid var(--color-accent)' : '3px solid transparent',
                  }}>
                  <td className="px-2 py-3 font-display text-lg" style={{ color: idx < 3 ? 'var(--color-accent)' : 'var(--color-fg-muted)', fontFamily: 'var(--font-display)', minWidth: 28 }}>{row.posicion}</td>
                  <td className="px-2 py-3" style={{ minWidth: 120 }}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0"
                        style={{ background: (row.equipo.color_principal || '#22C55E') + '33', color: row.equipo.color_principal || '#22C55E' }}>
                        {row.equipo.logo ? <img src={row.equipo.logo} alt="" className="w-full h-full object-cover" /> : row.equipo.nombre?.charAt(0)}
                      </div>
                      <span className="truncate text-xs sm:text-sm" style={{ color: 'var(--color-fg)', maxWidth: 90 }}>
                        {row.equipo.nombre}{row.equipo.baja?.activa && ' 🚫'}
                      </span>
                    </div>
                  </td>
                  {[row.PJ, row.PG, row.PE, row.PP, row.GF, row.GC].map((v, i) => (
                    <td key={i} className="px-2 py-3 text-center text-xs" style={{ color: 'var(--color-fg-muted)', minWidth: 24 }}>{v}</td>
                  ))}
                  <td className="px-2 py-3 text-center text-xs" style={{ color: row.DG > 0 ? '#22C55E' : row.DG < 0 ? '#EF4444' : 'var(--color-fg-muted)', minWidth: 28 }}>
                    {row.DG > 0 ? '+' : ''}{row.DG}
                  </td>
                  <td className="px-2 py-3 text-center font-bold text-sm" style={{ color: 'var(--color-fg)', minWidth: 28 }}>{row.Pts}</td>
                  <td className="px-2 py-3" style={{ minWidth: 90 }}>
                    <div className="flex gap-0.5">
                      {racha.map((r, i) => <RachaBadge key={i} tipo={r} />)}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Tab: JORNADAS ────────────────────────────────────────────────────────────

function PartidoConcentrado({ partido: p }) {
  const jugado = p.estado === 'jugado' || p.estado === 'wo'
  const estadoColor = { jugado: '#22C55E', pendiente: '#94A3B8', wo: '#F59E0B', cancelado: '#EF4444' }
  const col = estadoColor[p.estado] || '#94A3B8'

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between mb-3 text-xs" style={{ color: 'var(--color-fg-muted)' }}>
        {p.hora ? <span className="font-mono">{p.hora}</span> : <span />}
        <div className="flex items-center gap-2">
          {p.cancha && <span>Cancha {p.cancha}</span>}
          <span className="px-2 py-0.5 rounded-full capitalize" style={{ background: col + '22', color: col }}>{p.estado}</span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center gap-2 justify-end min-w-0">
          <span className="text-sm font-medium truncate text-right" style={{ color: 'var(--color-fg)' }}>{p.equipo_local_id?.nombre}</span>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden"
            style={{ background: (p.equipo_local_id?.color_principal || '#22C55E') + '33', color: p.equipo_local_id?.color_principal || '#22C55E' }}>
            {p.equipo_local_id?.logo ? <img src={p.equipo_local_id.logo} alt="" className="w-full h-full object-cover" /> : p.equipo_local_id?.nombre?.charAt(0)}
          </div>
        </div>
        <div className="px-4 py-2 rounded-xl text-center min-w-[72px]" style={{ background: 'var(--color-secondary)' }}>
          {jugado
            ? <span className="font-display text-2xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{p.goles_local} – {p.goles_visitante}</span>
            : <span className="text-sm font-bold" style={{ color: 'var(--color-fg-muted)' }}>VS</span>
          }
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 overflow-hidden"
            style={{ background: (p.equipo_visitante_id?.color_principal || '#22C55E') + '33', color: p.equipo_visitante_id?.color_principal || '#22C55E' }}>
            {p.equipo_visitante_id?.logo ? <img src={p.equipo_visitante_id.logo} alt="" className="w-full h-full object-cover" /> : p.equipo_visitante_id?.nombre?.charAt(0)}
          </div>
          <span className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>{p.equipo_visitante_id?.nombre}</span>
        </div>
      </div>

      {p.goles?.length > 0 && (
        <div className="mt-3 pt-3 border-t flex flex-wrap gap-x-4 gap-y-1" style={{ borderColor: 'var(--color-border)' }}>
          {p.goles.map(g => (
            <span key={g._id} className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
              ⚽ {g.jugador_id?.nombre}{g.minuto != null ? ` ${g.minuto}'` : ''}
              {g.tipo === 'penal' ? ' (P)' : g.tipo === 'autogol' ? ' (AG)' : ''}
            </span>
          ))}
        </div>
      )}

      {p.mvp_jugador_id && (
        <div className="mt-2 pt-2 border-t flex items-center gap-1.5" style={{ borderColor: 'var(--color-border)' }}>
          <Star size={11} style={{ color: 'var(--color-accent)', fill: 'var(--color-accent)' }} />
          <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>MVP:</span>
          <span className="text-xs font-medium" style={{ color: 'var(--color-fg)' }}>{p.mvp_jugador_id?.nombre}</span>
        </div>
      )}
    </div>
  )
}

function TabJornadas({ username, ligaSlug, jornadas }) {
  const defaultNum = (
    jornadas.find(j => j.estado === 'en_curso') ||
    jornadas.find(j => j.estado === 'pendiente') ||
    jornadas[jornadas.length - 1]
  )?.numero

  const [jornadaNum, setJornadaNum] = useState(defaultNum)

  const { data, isLoading } = useQuery({
    queryKey: ['pub-jornada', username, ligaSlug, jornadaNum],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/jornada/${jornadaNum}`).then(r => r.data),
    enabled: !!jornadaNum,
  })

  if (!jornadas.length) return <EmptyState icon={Calendar} text="No hay jornadas configuradas" />

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4 scrollbar-hide">
        {jornadas.map(j => (
          <button key={j._id} onClick={() => setJornadaNum(j.numero)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 cursor-pointer transition-all"
            style={{
              background: jornadaNum === j.numero ? 'var(--color-accent)' : 'var(--color-primary)',
              color: jornadaNum === j.numero ? '#020617' : 'var(--color-fg-muted)',
              border: '1px solid var(--color-border)',
            }}>
            J{j.numero}
          </button>
        ))}
      </div>

      {isLoading ? <LoadingState /> : (
        <div className="space-y-3">
          {data?.partidos?.length
            ? data.partidos.map(p => <PartidoConcentrado key={p._id} partido={p} />)
            : <EmptyState icon={Calendar} text="No hay partidos en esta jornada" />
          }
        </div>
      )}
    </div>
  )
}

// ─── Tab: GOLEADORES ──────────────────────────────────────────────────────────

function PodioCard({ item, pos }) {
  const podioH = { 1: 88, 2: 64, 3: 52 }
  const photoSize = pos === 1 ? 'w-16 h-16' : 'w-12 h-12'
  const medal = { 1: '🥇', 2: '🥈', 3: '🥉' }[pos]
  const podioColor = { 1: '#22C55E22', 2: '#94A3B822', 3: '#CD7F3222' }[pos]

  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
      <div className={`${photoSize} rounded-full overflow-hidden flex items-center justify-center border-2 flex-shrink-0`}
        style={{ background: 'var(--color-secondary)', borderColor: item.equipo?.color_principal || 'var(--color-accent)' }}>
        {item.jugador?.foto
          ? <img src={item.jugador.foto} alt="" className="w-full h-full object-cover" />
          : <span className="font-bold" style={{ color: 'var(--color-fg)', fontSize: pos === 1 ? 20 : 14 }}>{item.jugador?.nombre?.charAt(0)}</span>}
      </div>
      <div className="text-center min-w-0 w-full">
        <span className="text-base">{medal}</span>
        <p className="text-xs font-medium truncate px-1" style={{ color: 'var(--color-fg)' }}>{item.jugador?.nombre}</p>
        <p className="text-xs truncate px-1" style={{ color: 'var(--color-fg-muted)' }}>{item.equipo?.nombre}</p>
      </div>
      <div className="w-full rounded-t-xl flex items-center justify-center py-3"
        style={{ height: podioH[pos], background: podioColor }}>
        <span className="font-display text-3xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{item.goles ?? item.mvps}</span>
      </div>
    </div>
  )
}

function TabGoleadores({ username, ligaSlug }) {
  const { data: lista = [] } = useQuery({
    queryKey: ['pub-goles', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/goleadores`).then(r => r.data),
  })

  if (!lista.length) return <EmptyState icon={Target} text="Aún no hay goles registrados" />

  const [p1, p2, p3] = lista
  const rest = lista.slice(3, 30)

  return (
    <div>
      <div className="flex items-end justify-center gap-2 mb-6 px-2">
        {p2 && <PodioCard item={p2} pos={2} />}
        {p1 && <PodioCard item={p1} pos={1} />}
        {p3 && <PodioCard item={p3} pos={3} />}
      </div>
      <div className="space-y-2">
        {rest.map((j, i) => (
          <div key={j.jugador?._id} className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', borderLeft: `3px solid ${j.equipo?.color_principal || '#22C55E'}` }}>
            <span className="w-6 text-center font-display text-sm" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>{i + 4}</span>
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--color-secondary)' }}>
              {j.jugador?.foto ? <img src={j.jugador.foto} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold" style={{ color: 'var(--color-fg)' }}>{j.jugador?.nombre?.charAt(0)}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>{j.jugador?.nombre}</p>
              <p className="text-xs truncate" style={{ color: 'var(--color-fg-muted)' }}>{j.equipo?.nombre}</p>
            </div>
            <span className="font-display text-xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{j.goles}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab: EQUIPOS ─────────────────────────────────────────────────────────────

function TabEquipos({ username, ligaSlug, equipos }) {
  const { data: tabla = [] } = useQuery({
    queryKey: ['pub-tabla', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/tabla`).then(r => r.data),
  })
  const posMap = Object.fromEntries(tabla.map(r => [r.equipo._id?.toString(), r.posicion]))

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {equipos.map(e => (
        <Link key={e._id} to={`/${username}/${ligaSlug}/equipo/${e.slug}`}
          className="flex items-center gap-4 rounded-2xl px-5 py-4 glow-card hover:scale-[1.01] transition-all cursor-pointer"
          style={{ background: 'var(--color-primary)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 overflow-hidden"
            style={{ background: (e.color_principal || '#22C55E') + '33', color: e.color_principal || '#22C55E' }}>
            {e.logo ? <img src={e.logo} alt="" className="w-full h-full object-cover" /> : e.nombre.charAt(0)}
          </div>
          <span className="flex-1 font-semibold min-w-0 truncate" style={{ color: 'var(--color-fg)' }}>{e.nombre}</span>
          {posMap[e._id?.toString()] && (
            <span className="font-display text-2xl flex-shrink-0" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>
              #{posMap[e._id?.toString()]}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}

// ─── Tab: MVP ─────────────────────────────────────────────────────────────────

function TabMVP({ username, ligaSlug }) {
  const { data: lista = [] } = useQuery({
    queryKey: ['pub-mvps', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/mvps`).then(r => r.data),
  })

  if (!lista.length) return <EmptyState icon={Star} text="Aún no hay MVPs asignados" />

  const [p1, p2, p3] = lista
  const rest = lista.slice(3, 30)

  return (
    <div>
      {lista.length >= 1 && (
        <div className="flex items-end justify-center gap-2 mb-6 px-2">
          {p2 && <PodioCard item={p2} pos={2} />}
          {p1 && <PodioCard item={p1} pos={1} />}
          {p3 && <PodioCard item={p3} pos={3} />}
        </div>
      )}
      <div className="space-y-2">
        {rest.map((j, i) => (
          <div key={j.jugador?._id} className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', borderLeft: `3px solid ${j.equipo?.color_principal || '#22C55E'}` }}>
            <span className="w-6 text-center font-display text-sm" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>{i + 4}</span>
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'var(--color-secondary)' }}>
              {j.jugador?.foto ? <img src={j.jugador.foto} alt="" className="w-full h-full object-cover" /> : <Star size={14} style={{ color: 'var(--color-accent)' }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>{j.jugador?.nombre}</p>
              <p className="text-xs truncate" style={{ color: 'var(--color-fg-muted)' }}>{j.equipo?.nombre}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star size={13} style={{ color: 'var(--color-accent)', fill: 'var(--color-accent)' }} />
              <span className="font-display text-xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{j.mvps}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab: SALÓN DE LA FAMA ────────────────────────────────────────────────────

function TabSalon({ username, ligaSlug }) {
  const { data, isLoading } = useQuery({
    queryKey: ['pub-salon', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/salon-fama`).then(r => r.data),
  })

  if (isLoading) return <LoadingState />
  if (!data?.campeonatos?.length) return <EmptyState icon={Award} text="No hay torneos finalizados aún" />

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: 'var(--color-fg-muted)' }}>Campeones</p>
        <div className="space-y-2">
          {data.campeonatos.map((c, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
              <span className="text-2xl flex-shrink-0">🏆</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--color-fg)' }}>{c.campeon?.nombre}</p>
                <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{c.liga?.nombre}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {data.goleadores?.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: 'var(--color-fg-muted)' }}>Top Goleadores Históricos</p>
          <div className="space-y-2">
            {data.goleadores.map((j, i) => (
              <div key={j.jugador?._id} className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
                <span className="w-6 text-center font-display text-sm" style={{ color: i < 3 ? 'var(--color-accent)' : 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>{j.jugador?.nombre}</p>
                  <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{j.equipo?.nombre}</p>
                </div>
                <span className="font-display text-xl flex-shrink-0" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{j.goles}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.mvps?.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: 'var(--color-fg-muted)' }}>Top MVPs Históricos</p>
          <div className="space-y-2">
            {data.mvps.map((j, i) => (
              <div key={j.jugador?._id} className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
                <span className="w-6 text-center font-display text-sm" style={{ color: i < 3 ? 'var(--color-accent)' : 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>{j.jugador?.nombre}</p>
                  <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{j.equipo?.nombre}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star size={12} style={{ color: 'var(--color-accent)', fill: 'var(--color-accent)' }} />
                  <span className="font-display text-xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{j.mvps}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab: ESTADÍSTICAS ────────────────────────────────────────────────────────

function StatBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

function TabEstadisticas({ username, ligaSlug }) {
  const [sub, setSub] = useState('ofensiva')

  const { data: stats = [], isLoading } = useQuery({
    queryKey: ['pub-estadisticas', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/estadisticas`).then(r => r.data),
  })

  const { data: tarjetas = [] } = useQuery({
    queryKey: ['pub-tarjetas', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/tarjetas`).then(r => r.data),
    enabled: sub === 'disciplina',
  })

  if (isLoading) return <LoadingState />

  const SUB_TABS = [
    { key: 'ofensiva', label: 'Ofensiva' },
    { key: 'defensiva', label: 'Defensiva' },
    { key: 'disciplina', label: 'Disciplina' },
  ]

  const ofensiva = [...stats].sort((a, b) => b.GF - a.GF || b.promedio - a.promedio)
  const defensiva = [...stats].filter(s => s.PJ > 0).sort((a, b) => a.GC - b.GC || b.clean_sheets - a.clean_sheets)

  const maxGF = ofensiva[0]?.GF || 1
  const maxGC = Math.max(...defensiva.map(s => s.GC), 1)

  return (
    <div>
      {/* Sub-tab pills */}
      <div className="flex gap-2 mb-5">
        {SUB_TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setSub(key)}
            className="px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all"
            style={{
              background: sub === key ? 'var(--color-accent)' : 'var(--color-primary)',
              color: sub === key ? '#020617' : 'var(--color-fg-muted)',
              border: '1px solid var(--color-border)',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Ofensiva */}
      {sub === 'ofensiva' && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: 'var(--color-fg-muted)' }}>
            Ranking por Goles a Favor
          </p>
          {ofensiva.length === 0 && <EmptyState icon={Target} text="Sin partidos jugados aún" />}
          {ofensiva.map((s, i) => (
            <div key={s.equipo._id} className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', borderLeft: `3px solid ${s.equipo.color_principal || '#22C55E'}` }}>
              <span className="w-5 text-center font-display text-sm flex-shrink-0"
                style={{ color: i < 3 ? 'var(--color-accent)' : 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>{i + 1}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden"
                style={{ background: (s.equipo.color_principal || '#22C55E') + '33', color: s.equipo.color_principal || '#22C55E' }}>
                {s.equipo.logo ? <img src={s.equipo.logo} alt="" className="w-full h-full object-cover" /> : s.equipo.nombre?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>{s.equipo.nombre}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatBar value={s.GF} max={maxGF} color={s.equipo.color_principal || '#22C55E'} />
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-fg-muted)' }}>{s.promedio}/jornada</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="font-display text-2xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{s.GF}</span>
                <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>goles</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Defensiva */}
      {sub === 'defensiva' && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: 'var(--color-fg-muted)' }}>
            Ranking Defensivo — Menos Goles en Contra
          </p>
          {defensiva.length === 0 && <EmptyState icon={Target} text="Sin partidos jugados aún" />}
          {defensiva.map((s, i) => (
            <div key={s.equipo._id} className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', borderLeft: `3px solid ${s.equipo.color_principal || '#22C55E'}` }}>
              <span className="w-5 text-center font-display text-sm flex-shrink-0"
                style={{ color: i < 3 ? 'var(--color-accent)' : 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>{i + 1}</span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden"
                style={{ background: (s.equipo.color_principal || '#22C55E') + '33', color: s.equipo.color_principal || '#22C55E' }}>
                {s.equipo.logo ? <img src={s.equipo.logo} alt="" className="w-full h-full object-cover" /> : s.equipo.nombre?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>{s.equipo.nombre}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatBar value={maxGC - s.GC} max={maxGC} color={s.equipo.color_principal || '#22C55E'} />
                  <span className="text-xs flex-shrink-0" style={{ color: '#22C55E' }}>{s.clean_sheets} valla{s.clean_sheets !== 1 ? 's' : ''} invicta{s.clean_sheets !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="font-display text-2xl" style={{ color: s.GC === 0 ? '#22C55E' : s.GC <= 2 ? 'var(--color-fg)' : '#EF4444', fontFamily: 'var(--font-display)' }}>{s.GC}</span>
                <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>en contra</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disciplina */}
      {sub === 'disciplina' && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider mb-3 px-1" style={{ color: 'var(--color-fg-muted)' }}>
            Ranking de Tarjetas
          </p>
          {tarjetas.length === 0 && <EmptyState icon={Target} text="Sin tarjetas registradas" />}
          {tarjetas.slice(0, 30).map((j, i) => (
            <div key={j.jugador?._id} className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)', borderLeft: `3px solid ${j.equipo?.color_principal || '#22C55E'}` }}>
              <span className="w-5 text-center font-display text-sm flex-shrink-0"
                style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>{i + 1}</span>
              <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--color-secondary)' }}>
                {j.jugador?.foto ? <img src={j.jugador.foto} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold" style={{ color: 'var(--color-fg)' }}>{j.jugador?.nombre?.charAt(0)}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>{j.jugador?.nombre}</p>
                <p className="text-xs truncate" style={{ color: 'var(--color-fg-muted)' }}>{j.equipo?.nombre}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {j.amarillas > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-5 rounded-sm flex-shrink-0" style={{ background: '#F59E0B' }} />
                    <span className="text-sm font-bold" style={{ color: '#F59E0B' }}>{j.amarillas}</span>
                  </div>
                )}
                {j.rojas > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-5 rounded-sm flex-shrink-0" style={{ background: '#EF4444' }} />
                    <span className="text-sm font-bold" style={{ color: '#EF4444' }}>{j.rojas}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab: GALERÍA ─────────────────────────────────────────────────────────────

function TabGaleria({ username, ligaSlug }) {
  const [lightbox, setLightbox] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['pub-galeria', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/galeria`).then(r => r.data),
  })

  const fotos = data?.galeria || []

  if (isLoading) return <LoadingState />
  if (!fotos.length) return <EmptyState icon={Image} text="Sin fotos en la galería" />

  return (
    <>
      <div className="columns-2 sm:columns-3 gap-2 space-y-2">
        {fotos.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Foto ${i + 1}`}
            className="w-full rounded-xl cursor-pointer hover:opacity-90 transition-opacity block mb-2"
            onClick={() => setLightbox(i)}
          />
        ))}
      </div>

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
          >
            <X size={20} />
          </button>
          <img
            src={fotos[lightbox]}
            alt=""
            className="max-w-full max-h-full rounded-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            {lightbox > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setLightbox(lightbox - 1) }}
                className="px-5 py-2 rounded-xl text-sm font-medium cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              >
                ← Anterior
              </button>
            )}
            <span className="px-4 py-2 text-sm rounded-xl" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)' }}>
              {lightbox + 1} / {fotos.length}
            </span>
            {lightbox < fotos.length - 1 && (
              <button
                onClick={e => { e.stopPropagation(); setLightbox(lightbox + 1) }}
                className="px-5 py-2 rounded-xl text-sm font-medium cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
              >
                Siguiente →
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ─── Tab: REGLAMENTO ──────────────────────────────────────────────────────────

function TabReglamento({ reglamento }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
      <pre className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-body)' }}>
        {reglamento}
      </pre>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TorneoPublico() {
  const { username, ligaSlug } = useParams()
  const [tab, setTab] = useState('inicio')

  const { data, isLoading } = useQuery({
    queryKey: ['pub-liga', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}`).then(r => r.data),
  })

  useDocumentMeta({
    title: data?.liga ? `${data.liga.nombre} — LigaManager Pro` : 'Liga — LigaManager Pro',
    description: data?.liga ? `Tabla, goleadores, jornadas y resultados de ${data.liga.nombre}` : undefined,
    ogTitle: data?.liga?.nombre,
    ogDescription: data?.liga ? `Sigue tu liga: tabla, goleadores, próximos partidos y resultados.` : undefined,
  })

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)', color: 'var(--color-fg-muted)' }}>Cargando...</div>
  if (!data) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)', color: 'var(--color-destructive)' }}>Liga no encontrada</div>

  const { liga, equipos, jornadas, hasSalonFama } = data
  const jugadas = jornadas.filter(j => j.estado === 'finalizada').length
  const showReglamento = liga.reglamento?.trim().length > 0
  const showGaleria = (liga.galeria_count || 0) > 0

  const TABS = [
    { key: 'inicio', label: 'Inicio', icon: Home },
    { key: 'tabla', label: 'Tabla', icon: BarChart2 },
    { key: 'jornadas', label: 'Jornadas', icon: Calendar },
    { key: 'goleadores', label: 'Goleadores', icon: Target },
    { key: 'equipos', label: 'Equipos', icon: Users },
    { key: 'mvp', label: 'MVP', icon: Star },
    { key: 'estadisticas', label: 'Stats', icon: TrendingUp },
    ...(showGaleria ? [{ key: 'galeria', label: 'Galería', icon: Image }] : []),
    ...(hasSalonFama ? [{ key: 'salon', label: 'Salón', icon: Award }] : []),
    ...(showReglamento ? [{ key: 'reglamento', label: 'Reglamento', icon: BookOpen }] : []),
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="px-4 py-10 text-center"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #0F2A1A 0%, var(--color-primary) 65%)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'rgba(34,197,94,0.15)' }}>
          <Trophy size={28} style={{ color: 'var(--color-accent)' }} />
        </div>
        <h1 className="font-display text-4xl mb-2" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{liga.nombre}</h1>
        <div className="flex items-center justify-center gap-3 text-sm flex-wrap" style={{ color: 'var(--color-fg-muted)' }}>
          <span>{equipos.length} equipos</span>
          <span>·</span>
          <span>{jugadas}/{jornadas.length} jornadas</span>
          <span>·</span>
          <span style={{ color: liga.estado === 'activa' ? '#22C55E' : '#94A3B8' }}>{liga.estado}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tab bar */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap cursor-pointer transition-all flex-shrink-0"
              style={{
                background: tab === key ? 'var(--color-accent)' : 'var(--color-primary)',
                color: tab === key ? '#020617' : 'var(--color-fg-muted)',
                border: '1px solid var(--color-border)',
              }}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'inicio' && <TabInicio username={username} ligaSlug={ligaSlug} liga={liga} equipos={equipos} jornadas={jornadas} />}
        {tab === 'tabla' && <TabTabla username={username} ligaSlug={ligaSlug} liga={liga} />}
        {tab === 'jornadas' && <TabJornadas username={username} ligaSlug={ligaSlug} jornadas={jornadas} />}
        {tab === 'goleadores' && <TabGoleadores username={username} ligaSlug={ligaSlug} />}
        {tab === 'equipos' && <TabEquipos username={username} ligaSlug={ligaSlug} equipos={equipos} />}
        {tab === 'mvp' && <TabMVP username={username} ligaSlug={ligaSlug} />}
        {tab === 'estadisticas' && <TabEstadisticas username={username} ligaSlug={ligaSlug} />}
        {tab === 'galeria' && showGaleria && <TabGaleria username={username} ligaSlug={ligaSlug} />}
        {tab === 'salon' && hasSalonFama && <TabSalon username={username} ligaSlug={ligaSlug} />}
        {tab === 'reglamento' && showReglamento && <TabReglamento reglamento={liga.reglamento} />}
      </div>

      <footer className="text-center py-8 text-xs mt-4" style={{ color: 'var(--color-fg-muted)', borderTop: '1px solid var(--color-border)' }}>
        Powered by <Link to="/" className="font-semibold cursor-pointer" style={{ color: 'var(--color-accent)' }}>LigaManager Pro</Link>
      </footer>
    </div>
  )
}
