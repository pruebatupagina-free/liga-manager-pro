import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Download, TrendingUp } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import client from '../api/client'

const TABS = ['Tabla', 'Goleadores', 'Rendimiento', 'Comparativa']

const RESULTADO_STYLE = {
  G: { bg: 'rgba(34,197,94,0.2)', color: '#22C55E' },
  E: { bg: 'rgba(245,158,11,0.2)', color: '#F59E0B' },
  D: { bg: 'rgba(239,68,68,0.2)', color: '#EF4444' },
}

function TablaTab({ liga_id }) {
  const { data: tabla = [] } = useQuery({
    queryKey: ['tabla', liga_id],
    queryFn: () => client.get('/estadisticas/tabla', { params: { liga_id } }).then(r => r.data),
  })
  function exportar(tipo) { window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/estadisticas/export/${tipo}?liga_id=${liga_id}`, '_blank') }

  return (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        <button onClick={() => exportar('pdf')} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs cursor-pointer" style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}><Download size={14} /> PDF</button>
        <button onClick={() => exportar('excel')} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs cursor-pointer" style={{ background: 'var(--color-secondary)', color: 'var(--color-fg)' }}><Download size={14} /> Excel</button>
      </div>
      <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--color-border)' }}>
        <table className="w-full text-sm" style={{ background: 'var(--color-primary)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['#', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'Pts'].map(h => (
                <th key={h} className="px-3 py-3 text-left font-semibold text-xs uppercase tracking-wide" style={{ color: 'var(--color-fg-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabla.map((row, i) => (
              <tr
                key={row.equipo._id}
                className="hover:bg-white/5 transition-all"
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  opacity: row.equipo.baja?.activa ? 0.5 : 1,
                }}
              >
                <td className="px-3 py-3 font-display text-lg" style={{ color: i < 3 ? 'var(--color-accent)' : 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>{row.posicion}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: row.equipo.color || '#94A3B8' }} />
                    <span style={{ color: 'var(--color-fg)' }}>{row.equipo.nombre}</span>
                    {row.equipo.baja?.activa && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}>Baja</span>}
                  </div>
                </td>
                {[row.PJ, row.PG, row.PE, row.PP, row.GF, row.GC].map((v, j) => (
                  <td key={j} className="px-3 py-3 text-center" style={{ color: 'var(--color-fg-muted)' }}>{v}</td>
                ))}
                <td className="px-3 py-3 text-center" style={{ color: row.DG > 0 ? '#22C55E' : row.DG < 0 ? '#EF4444' : 'var(--color-fg-muted)' }}>{row.DG > 0 ? '+' : ''}{row.DG}</td>
                <td className="px-3 py-3 text-center font-bold" style={{ color: 'var(--color-fg)' }}>{row.Pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GoleadoresTab({ liga_id }) {
  const { data: lista = [] } = useQuery({
    queryKey: ['goleadores', liga_id],
    queryFn: () => client.get('/estadisticas/goleadores', { params: { liga_id } }).then(r => r.data),
  })

  const top3 = lista.slice(0, 3)
  const resto = lista.slice(3, 10)
  const maxGoles = lista[0]?.goles || 1
  const podiumColors = ['#F59E0B', '#94A3B8', '#CD7F32']
  const podiumLabels = ['1°', '2°', '3°']

  return (
    <div className="space-y-6">
      {/* Podio */}
      {top3.length > 0 && (
        <div className="flex items-end justify-center gap-4">
          {[top3[1], top3[0], top3[2]].filter(Boolean).map((j, i) => {
            const rank = i === 1 ? 0 : i === 0 ? 1 : 2
            const heights = ['h-28', 'h-36', 'h-24']
            return (
              <div key={j?.jugador?._id} className={`flex flex-col items-center ${heights[rank]} justify-end`}>
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold mb-2 overflow-hidden"
                  style={{ border: `3px solid ${podiumColors[rank]}`, background: 'var(--color-secondary)' }}
                >
                  {j?.jugador?.foto ? <img src={j.jugador.foto} alt="" className="w-full h-full object-cover" /> : j?.jugador?.nombre?.charAt(0)}
                </div>
                <div
                  className={`w-24 rounded-t-xl flex flex-col items-center justify-center py-3 ${heights[rank]}`}
                  style={{ background: podiumColors[rank] + '22', border: `1px solid ${podiumColors[rank]}` }}
                >
                  <span className="font-display text-2xl" style={{ color: podiumColors[rank], fontFamily: 'var(--font-display)' }}>{j?.goles}</span>
                  <span className="text-xs font-medium text-center leading-tight px-1" style={{ color: 'var(--color-fg)' }}>{j?.jugador?.nombre}</span>
                  <span className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{podiumLabels[rank]}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {/* Posiciones 4-10 */}
      <div className="space-y-2">
        {resto.map((j, i) => (
          <div key={j.jugador?._id} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
            <span className="w-6 text-center font-display text-sm" style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}>{i + 4}</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0" style={{ background: 'var(--color-secondary)' }}>
              {j.jugador?.foto ? <img src={j.jugador.foto} alt="" className="w-full h-full object-cover" /> : j.jugador?.nombre?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-fg)' }}>{j.jugador?.nombre}</p>
              <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{j.equipo?.nombre}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-secondary)' }}>
                <div className="h-full rounded-full" style={{ width: `${(j.goles / maxGoles) * 100}%`, background: j.equipo?.color || 'var(--color-accent)' }} />
              </div>
              <span className="font-display text-lg w-6 text-right" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{j.goles}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RendimientoTab({ liga_id, equipos }) {
  const [equipoId, setEquipoId] = useState(equipos[0]?._id || '')

  const { data } = useQuery({
    queryKey: ['rendimiento', liga_id, equipoId],
    queryFn: () => client.get('/estadisticas/rendimiento', { params: { liga_id, equipo_id: equipoId } }).then(r => r.data),
    enabled: !!equipoId,
  })

  const porJornada = data?.por_jornada || []
  const racha = data?.racha || {}
  const ultimos5 = porJornada.filter(j => j.resultado).slice(-5)

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-fg-muted)' }}>Equipo</label>
        <select
          value={equipoId}
          onChange={e => setEquipoId(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
          style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}
        >
          {equipos.map(e => <option key={e._id} value={e._id}>{e.nombre}</option>)}
        </select>
      </div>

      {racha.tipo && (
        <div className="flex items-center gap-4">
          <div className="rounded-xl px-4 py-3" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
            <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>Racha actual</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-display text-2xl" style={{ color: RESULTADO_STYLE[racha.tipo]?.color, fontFamily: 'var(--font-display)' }}>{racha.cantidad}</span>
              <span className="text-sm font-medium" style={{ color: RESULTADO_STYLE[racha.tipo]?.color }}>
                {racha.tipo === 'G' ? 'victorias' : racha.tipo === 'E' ? 'empates' : 'derrotas'}
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            {ultimos5.map((j, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: RESULTADO_STYLE[j.resultado]?.bg, color: RESULTADO_STYLE[j.resultado]?.color }}
              >
                {j.resultado}
              </div>
            ))}
          </div>
        </div>
      )}

      {porJornada.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={porJornada} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <XAxis dataKey="jornada" stroke="#334155" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis stroke="#334155" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 12 }} />
              <Legend />
              <Line type="monotone" dataKey="goles_favor" name="GF" stroke="#22C55E" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="goles_contra" name="GC" stroke="#EF4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function ComparativaTab({ liga_id, equipos }) {
  const [eq1, setEq1] = useState(equipos[0]?._id || '')
  const [eq2, setEq2] = useState(equipos[1]?._id || '')

  const { data } = useQuery({
    queryKey: ['comparativa', liga_id, eq1, eq2],
    queryFn: () => client.get('/estadisticas/comparativa', { params: { liga_id, equipo1: eq1, equipo2: eq2 } }).then(r => r.data),
    enabled: !!eq1 && !!eq2 && eq1 !== eq2,
  })

  const e1 = equipos.find(e => e._id === eq1)
  const e2 = equipos.find(e => e._id === eq2)
  const resumen = data?.resumen
  const historial = data?.historial || []

  const radarData = resumen ? [
    { metric: 'Victorias', A: resumen.ganaE1, B: resumen.ganaE2 },
    { metric: 'Goles', A: resumen.gE1, B: resumen.gE2 },
    { metric: 'Partidos', A: resumen.partidos, B: resumen.partidos },
    { metric: 'Empates', A: resumen.empates, B: resumen.empates },
  ] : []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {[{ val: eq1, set: setEq1, label: 'Equipo 1' }, { val: eq2, set: setEq2, label: 'Equipo 2' }].map(({ val, set, label }) => (
          <div key={label}>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-fg-muted)' }}>{label}</label>
            <select value={val} onChange={e => set(e.target.value)} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer" style={{ background: 'var(--color-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-fg)' }}>
              {equipos.map(e => <option key={e._id} value={e._id}>{e.nombre}</option>)}
            </select>
          </div>
        ))}
      </div>

      {resumen && (
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: e1?.nombre, value: resumen.ganaE1, color: e1?.color || '#22C55E' },
            { label: 'Empates', value: resumen.empates, color: '#F59E0B' },
            { label: e2?.nombre, value: resumen.ganaE2, color: e2?.color || '#EF4444' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl p-4" style={{ background: 'var(--color-primary)', border: `1px solid ${color}40` }}>
              <p className="font-display text-3xl" style={{ color, fontFamily: 'var(--font-display)' }}>{value}</p>
              <p className="text-xs mt-1 truncate" style={{ color: 'var(--color-fg-muted)' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {radarData.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <PolarRadiusAxis stroke="#334155" tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <Radar name={e1?.nombre} dataKey="A" stroke={e1?.color || '#22C55E'} fill={e1?.color || '#22C55E'} fillOpacity={0.2} />
              <Radar name={e2?.nombre} dataKey="B" stroke={e2?.color || '#EF4444'} fill={e2?.color || '#EF4444'} fillOpacity={0.2} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {historial.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--color-fg-muted)' }}>Historial de enfrentamientos</p>
          <div className="space-y-2">
            {historial.map(p => (
              <div key={p._id} className="flex items-center justify-between text-sm px-4 py-2.5 rounded-xl" style={{ background: 'var(--color-secondary)' }}>
                <span className="flex-1 truncate" style={{ color: 'var(--color-fg-muted)' }}>{p.equipo_local_id?.nombre || 'Local'}</span>
                <span className="font-display mx-3" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>{p.goles_local} – {p.goles_visitante}</span>
                <span className="flex-1 truncate text-right" style={{ color: 'var(--color-fg-muted)' }}>{p.equipo_visitante_id?.nombre || 'Visit.'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function EstadisticasPage() {
  const { liga_id } = useParams()
  const [tab, setTab] = useState(0)

  const { data: equipos = [] } = useQuery({
    queryKey: ['equipos', liga_id],
    queryFn: () => client.get('/equipos', { params: { liga_id } }).then(r => r.data),
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>ESTADÍSTICAS</h1>
      </div>

      <div className="flex gap-1 mb-6 rounded-2xl p-1" style={{ background: 'var(--color-primary)' }}>
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer"
            style={{
              background: tab === i ? 'var(--color-secondary)' : 'transparent',
              color: tab === i ? 'var(--color-fg)' : 'var(--color-fg-muted)',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="animate-fade-in">
        {tab === 0 && <TablaTab liga_id={liga_id} />}
        {tab === 1 && <GoleadoresTab liga_id={liga_id} />}
        {tab === 2 && <RendimientoTab liga_id={liga_id} equipos={equipos} />}
        {tab === 3 && <ComparativaTab liga_id={liga_id} equipos={equipos} />}
      </div>
    </div>
  )
}
