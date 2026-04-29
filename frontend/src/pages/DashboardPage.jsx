import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Calendar, Trophy, DollarSign, AlertTriangle, Plus } from 'lucide-react'
import { StatCard } from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { startTour } from '../utils/tour'
import client from '../api/client'

function LicenciaBanner({ licencia }) {
  if (!licencia || licencia.estado === 'activa') return null
  const dias = licencia.fecha_vencimiento
    ? Math.ceil((new Date(licencia.fecha_vencimiento) - new Date()) / 86400000)
    : 0

  if (licencia.estado === 'vencida' || licencia.estado === 'suspendida') {
    return (
      <div
        className="rounded-xl p-4 flex items-center gap-3 animate-pulse-glow mb-6"
        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444' }}
      >
        <AlertTriangle size={20} style={{ color: '#EF4444' }} />
        <div>
          <p className="font-semibold text-sm" style={{ color: '#EF4444' }}>
            {licencia.estado === 'vencida' ? 'Licencia vencida' : 'Licencia suspendida'}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
            Contacta al administrador para renovar tu plan.
          </p>
        </div>
      </div>
    )
  }

  if (licencia.estado === 'por_vencer' && dias <= 15) {
    const isUrgent = dias <= 7
    return (
      <div
        className={`rounded-xl p-4 flex items-center gap-3 mb-6 ${isUrgent ? 'animate-pulse-glow' : ''}`}
        style={{
          background: isUrgent ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
          border: `1px solid ${isUrgent ? '#EF4444' : '#F59E0B'}`,
        }}
      >
        <AlertTriangle size={20} style={{ color: isUrgent ? '#EF4444' : '#F59E0B' }} />
        <p className="text-sm" style={{ color: isUrgent ? '#EF4444' : '#F59E0B' }}>
          Tu licencia vence en <strong>{dias} día{dias !== 1 ? 's' : ''}</strong>. Renueva para no perder el acceso.
        </p>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: ligas = [] } = useQuery({
    queryKey: ['ligas'],
    queryFn: () => client.get('/ligas').then(r => r.data),
  })

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => client.get('/auth/me').then(r => r.data),
  })

  useEffect(() => {
    if (!localStorage.getItem('tour_completado')) {
      setTimeout(() => startTour(), 800)
    }
  }, [])

  const ligasActivas = ligas.filter(l => l.estado === 'activa').length
  const totalEquipos = ligas.reduce((s, l) => s + (l.total_equipos || 0), 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <LicenciaBanner licencia={me?.licencia} />

      {/* Header */}
      <div className="flex items-center justify-between mb-8" data-tour="dashboard">
        <div>
          <h1 className="font-display text-4xl" style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}>
            DASHBOARD
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-fg-muted)' }}>
            Bienvenido, {user?.username}
          </p>
        </div>
        <Link
          to="/dashboard/ligas"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer"
          style={{ background: 'var(--color-accent)', color: '#020617' }}
          data-tour="ligas"
        >
          <Plus size={16} />
          Nueva liga
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Trophy}
          label="Ligas activas"
          value={ligasActivas}
          sub={`${ligas.length} en total`}
          accent
        />
        <StatCard
          icon={Users}
          label="Equipos"
          value={totalEquipos}
          sub="En todas las ligas"
        />
        <StatCard
          icon={Calendar}
          label="Jornadas"
          value="—"
          sub="Selecciona una liga"
        />
        <StatCard
          icon={DollarSign}
          label="Cobros"
          value="—"
          sub="Selecciona una liga"
        />
      </div>

      {/* Liga list */}
      <div>
        <h2
          className="font-display text-xl mb-4"
          style={{ color: 'var(--color-fg-muted)', fontFamily: 'var(--font-display)' }}
        >
          MIS LIGAS
        </h2>
        {ligas.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center glow-card"
            style={{ background: 'var(--color-primary)' }}
          >
            <Trophy size={40} className="mx-auto mb-3" style={{ color: 'var(--color-fg-muted)' }} />
            <p className="font-semibold mb-1" style={{ color: 'var(--color-fg)' }}>No tienes ligas aún</p>
            <p className="text-sm mb-4" style={{ color: 'var(--color-fg-muted)' }}>
              Crea tu primera liga para empezar
            </p>
            <Link
              to="/dashboard/ligas"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--color-accent)', color: '#020617' }}
            >
              <Plus size={16} /> Crear liga
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {ligas.map(liga => (
              <Link
                key={liga._id}
                to={`/dashboard/equipos/${liga._id}`}
                className="flex items-center gap-4 rounded-xl px-5 py-4 glow-card hover:border-green-500 transition-all cursor-pointer"
                style={{ background: 'var(--color-primary)', borderColor: 'var(--color-border)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(34,197,94,0.1)' }}
                >
                  {liga.logo ? (
                    <img src={liga.logo} alt={liga.nombre} className="w-8 h-8 object-cover rounded-lg" />
                  ) : (
                    <Trophy size={20} style={{ color: 'var(--color-accent)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--color-fg)' }}>
                    {liga.nombre}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>
                    {liga.slug}
                  </p>
                </div>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                  style={{
                    background: liga.estado === 'activa' ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.15)',
                    color: liga.estado === 'activa' ? '#22C55E' : '#94A3B8',
                  }}
                >
                  {liga.estado}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
