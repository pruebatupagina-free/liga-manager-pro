import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Calendar } from 'lucide-react'
import client from '../../api/client'
import useDocumentMeta from '../../hooks/useDocumentMeta'

export default function PerfilPublico() {
  const { username } = useParams()
  const { data, isLoading } = useQuery({
    queryKey: ['public-perfil', username],
    queryFn: () => client.get(`/public/${username}`).then(r => r.data),
  })

  useDocumentMeta({
    title: data?.admin ? `${data.admin.nombre || data.admin.username} — Ligas` : 'Perfil',
    description: data?.admin ? `Ligas organizadas por ${data.admin.nombre || data.admin.username}` : undefined,
  })

  if (isLoading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)', color: 'var(--color-fg-muted)' }}>Cargando...</div>
  if (!data) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)', color: 'var(--color-destructive)' }}>Usuario no encontrado</div>

  return (
    <div className="min-h-screen px-4 py-10 max-w-2xl mx-auto" style={{ background: 'var(--color-bg)' }}>
      <div className="text-center mb-10">
        <h1 className="font-display text-5xl mb-2" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-display)' }}>
          {data.admin?.nombre || data.admin?.username}
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-fg-muted)' }}>Ligas organizadas</p>
      </div>
      <div className="space-y-3">
        {data.ligas?.map(liga => (
          <Link
            key={liga._id}
            to={`/${username}/${liga.slug}`}
            className="flex items-center gap-4 rounded-2xl px-5 py-4 glow-card hover:scale-[1.01] transition-all cursor-pointer"
            style={{ background: 'var(--color-primary)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
              <Trophy size={20} style={{ color: 'var(--color-accent)' }} />
            </div>
            <div className="flex-1">
              <p className="font-semibold" style={{ color: 'var(--color-fg)' }}>{liga.nombre}</p>
              <p className="text-xs" style={{ color: 'var(--color-fg-muted)' }}>{liga.configuracion?.deporte || 'Fútbol'}</p>
            </div>
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-medium"
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
    </div>
  )
}
