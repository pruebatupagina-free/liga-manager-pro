import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, User } from 'lucide-react'
import client from '../../api/client'
import useDocumentMeta from '../../hooks/useDocumentMeta'

export default function EquipoPublico() {
  const { username, ligaSlug, equipoSlug } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['pub-equipo', username, ligaSlug, equipoSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/equipo/${equipoSlug}`).then(r => r.data),
  })

  useDocumentMeta({
    title: data?.equipo ? `${data.equipo.nombre} — Equipo` : 'Equipo',
    description: data?.equipo ? `Plantilla y resultados de ${data.equipo.nombre}` : undefined,
    ogImage: data?.equipo?.logo,
  })

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)', color: 'var(--color-fg-muted)' }}>Cargando...</div>
  if (!data) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)', color: 'var(--color-destructive)' }}>Equipo no encontrado</div>

  const { equipo, jugadores, partidos } = data
  const ultimos5 = [...partidos].filter(p => p.estado === 'jugado' || p.estado === 'wo').slice(-5)

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <Link to={`/${username}/${ligaSlug}`} className="flex items-center gap-2 text-sm mb-6 cursor-pointer" style={{ color: 'var(--color-fg-muted)' }}>
          <ArrowLeft size={16} /> Volver al torneo
        </Link>

        {/* Header equipo */}
        <div className="rounded-2xl p-6 text-center mb-6 glow-card" style={{ background: 'var(--color-primary)' }}>
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl overflow-hidden"
            style={{ background: (equipo.color || '#22C55E') + '33', color: equipo.color || '#22C55E', border: `3px solid ${equipo.color || '#22C55E'}` }}
          >
            {equipo.logo ? <img src={equipo.logo} alt={equipo.nombre} className="w-full h-full object-cover" /> : equipo.nombre.charAt(0)}
          </div>
          <h1 className="font-display text-3xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{equipo.nombre}</h1>
        </div>

        {/* Últimos 5 resultados */}
        {ultimos5.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display text-lg mb-3" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>ÚLTIMOS RESULTADOS</h2>
            <div className="space-y-2">
              {ultimos5.map(p => {
                const esLocal = p.equipo_local_id?._id === equipo._id || p.equipo_local_id === equipo._id
                const gf = esLocal ? p.goles_local : p.goles_visitante
                const gc = esLocal ? p.goles_visitante : p.goles_local
                const res = gf > gc ? 'G' : gf === gc ? 'E' : 'P'
                const resColor = { G: '#22C55E', E: '#F59E0B', P: '#EF4444' }[res]
                const rival = esLocal ? p.equipo_visitante_id : p.equipo_local_id
                return (
                  <div key={p._id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs" style={{ background: resColor + '22', color: resColor }}>{res}</div>
                    <span className="flex-1 text-sm" style={{ color: 'var(--color-fg-muted)' }}>vs {rival?.nombre || 'Rival'}</span>
                    <span className="font-display text-lg" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{gf} – {gc}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Plantilla */}
        <div>
          <h2 className="font-display text-lg mb-3" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>PLANTILLA ({jugadores.length})</h2>
          <div className="grid grid-cols-3 gap-3">
            {jugadores.map(j => (
              <div key={j._id} className="rounded-2xl p-4 text-center glow-card" style={{ background: 'var(--color-primary)' }}>
                <div className="w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center overflow-hidden" style={{ background: 'var(--color-secondary)', border: `2px solid ${equipo.color || '#22C55E'}` }}>
                  {j.foto ? <img src={j.foto} alt={j.nombre} className="w-full h-full object-cover" /> : <User size={22} style={{ color: 'var(--color-fg-muted)' }} />}
                </div>
                {j.numero_camiseta && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-md" style={{ background: 'var(--color-accent)', color: '#020617' }}>#{j.numero_camiseta}</span>
                )}
                <p className="text-xs font-medium mt-1 truncate" style={{ color: 'var(--color-fg)' }}>{j.nombre}</p>
                <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{j.posicion}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
