import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { ClipboardList, ExternalLink, CheckCircle2 } from 'lucide-react'
import { estadoBadge } from '../../components/ui/Badge'
import client from '../../api/client'

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, '') || ''

function PartidoCard({ p, onCapturar, isPending }) {
  const local = p.equipo_local_id
  const visitante = p.equipo_visitante_id
  const jornada = p.jornada_id
  const liga = p.liga_id
  const isPendiente = p.estado === 'pendiente'

  return (
    <div className="rounded-2xl p-4 space-y-3 glow-card" style={{ background: 'var(--color-primary)' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: 'var(--color-accent)' }}>
            {liga?.nombre}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--color-fg-muted)' }}>
            Jornada {jornada?.numero}
            {jornada?.fecha ? ` · ${new Date(jornada.fecha).toLocaleDateString('es-MX')}` : ''}
            {p.hora ? ` · ${p.hora}` : ''}
            {p.cancha ? ` · Cancha ${p.cancha}` : ''}
          </p>
        </div>
        {estadoBadge(p.estado)}
      </div>

      <div className="grid grid-cols-3 items-center gap-2 py-1">
        <p
          className="text-sm font-semibold text-right truncate"
          style={{ color: local?.color_principal || 'var(--color-fg)' }}
        >
          {local?.nombre || '—'}
        </p>
        <div className="text-center">
          {p.estado === 'jugado' ? (
            <span
              className="font-display text-xl"
              style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}
            >
              {p.goles_local} – {p.goles_visitante}
            </span>
          ) : (
            <span className="text-xs font-medium" style={{ color: 'var(--color-fg-muted)' }}>VS</span>
          )}
        </div>
        <p
          className="text-sm font-semibold truncate"
          style={{ color: visitante?.color_principal || 'var(--color-fg)' }}
        >
          {visitante?.nombre || '—'}
        </p>
      </div>

      {isPendiente && (
        <button
          onClick={() => onCapturar(p._id)}
          disabled={isPending}
          className="w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: 'var(--color-accent)', color: '#020617' }}
        >
          <ExternalLink size={14} />
          {isPending ? 'Abriendo...' : 'Capturar resultado'}
        </button>
      )}

      {p.estado === 'jugado' && (
        <div className="flex items-center gap-2 text-xs" style={{ color: '#22C55E' }}>
          <CheckCircle2 size={14} />
          Resultado registrado
        </div>
      )}
    </div>
  )
}

export default function MisPartidosPage() {
  const { data: partidos = [], isLoading } = useQuery({
    queryKey: ['mis-partidos'],
    queryFn: () => client.get('/arbitro/mis-partidos').then(r => r.data),
    refetchInterval: 30000,
  })

  const generarToken = useMutation({
    mutationFn: partidoId => client.post(`/partidos/${partidoId}/generar-token`),
    onSuccess: (res) => {
      const url = `${window.location.origin}${BASE_URL}/arbitro/${res.data.token}`
      window.open(url, '_blank')
    },
    onError: () => toast.error('Error al abrir el panel de captura'),
  })

  const pendientes = partidos.filter(p => p.estado === 'pendiente')
  const jugados = partidos.filter(p => p.estado !== 'pendiente')

  if (isLoading) return (
    <div className="p-6 text-center py-20" style={{ color: 'var(--color-fg-muted)' }}>
      Cargando partidos...
    </div>
  )

  if (partidos.length === 0) return (
    <div className="p-6 max-w-2xl mx-auto text-center py-20">
      <ClipboardList size={48} className="mx-auto mb-4" style={{ color: 'var(--color-fg-muted)' }} />
      <p className="font-semibold" style={{ color: 'var(--color-fg)' }}>Sin partidos asignados</p>
      <p className="text-sm mt-1" style={{ color: 'var(--color-fg-muted)' }}>
        El administrador te asignará partidos próximamente.
      </p>
    </div>
  )

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1
          className="font-display text-4xl"
          style={{ color: 'var(--color-fg)', fontFamily: 'var(--font-display)' }}
        >
          MIS PARTIDOS
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-fg-muted)' }}>
          {partidos.length} partido(s) asignado(s)
        </p>
      </div>

      {pendientes.length > 0 && (
        <div className="mb-6">
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--color-fg-muted)' }}
          >
            Pendientes ({pendientes.length})
          </h2>
          <div className="space-y-3">
            {pendientes.map(p => (
              <PartidoCard
                key={p._id}
                p={p}
                onCapturar={id => generarToken.mutate(id)}
                isPending={generarToken.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {jugados.length > 0 && (
        <div>
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--color-fg-muted)' }}
          >
            Historial ({jugados.length})
          </h2>
          <div className="space-y-3">
            {jugados.map(p => (
              <PartidoCard
                key={p._id}
                p={p}
                onCapturar={id => generarToken.mutate(id)}
                isPending={generarToken.isPending}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
