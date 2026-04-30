import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, User } from 'lucide-react'
import client from '../../api/client'
import useDocumentMeta from '../../hooks/useDocumentMeta'

function RachaBadge({ tipo }) {
  const map = { V: ['#22C55E22', '#22C55E'], E: ['#F59E0B22', '#F59E0B'], D: ['#EF444422', '#EF4444'] }
  const [bg, fg] = map[tipo] || ['#94A3B822', '#94A3B8']
  return (
    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
      style={{ background: bg, color: fg, fontFamily: 'var(--font-display)' }}>
      {tipo}
    </div>
  )
}

function calcStats(equipo, partidos) {
  const stats = { PJ: 0, PG: 0, PE: 0, PP: 0, GF: 0, GC: 0, Pts: 0 }
  const eid = equipo._id?.toString()
  partidos.filter(p => p.estado === 'jugado' || p.estado === 'wo').forEach(p => {
    const esLocal = p.equipo_local_id?._id?.toString() === eid || p.equipo_local_id?.toString() === eid
    stats.PJ++
    if (p.estado === 'wo') { stats.PP++; return }
    const gf = esLocal ? (p.goles_local ?? 0) : (p.goles_visitante ?? 0)
    const gc = esLocal ? (p.goles_visitante ?? 0) : (p.goles_local ?? 0)
    stats.GF += gf; stats.GC += gc
    if (gf > gc) { stats.PG++; stats.Pts += 3 }
    else if (gf < gc) { stats.PP++ }
    else { stats.PE++; stats.Pts++ }
  })
  stats.DG = stats.GF - stats.GC
  return stats
}

function calcRacha(equipo, partidos) {
  const eid = equipo._id?.toString()
  const jugados = partidos
    .filter(p => p.estado === 'jugado' || p.estado === 'wo')
    .slice(-5)
  return jugados.map(p => {
    if (p.estado === 'wo') return 'D'
    const esLocal = p.equipo_local_id?._id?.toString() === eid || p.equipo_local_id?.toString() === eid
    const gf = esLocal ? (p.goles_local ?? 0) : (p.goles_visitante ?? 0)
    const gc = esLocal ? (p.goles_visitante ?? 0) : (p.goles_local ?? 0)
    if (gf > gc) return 'V'
    if (gf < gc) return 'D'
    return 'E'
  })
}

export default function EquipoPublico() {
  const { username, ligaSlug, equipoSlug } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['pub-equipo', username, ligaSlug, equipoSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/equipo/${equipoSlug}`).then(r => r.data),
  })
  const { data: tabla = [] } = useQuery({
    queryKey: ['pub-tabla', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/tabla`).then(r => r.data),
    enabled: !!data,
  })

  useDocumentMeta({
    title: data?.equipo ? `${data.equipo.nombre} — Equipo` : 'Equipo',
    description: data?.equipo ? `Plantilla y resultados de ${data.equipo.nombre}` : undefined,
    ogImage: data?.equipo?.logo,
  })

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)', color: 'var(--color-fg-muted)' }}>Cargando...</div>
  if (!data) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)', color: 'var(--color-destructive)' }}>Equipo no encontrado</div>

  const { equipo, jugadores, partidos } = data
  const color = equipo.color_principal || '#22C55E'
  const stats = calcStats(equipo, partidos)
  const racha = calcRacha(equipo, partidos)
  const posicion = tabla.find(r => r.equipo._id?.toString() === equipo._id?.toString())?.posicion

  const jugados = partidos.filter(p => p.estado === 'jugado' || p.estado === 'wo').reverse()

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <Link to={`/${username}/${ligaSlug}`} className="flex items-center gap-2 text-sm mb-6 cursor-pointer" style={{ color: 'var(--color-fg-muted)' }}>
          <ArrowLeft size={16} /> Volver al torneo
        </Link>

        {/* Header */}
        <div className="rounded-2xl p-6 text-center mb-6 glow-card"
          style={{ background: `linear-gradient(135deg, ${color}18 0%, var(--color-primary) 60%)`, border: `1px solid ${color}33` }}>
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl overflow-hidden"
            style={{ background: color + '33', color, border: `3px solid ${color}` }}>
            {equipo.logo ? <img src={equipo.logo} alt={equipo.nombre} className="w-full h-full object-cover" /> : equipo.nombre.charAt(0)}
          </div>
          <h1 className="font-display text-3xl mb-1" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{equipo.nombre}</h1>
          {posicion && (
            <span className="inline-block px-3 py-1 rounded-full text-sm font-medium mt-1"
              style={{ background: color + '22', color }}>
              #{posicion} en la tabla
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6 sm:grid-cols-8">
          {[
            { label: 'PJ', value: stats.PJ },
            { label: 'PG', value: stats.PG },
            { label: 'PE', value: stats.PE },
            { label: 'PP', value: stats.PP },
            { label: 'GF', value: stats.GF },
            { label: 'GC', value: stats.GC },
            { label: 'DG', value: stats.DG > 0 ? `+${stats.DG}` : stats.DG },
            { label: 'Pts', value: stats.Pts },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-2 text-center" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
              <p className="font-display text-xl leading-none" style={{ color: s.label === 'Pts' ? color : 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-fg-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Racha */}
        {racha.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display text-sm uppercase tracking-wider mb-3" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>Últimos {racha.length} resultados</h2>
            <div className="flex gap-2">
              {racha.map((r, i) => <RachaBadge key={i} tipo={r} />)}
            </div>
          </div>
        )}

        {/* Plantilla */}
        <div className="mb-6">
          <h2 className="font-display text-sm uppercase tracking-wider mb-3" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>Plantilla ({jugadores.length})</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {jugadores.map(j => (
              <div key={j._id} className="rounded-2xl p-3 text-center glow-card" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
                <div className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center overflow-hidden"
                  style={{ background: 'var(--color-secondary)', border: `2px solid ${color}` }}>
                  {j.foto ? <img src={j.foto} alt={j.nombre} className="w-full h-full object-cover" /> : <User size={18} style={{ color: 'var(--color-fg-muted)' }} />}
                </div>
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  {j.numero_camiseta && (
                    <span className="text-xs font-bold px-1 py-0.5 rounded" style={{ background: color + '22', color }}># {j.numero_camiseta}</span>
                  )}
                </div>
                <p className="text-xs font-medium truncate" style={{ color: 'var(--color-fg)' }}>{j.nombre}</p>
                <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{j.posicion}</p>
                {j.goles_temporada > 0 && (
                  <p className="text-xs mt-1 font-bold" style={{ color }}>⚽ {j.goles_temporada}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Historial de partidos */}
        {jugados.length > 0 && (
          <div>
            <h2 className="font-display text-sm uppercase tracking-wider mb-3" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>Historial</h2>
            <div className="space-y-2">
              {jugados.map(p => {
                const eid = equipo._id?.toString()
                const esLocal = p.equipo_local_id?._id?.toString() === eid || p.equipo_local_id?.toString() === eid
                const gf = esLocal ? (p.goles_local ?? 0) : (p.goles_visitante ?? 0)
                const gc = esLocal ? (p.goles_visitante ?? 0) : (p.goles_local ?? 0)
                const res = p.estado === 'wo' ? 'D' : gf > gc ? 'V' : gf === gc ? 'E' : 'D'
                const resColor = { V: '#22C55E', E: '#F59E0B', D: '#EF4444' }[res]
                const rival = esLocal ? p.equipo_visitante_id : p.equipo_local_id

                return (
                  <div key={p._id} className="flex items-center gap-3 rounded-xl px-4 py-3"
                    style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
                      style={{ background: resColor + '22', color: resColor, fontFamily: 'var(--font-display)' }}>{res}</div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm truncate block" style={{ color: 'var(--color-fg-muted)' }}>
                        {esLocal ? 'vs' : 'en'} {rival?.nombre || 'Rival'}
                      </span>
                      {p.jornada_id?.fecha && (
                        <span className="text-xs" style={{ color: 'var(--color-fg-muted)', opacity: 0.6 }}>
                          J{p.jornada_id.numero}
                        </span>
                      )}
                    </div>
                    {p.estado === 'wo'
                      ? <span className="text-xs" style={{ color: '#F59E0B' }}>WO</span>
                      : <span className="font-display text-lg flex-shrink-0" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{gf} – {gc}</span>
                    }
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
