import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Users, Calendar, BarChart2, Star } from 'lucide-react'
import client from '../../api/client'

const TABS = ['Tabla', 'Goleadores', 'Equipos', 'Jornadas']

function TablaPublica({ username, ligaSlug }) {
  const { data: tabla = [] } = useQuery({
    queryKey: ['pub-tabla', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/tabla`).then(r => r.data),
  })
  return (
    <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--color-border)' }}>
      <table className="w-full text-sm" style={{ background: 'var(--color-primary)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['#', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'Pts'].map(h => (
              <th key={h} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-fg-muted)' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tabla.map(row => (
            <tr key={row.equipo._id} className="hover:bg-white/5 transition-all" style={{ borderBottom: '1px solid var(--color-border)', opacity: row.equipo.baja?.activa ? 0.5 : 1 }}>
              <td className="px-3 py-3 font-display text-lg" style={{ color: row.posicion <= 3 ? 'var(--color-accent)' : 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>{row.posicion}</td>
              <td className="px-3 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: row.equipo.color || '#94A3B8' }} />
                  <span style={{ color: 'var(--color-fg)' }}>{row.equipo.nombre}</span>
                </div>
              </td>
              {[row.PJ, row.PG, row.PE, row.PP, row.GF, row.GC].map((v, i) => (
                <td key={i} className="px-3 py-3 text-center" style={{ color: 'var(--color-fg-muted)' }}>{v}</td>
              ))}
              <td className="px-3 py-3 text-center" style={{ color: row.DG > 0 ? '#22C55E' : row.DG < 0 ? '#EF4444' : 'var(--color-fg-muted)' }}>{row.DG > 0 ? '+' : ''}{row.DG}</td>
              <td className="px-3 py-3 text-center font-bold" style={{ color: 'var(--color-fg)' }}>{row.Pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GoleadoresPublicos({ username, ligaSlug }) {
  const { data: lista = [] } = useQuery({
    queryKey: ['pub-goles', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/goleadores`).then(r => r.data),
  })
  const max = lista[0]?.goles || 1
  return (
    <div className="space-y-2">
      {lista.slice(0, 20).map((j, i) => (
        <div key={j.jugador?._id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
          <span className="w-6 text-center font-display text-sm" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>{i + 1}</span>
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'var(--color-secondary)' }}>
            {j.jugador?.foto ? <img src={j.jugador.foto} alt="" className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-xs">{j.jugador?.nombre?.charAt(0)}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>{j.jugador?.nombre}</p>
            <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{j.equipo?.nombre}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-secondary)' }}>
              <div className="h-full rounded-full" style={{ width: `${(j.goles / max) * 100}%`, background: 'var(--color-accent)' }} />
            </div>
            <span className="font-display text-lg w-5 text-right" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{j.goles}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function TorneoPublico() {
  const { username, ligaSlug } = useParams()
  const [tab, setTab] = useState(0)

  const { data, isLoading } = useQuery({
    queryKey: ['pub-liga', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}`).then(r => r.data),
  })

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)', color: 'var(--color-fg-muted)' }}>Cargando...</div>
  if (!data) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)', color: 'var(--color-destructive)' }}>Liga no encontrada</div>

  const { liga, equipos, jornadas } = data

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="px-4 py-8 text-center" style={{ background: 'var(--color-primary)', borderBottom: '1px solid var(--color-border)' }}>
        {liga.logo && <img src={liga.logo} alt={liga.nombre} className="w-16 h-16 rounded-2xl mx-auto mb-4 object-cover" />}
        <h1 className="font-display text-4xl mb-2" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{liga.nombre}</h1>
        <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>
          {equipos.length} equipos · {jornadas.filter(j => j.estado === 'jugada').length}/{jornadas.length} jornadas
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 rounded-2xl p-1 mb-6" style={{ background: 'var(--color-primary)' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} className="flex-1 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer" style={{ background: tab === i ? 'var(--color-secondary)' : 'transparent', color: tab === i ? 'var(--color-fg)' : 'var(--color-fg-muted)' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && <TablaPublica username={username} ligaSlug={ligaSlug} />}

        {tab === 1 && <GoleadoresPublicos username={username} ligaSlug={ligaSlug} />}

        {tab === 2 && (
          <div className="grid gap-3">
            {equipos.map(e => (
              <Link key={e._id} to={`/${username}/${ligaSlug}/equipo/${e.slug}`} className="flex items-center gap-4 rounded-2xl px-5 py-4 glow-card hover:scale-[1.01] transition-all cursor-pointer" style={{ background: 'var(--color-primary)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0" style={{ background: (e.color || '#22C55E') + '33', color: e.color || '#22C55E' }}>
                  {e.logo ? <img src={e.logo} alt="" className="w-8 h-8 rounded-lg object-cover" /> : e.nombre.charAt(0)}
                </div>
                <span className="font-semibold" style={{ color: 'var(--color-fg)' }}>{e.nombre}</span>
              </Link>
            ))}
          </div>
        )}

        {tab === 3 && (
          <div className="space-y-2">
            {jornadas.map(j => (
              <div key={j._id} className="flex items-center gap-4 rounded-xl px-5 py-3" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-display text-sm" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}>{j.numero}</div>
                <span className="flex-1 text-sm" style={{ color: 'var(--color-fg)' }}>Jornada {j.numero}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: j.estado === 'jugada' ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.15)', color: j.estado === 'jugada' ? '#22C55E' : '#94A3B8' }}>{j.estado}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
