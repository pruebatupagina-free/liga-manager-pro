import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Calendar, Clock, AlertTriangle, Star, Users, BarChart2, Goal, ShieldAlert } from 'lucide-react'
import client from '../../api/client'
import useDocumentMeta from '../../hooks/useDocumentMeta'

const TABS = [
  { key: 'tabla', label: 'Tabla', icon: BarChart2 },
  { key: 'proximos', label: 'Próximos', icon: Clock },
  { key: 'resultados', label: 'Resultados', icon: Trophy },
  { key: 'goleadores', label: 'Goleadores', icon: Goal },
  { key: 'mvps', label: 'MVP', icon: Star },
  { key: 'tarjetas', label: 'Tarjetas', icon: AlertTriangle },
  { key: 'sanciones', label: 'Sanciones', icon: ShieldAlert },
  { key: 'jornadas', label: 'Jornadas', icon: Calendar },
  { key: 'equipos', label: 'Equipos', icon: Users },
]

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
                  <div className="w-2 h-2 rounded-full" style={{ background: row.equipo.color_principal || '#94A3B8' }} />
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
  if (!lista.length) return <EmptyState icon={Goal} text="Aún no hay goles registrados" />
  return (
    <div className="space-y-2">
      {lista.slice(0, 30).map((j, i) => (
        <div key={j.jugador?._id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
          <span className="w-6 text-center font-display text-sm" style={{ color: i < 3 ? 'var(--color-accent)' : 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>{i + 1}</span>
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'var(--color-secondary)' }}>
            {j.jugador?.foto
              ? <img src={j.jugador.foto} alt="" className="w-full h-full object-cover" />
              : <span className="text-xs font-bold" style={{ color: 'var(--color-fg)' }}>{j.jugador?.nombre?.charAt(0)}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>{j.jugador?.nombre}</p>
            <p className="text-xs truncate" style={{ color: 'var(--color-fg-muted)' }}>{j.equipo?.nombre}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 rounded-full overflow-hidden hidden sm:block" style={{ background: 'var(--color-secondary)' }}>
              <div className="h-full rounded-full" style={{ width: `${(j.goles / max) * 100}%`, background: 'var(--color-accent)' }} />
            </div>
            <span className="font-display text-lg w-7 text-right" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{j.goles}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function ProximosPartidos({ username, ligaSlug }) {
  const { data: lista = [] } = useQuery({
    queryKey: ['pub-proximos', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/proximos`).then(r => r.data),
  })
  if (!lista.length) return <EmptyState icon={Clock} text="No hay partidos programados" />

  // Agrupar por jornada
  const grouped = {}
  lista.forEach(p => {
    const k = p.jornada_id?.numero || 0
    if (!grouped[k]) grouped[k] = { jornada: p.jornada_id, partidos: [] }
    grouped[k].partidos.push(p)
  })

  return (
    <div className="space-y-5">
      {Object.values(grouped).map(g => (
        <div key={g.jornada?._id}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="font-display text-xs uppercase tracking-wider" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>
              Jornada {g.jornada?.numero}
            </span>
            {g.jornada?.fecha && (
              <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                · {new Date(g.jornada.fecha).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {g.partidos.map(p => <PartidoCard key={p._id} partido={p} username={username} ligaSlug={ligaSlug} pendiente />)}
          </div>
        </div>
      ))}
    </div>
  )
}

function ResultadosRecientes({ username, ligaSlug }) {
  const { data: lista = [] } = useQuery({
    queryKey: ['pub-resultados', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/resultados`).then(r => r.data),
  })
  if (!lista.length) return <EmptyState icon={Trophy} text="Aún no hay resultados" />
  return (
    <div className="space-y-2">
      {lista.map(p => <PartidoCard key={p._id} partido={p} username={username} ligaSlug={ligaSlug} />)}
    </div>
  )
}

function MVPsPublicos({ username, ligaSlug }) {
  const { data: lista = [] } = useQuery({
    queryKey: ['pub-mvps', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/mvps`).then(r => r.data),
  })
  if (!lista.length) return <EmptyState icon={Star} text="Aún no hay MVPs" />
  return (
    <div className="space-y-2">
      {lista.slice(0, 30).map((j, i) => (
        <div key={j.jugador?._id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
          <span className="w-6 text-center font-display text-sm" style={{ color: i < 3 ? 'var(--color-accent)' : 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>{i + 1}</span>
          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'var(--color-secondary)' }}>
            {j.jugador?.foto ? <img src={j.jugador.foto} alt="" className="w-full h-full object-cover" /> : <Star size={14} style={{ color: 'var(--color-accent)' }} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>{j.jugador?.nombre}</p>
            <p className="text-xs truncate" style={{ color: 'var(--color-fg-muted)' }}>{j.equipo?.nombre}</p>
          </div>
          <div className="flex items-center gap-1">
            <Star size={14} style={{ color: 'var(--color-accent)', fill: 'var(--color-accent)' }} />
            <span className="font-display text-lg w-5 text-right" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{j.mvps}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function TarjetasPublicas({ username, ligaSlug }) {
  const { data: lista = [] } = useQuery({
    queryKey: ['pub-tarjetas', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/tarjetas`).then(r => r.data),
  })
  if (!lista.length) return <EmptyState icon={AlertTriangle} text="Sin amonestaciones registradas" />
  return (
    <div className="space-y-2">
      {lista.slice(0, 30).map((j, i) => (
        <div key={j.jugador?._id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
          <span className="w-6 text-center font-display text-sm" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>{i + 1}</span>
          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'var(--color-secondary)' }}>
            {j.jugador?.foto ? <img src={j.jugador.foto} alt="" className="w-full h-full object-cover" /> : <span className="text-xs font-bold" style={{ color: 'var(--color-fg)' }}>{j.jugador?.nombre?.charAt(0)}</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>{j.jugador?.nombre}</p>
            <p className="text-xs truncate" style={{ color: 'var(--color-fg-muted)' }}>{j.equipo?.nombre}</p>
          </div>
          <div className="flex items-center gap-3">
            {j.amarillas > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-4 rounded-sm" style={{ background: '#FACC15' }} />
                <span className="font-display text-sm" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{j.amarillas}</span>
              </div>
            )}
            {j.rojas > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-4 rounded-sm" style={{ background: '#EF4444' }} />
                <span className="font-display text-sm" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{j.rojas}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function SancionesPublicas({ username, ligaSlug }) {
  const { data: lista = [] } = useQuery({
    queryKey: ['pub-sanciones', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/sanciones`).then(r => r.data),
  })
  if (!lista.length) return <EmptyState icon={ShieldAlert} text="No hay sanciones activas" />
  return (
    <div className="space-y-2">
      {lista.map(s => (
        <div key={s._id} className="rounded-xl px-4 py-3" style={{ background: 'var(--color-primary)', border: '1px solid #EF444433' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center" style={{ background: '#EF444422' }}>
              <ShieldAlert size={16} style={{ color: '#EF4444' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--color-fg)' }}>{s.jugador_id?.nombre}</p>
              <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{s.jugador_id?.equipo_id?.nombre}</p>
            </div>
            <div className="text-right">
              <span className="font-display text-lg" style={{ color: '#EF4444', fontFamily: 'var(--font-display)' }}>{s.jornadas_suspension}J</span>
              <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>desde J{s.jornada_inicio}</p>
            </div>
          </div>
          {s.motivo && <p className="text-xs mt-2 pl-12" style={{ color: 'var(--color-fg-muted)' }}>{s.motivo}</p>}
        </div>
      ))}
    </div>
  )
}

function JornadasLista({ username, ligaSlug, jornadas, onSelect }) {
  if (!jornadas?.length) return <EmptyState icon={Calendar} text="No hay jornadas configuradas" />
  return (
    <div className="space-y-2">
      {jornadas.map(j => (
        <button
          key={j._id}
          onClick={() => onSelect(j.numero)}
          className="w-full flex items-center gap-4 rounded-xl px-5 py-3 cursor-pointer hover:scale-[1.01] transition-all text-left"
          style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center font-display text-sm" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}>
            {j.numero}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-fg)' }}>Jornada {j.numero}</p>
            {j.fecha && <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{new Date(j.fecha).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' })}</p>}
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: j.estado === 'finalizada' ? 'rgba(34,197,94,0.15)' : j.estado === 'en_curso' ? 'rgba(245,158,11,0.15)' : 'rgba(148,163,184,0.15)', color: j.estado === 'finalizada' ? '#22C55E' : j.estado === 'en_curso' ? '#F59E0B' : '#94A3B8' }}>
            {j.estado}
          </span>
        </button>
      ))}
    </div>
  )
}

function JornadaDetalle({ username, ligaSlug, numero, onBack }) {
  const { data, isLoading } = useQuery({
    queryKey: ['pub-jornada', username, ligaSlug, numero],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}/jornada/${numero}`).then(r => r.data),
  })
  if (isLoading) return <LoadingState />
  if (!data) return null
  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-sm mb-4 cursor-pointer" style={{ color: 'var(--color-fg-muted)' }}>
        ← Volver a jornadas
      </button>
      <h3 className="font-display text-2xl mb-4" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>Jornada {numero}</h3>
      <div className="space-y-3">
        {data.partidos.map(p => (
          <div key={p._id} className="rounded-2xl p-4" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
            <PartidoCardInline partido={p} />
            {p.goles?.length > 0 && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Goles</p>
                <div className="space-y-1">
                  {p.goles.map(g => (
                    <div key={g._id} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                      <Goal size={12} style={{ color: 'var(--color-accent)' }} />
                      <span style={{ color: 'var(--color-fg)' }}>{g.jugador_id?.nombre}</span>
                      <span>· {g.equipo_id?.nombre}</span>
                      {g.minuto != null && <span>· min {g.minuto}'</span>}
                      {g.tipo === 'penal' && <span>(penal)</span>}
                      {g.tipo === 'autogol' && <span>(autogol)</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {p.tarjetas?.length > 0 && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-xs font-semibold uppercase mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>Tarjetas</p>
                <div className="space-y-1">
                  {p.tarjetas.map(t => (
                    <div key={t._id} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                      <div className="w-2.5 h-3.5 rounded-sm" style={{ background: t.tipo === 'amarilla' ? '#FACC15' : '#EF4444' }} />
                      <span style={{ color: 'var(--color-fg)' }}>{t.jugador_id?.nombre}</span>
                      <span>· {t.equipo_id?.nombre}</span>
                      {t.minuto != null && <span>· min {t.minuto}'</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {p.mvp_jugador_id && (
              <div className="mt-3 pt-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--color-border)' }}>
                <Star size={12} style={{ color: 'var(--color-accent)', fill: 'var(--color-accent)' }} />
                <span className="text-xs font-semibold uppercase" style={{ color: 'var(--color-fg-muted)' }}>MVP:</span>
                <span className="text-xs" style={{ color: 'var(--color-fg)' }}>{p.mvp_jugador_id?.nombre}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function PartidoCard({ partido: p, username, ligaSlug, pendiente }) {
  return (
    <div className="rounded-xl px-3 py-3 sm:px-4" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between gap-2 mb-1.5 text-xs" style={{ color: 'var(--color-fg-muted)' }}>
        <span>J{p.jornada_id?.numero || '?'} · Cancha {p.cancha}</span>
        {p.hora && <span className="font-mono">{p.hora}</span>}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Link to={`/${username}/${ligaSlug}/equipo/${p.equipo_local_id?.slug}`} className="flex items-center gap-2 cursor-pointer min-w-0 justify-end">
          <span className="text-sm font-medium truncate text-right" style={{ color: 'var(--color-fg)' }}>{p.equipo_local_id?.nombre}</span>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden" style={{ background: (p.equipo_local_id?.color_principal || '#22C55E') + '33', color: p.equipo_local_id?.color_principal || '#22C55E' }}>
            {p.equipo_local_id?.logo ? <img src={p.equipo_local_id.logo} alt="" className="w-full h-full object-cover" /> : p.equipo_local_id?.nombre?.charAt(0)}
          </div>
        </Link>
        <div className="px-3 py-1 rounded-lg text-center min-w-[60px]" style={{ background: pendiente ? 'transparent' : 'var(--color-secondary)' }}>
          {pendiente
            ? <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>VS</span>
            : <span className="font-display text-base" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{p.goles_local} – {p.goles_visitante}</span>
          }
        </div>
        <Link to={`/${username}/${ligaSlug}/equipo/${p.equipo_visitante_id?.slug}`} className="flex items-center gap-2 cursor-pointer min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden" style={{ background: (p.equipo_visitante_id?.color_principal || '#22C55E') + '33', color: p.equipo_visitante_id?.color_principal || '#22C55E' }}>
            {p.equipo_visitante_id?.logo ? <img src={p.equipo_visitante_id.logo} alt="" className="w-full h-full object-cover" /> : p.equipo_visitante_id?.nombre?.charAt(0)}
          </div>
          <span className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>{p.equipo_visitante_id?.nombre}</span>
        </Link>
      </div>
      {p.estado === 'wo' && <p className="text-xs text-center mt-1.5" style={{ color: '#F59E0B' }}>WO</p>}
    </div>
  )
}

function PartidoCardInline({ partido: p }) {
  const jugado = p.estado === 'jugado' || p.estado === 'wo'
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <div className="flex items-center gap-2 justify-end min-w-0">
        <span className="text-sm font-medium truncate text-right" style={{ color: 'var(--color-fg)' }}>{p.equipo_local_id?.nombre}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden" style={{ background: (p.equipo_local_id?.color_principal || '#22C55E') + '33', color: p.equipo_local_id?.color_principal || '#22C55E' }}>
          {p.equipo_local_id?.logo ? <img src={p.equipo_local_id.logo} alt="" className="w-full h-full object-cover" /> : p.equipo_local_id?.nombre?.charAt(0)}
        </div>
      </div>
      <div className="px-3 py-1 rounded-lg text-center min-w-[70px]" style={{ background: 'var(--color-secondary)' }}>
        {jugado
          ? <span className="font-display text-lg" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{p.goles_local} – {p.goles_visitante}</span>
          : <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{p.hora || 'VS'}</span>
        }
      </div>
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden" style={{ background: (p.equipo_visitante_id?.color_principal || '#22C55E') + '33', color: p.equipo_visitante_id?.color_principal || '#22C55E' }}>
          {p.equipo_visitante_id?.logo ? <img src={p.equipo_visitante_id.logo} alt="" className="w-full h-full object-cover" /> : p.equipo_visitante_id?.nombre?.charAt(0)}
        </div>
        <span className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>{p.equipo_visitante_id?.nombre}</span>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="rounded-2xl py-16 text-center" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
      <Icon size={36} className="mx-auto mb-3" style={{ color: 'var(--color-fg-muted)', opacity: 0.5 }} />
      <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>{text}</p>
    </div>
  )
}

function LoadingState() {
  return <div className="text-center py-10 text-sm" style={{ color: 'var(--color-fg-muted)' }}>Cargando...</div>
}

export default function TorneoPublico() {
  const { username, ligaSlug } = useParams()
  const [tab, setTab] = useState('tabla')
  const [jornadaSel, setJornadaSel] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['pub-liga', username, ligaSlug],
    queryFn: () => client.get(`/public/${username}/${ligaSlug}`).then(r => r.data),
  })

  useDocumentMeta({
    title: data?.liga ? `${data.liga.nombre} — Liga en LigaManager Pro` : 'Liga — LigaManager Pro',
    description: data?.liga ? `Tabla, goleadores, calendario y resultados de ${data.liga.nombre}` : undefined,
    ogTitle: data?.liga?.nombre,
    ogDescription: data?.liga ? `Sigue tu liga: tabla, goleadores, próximos partidos y resultados.` : undefined,
  })

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)', color: 'var(--color-fg-muted)' }}>Cargando...</div>
  if (!data) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)', color: 'var(--color-destructive)' }}>Liga no encontrada</div>

  const { liga, equipos, jornadas } = data
  const jugadas = jornadas.filter(j => j.estado === 'finalizada').length

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Header */}
      <div className="px-4 py-10 text-center" style={{ background: 'radial-gradient(ellipse at 50% 0%, #0F2A1A 0%, var(--color-primary) 60%)', borderBottom: '1px solid var(--color-border)' }}>
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center font-bold text-xl"
          style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--color-accent)' }}
        >
          <Trophy size={28} />
        </div>
        <h1 className="font-display text-4xl mb-2" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{liga.nombre}</h1>
        <div className="flex items-center justify-center gap-4 text-sm" style={{ color: 'var(--color-fg-muted)' }}>
          <span>{equipos.length} equipos</span>
          <span>·</span>
          <span>{jugadas}/{jornadas.length} jornadas</span>
          <span>·</span>
          <span style={{ color: liga.estado === 'activa' ? '#22C55E' : '#94A3B8' }}>{liga.estado}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setJornadaSel(null) }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap cursor-pointer transition-all flex-shrink-0"
              style={{ background: tab === key ? 'var(--color-accent)' : 'var(--color-primary)', color: tab === key ? '#020617' : 'var(--color-fg-muted)', border: '1px solid var(--color-border)' }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'tabla' && <TablaPublica username={username} ligaSlug={ligaSlug} />}
        {tab === 'goleadores' && <GoleadoresPublicos username={username} ligaSlug={ligaSlug} />}
        {tab === 'proximos' && <ProximosPartidos username={username} ligaSlug={ligaSlug} />}
        {tab === 'resultados' && <ResultadosRecientes username={username} ligaSlug={ligaSlug} />}
        {tab === 'mvps' && <MVPsPublicos username={username} ligaSlug={ligaSlug} />}
        {tab === 'tarjetas' && <TarjetasPublicas username={username} ligaSlug={ligaSlug} />}
        {tab === 'sanciones' && <SancionesPublicas username={username} ligaSlug={ligaSlug} />}

        {tab === 'jornadas' && !jornadaSel && (
          <JornadasLista username={username} ligaSlug={ligaSlug} jornadas={jornadas} onSelect={setJornadaSel} />
        )}
        {tab === 'jornadas' && jornadaSel && (
          <JornadaDetalle username={username} ligaSlug={ligaSlug} numero={jornadaSel} onBack={() => setJornadaSel(null)} />
        )}

        {tab === 'equipos' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {equipos.map(e => (
              <Link key={e._id} to={`/${username}/${ligaSlug}/equipo/${e.slug}`} className="flex items-center gap-4 rounded-2xl px-5 py-4 glow-card hover:scale-[1.01] transition-all cursor-pointer" style={{ background: 'var(--color-primary)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 overflow-hidden" style={{ background: (e.color_principal || '#22C55E') + '33', color: e.color_principal || '#22C55E' }}>
                  {e.logo ? <img src={e.logo} alt="" className="w-full h-full object-cover" /> : e.nombre.charAt(0)}
                </div>
                <span className="font-semibold" style={{ color: 'var(--color-fg)' }}>{e.nombre}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <footer className="text-center py-8 text-xs" style={{ color: 'var(--color-fg-muted)', borderTop: '1px solid var(--color-border)' }}>
        Powered by <Link to="/" className="font-semibold cursor-pointer" style={{ color: 'var(--color-accent)' }}>LigaManager Pro</Link>
      </footer>
    </div>
  )
}
